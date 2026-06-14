const crypto = require("node:crypto");
const { db } = require("../config/database");
const { HttpError } = require("../utils/errors");
const { isActiveMember } = require("./groupModel");
const { createExpense } = require("./expenseModel");

function anomalyRow(row) {
  return { ...row, category: row.category || "General", merchant: row.merchant || "" };
}

function rowHash(row) {
  return crypto.createHash("sha256").update(JSON.stringify(anomalyRow(row))).digest("hex");
}

async function validateCsvRows(groupId, userId, rows) {
  const sessionId = crypto.randomUUID();
  await db.prepare("INSERT INTO import_sessions (id, group_id, user_id, status, rows_count) VALUES (?, ?, ?, 'VALIDATED', ?)")
    .run(sessionId, Number(groupId), Number(userId), rows.length);
  const seenIds = new Set();
  const seenHashes = new Set();
  const insert = db.prepare(`
    INSERT INTO import_anomalies (session_id, row_number, field_name, issue, severity, recommended_action, raw_data)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const add = async (rowNumber, row, field, issue, severity = "ERROR", recommendedAction = "REVIEW") => {
    await insert.run(sessionId, rowNumber, field, issue, severity, recommendedAction, JSON.stringify(anomalyRow(row)));
  };

  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 1;
    const hash = rowHash(row);
    await db.prepare(`
      INSERT INTO import_rows (session_id, row_number, raw_data, row_hash)
      VALUES (?, ?, ?, ?)
    `).run(sessionId, rowNumber, JSON.stringify(anomalyRow(row)), hash);

    const title = row.title || "";
    const raw = JSON.stringify(row);
    if (row.id) {
      if (seenIds.has(row.id)) await add(rowNumber, row, "id", `Duplicate row ID detected: ${row.id}`, "WARNING", "SKIP");
      seenIds.add(row.id);
    }
    if (seenHashes.has(hash)) await add(rowNumber, row, "row", "Duplicate row content detected in this CSV", "WARNING", "SKIP");
    seenHashes.add(hash);
    if (!title) await add(rowNumber, row, "title", "Missing expense title");
    if (!row.description) await add(rowNumber, row, "description", "Empty description", "WARNING", "APPROVE");
    if (/(settle|payment|repay|settlement)/i.test(title)) await add(rowNumber, row, "title", `Potential settlement logged as expense ('${title}')`, "WARNING", "SKIP");

    const amount = Number(row.amount);
    if (!row.amount) await add(rowNumber, row, "amount", "Missing amount");
    else if (Number.isNaN(amount)) await add(rowNumber, row, "amount", `Invalid amount number format: ${row.amount}`);
    else if (amount < 0) await add(rowNumber, row, "amount", `Negative amount detected: ${amount}`);
    else if (amount === 0) await add(rowNumber, row, "amount", "Amount is zero");

    const currency = String(row.currency || "INR").toUpperCase();
    const group = await db.prepare("SELECT * FROM groups WHERE id = ?").get(Number(groupId));
    if (!["USD", "INR"].includes(currency)) await add(rowNumber, row, "currency", `Unsupported currency '${currency}'`);
    else if (group && group.default_currency !== currency) await add(rowNumber, row, "currency", `Currency mismatch: row currency '${currency}' does not match group default currency '${group.default_currency}'`, "WARNING", "APPROVE");

    const date = row.date || "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) await add(rowNumber, row, "date", `Invalid date format: ${date || "(missing)"} (Use YYYY-MM-DD)`);
    else if (date > new Date().toISOString().slice(0, 10)) await add(rowNumber, row, "date", `Future date detected: ${date}`);

    const splitType = String(row.split_type || "").toUpperCase();
    if (!splitType) await add(rowNumber, row, "split_type", "Missing split type");
    else if (!["EQUAL", "EXACT", "PERCENTAGE", "SHARES"].includes(splitType)) await add(rowNumber, row, "split_type", `Invalid split type '${splitType}'`);

    const payer = row.paid_by_email ? await db.prepare("SELECT * FROM users WHERE email = ?").get(row.paid_by_email.toLowerCase()) : null;
    if (!row.paid_by_email) await add(rowNumber, row, "paid_by_email", "Missing payer email");
    else if (!payer) await add(rowNumber, row, "paid_by_email", `Unknown member: Payer with email '${row.paid_by_email}' does not exist`);
    else if (/^\d{4}-\d{2}-\d{2}$/.test(date) && !(await isActiveMember(groupId, payer.id, date))) await add(rowNumber, row, "paid_by_email", `Payer '${payer.name}' was not active on ${date}`);

    const emails = row.participants_emails ? row.participants_emails.split(";").map((email) => email.trim()).filter(Boolean) : [];
    const shares = row.share_values ? row.share_values.split(";").map((value) => value.trim()).filter(Boolean) : [];
    if (!emails.length) await add(rowNumber, row, "participants_emails", "Missing participants emails list");
    for (const email of emails) {
      const participant = await db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase());
      if (!participant) await add(rowNumber, row, "participants_emails", `Unknown member: Participant with email '${email}' does not exist`);
      else if (/^\d{4}-\d{2}-\d{2}$/.test(date) && !(await isActiveMember(groupId, participant.id, date))) await add(rowNumber, row, "participants_emails", `Participant '${participant.name}' was not active on ${date}`);
    }
    if (["EXACT", "PERCENTAGE", "SHARES"].includes(splitType)) {
      if (shares.length !== emails.length) await add(rowNumber, row, "share_values", `Mismatch: split type '${splitType}' requires matching share values`);
      for (const [shareIndex, value] of shares.entries()) {
        const parsed = Number(value);
        if (Number.isNaN(parsed)) await add(rowNumber, row, "share_values", `Invalid share value for ${emails[shareIndex]}: ${value}`);
        if (parsed < 0) await add(rowNumber, row, "share_values", `Negative share value for ${emails[shareIndex]}: ${value}`);
      }
    }
    if (raw.length > 5000) await add(rowNumber, row, "row", "Row is unusually large", "WARNING");
  }

  const anomalies = await db.prepare("SELECT * FROM import_anomalies WHERE session_id = ? ORDER BY row_number, id").all(sessionId);
  const anomalousRows = new Set(anomalies.map((item) => item.row_number));
  return {
    session_id: sessionId,
    status: "VALIDATED",
    rows: rows.length,
    clean_rows: rows.length - anomalousRows.size,
    anomalies: anomalies.map((item) => ({ ...item, resolved: Boolean(item.resolved), raw_data: JSON.parse(item.raw_data) })),
  };
}

async function processImport(sessionId, actions, userId) {
  const session = await db.prepare("SELECT * FROM import_sessions WHERE id = ?").get(sessionId);
  if (!session) throw new HttpError(404, "Import session not found");
  const anomalies = await db.prepare("SELECT * FROM import_anomalies WHERE session_id = ? ORDER BY row_number, id").all(sessionId);
  const importRows = await db.prepare("SELECT * FROM import_rows WHERE session_id = ? ORDER BY row_number").all(sessionId);
  const byRow = new Map();
  for (const anomaly of anomalies) {
    if (!byRow.has(anomaly.row_number)) byRow.set(anomaly.row_number, []);
    byRow.get(anomaly.row_number).push(anomaly);
  }
  const actionByRow = new Map((actions || []).map((item) => [Number(item.row_number), String(item.action || "").toUpperCase()]));

  let imported_count = 0;
  let skipped_count = 0;
  const report = [];
  for (const importRow of importRows) {
    const rowNumber = Number(importRow.row_number);
    const rowAnomalies = byRow.get(rowNumber) || [];
    const raw = JSON.parse(importRow.raw_data);
    const issue = rowAnomalies.length
      ? rowAnomalies.map((entry) => `${entry.field_name || "row"}: ${entry.issue} (${entry.severity})`).join("; ")
      : "No anomalies found";
    const severity = rowAnomalies.some((entry) => entry.severity === "ERROR") ? "ERROR" : "WARNING";
    const recommended = rowAnomalies.find((entry) => entry.recommended_action === "SKIP") ? "SKIP" : "APPROVE";
    const action = actionByRow.get(rowNumber) || (severity === "ERROR" ? "SKIP" : recommended);
    if (action === "SKIP") {
      skipped_count += 1;
      report.push({ row_number: rowNumber, issue, severity, action_taken: "SKIPPED", timestamp: new Date().toISOString() });
      await db.prepare("UPDATE import_rows SET status = 'SKIPPED', action_taken = 'SKIPPED' WHERE id = ?").run(importRow.id);
      await db.prepare("UPDATE import_anomalies SET resolved = 1, action_taken = 'SKIPPED' WHERE session_id = ? AND row_number = ?")
        .run(sessionId, rowNumber);
      continue;
    }
    try {
      const payer = await db.prepare("SELECT * FROM users WHERE email = ?").get(String(raw.paid_by_email || "").toLowerCase());
      const emails = String(raw.participants_emails || "").split(";").map((email) => email.trim()).filter(Boolean);
      const shareValues = String(raw.share_values || "").split(";").map((value) => value.trim()).filter(Boolean);
      const participants = emails.map((email, index) => {
        return { email, share_value: shareValues[index] ? Number(shareValues[index]) : null };
      });
      for (const participant of participants) {
        const user = await db.prepare("SELECT * FROM users WHERE email = ?").get(participant.email.toLowerCase());
        if (!user) throw new Error(`Unknown participant ${participant.email}`);
        participant.user_id = user.id;
        delete participant.email;
      }
      if (!payer) throw new Error(`Unknown payer ${raw.paid_by_email}`);
      const created = await createExpense(session.group_id, {
        title: raw.title,
        description: raw.description || "",
        amount: Number(raw.amount),
        currency: String(raw.currency || "INR").toUpperCase(),
        date: raw.date,
        paid_by_id: payer.id,
        split_type: String(raw.split_type || "EQUAL").toUpperCase(),
        category: raw.category || "General",
        merchant: raw.merchant || "",
        participants,
      }, userId);
      imported_count += 1;
      report.push({ row_number: rowNumber, issue, severity, action_taken: "IMPORTED", timestamp: new Date().toISOString() });
      await db.prepare("UPDATE import_rows SET status = 'IMPORTED', action_taken = 'IMPORTED', created_expense_id = ? WHERE id = ?")
        .run(created.id, importRow.id);
      await db.prepare("UPDATE import_anomalies SET resolved = 1, action_taken = 'IMPORTED' WHERE session_id = ? AND row_number = ?")
        .run(sessionId, rowNumber);
    } catch (error) {
      skipped_count += 1;
      report.push({ row_number: rowNumber, issue: `${issue}; Exec failed: ${error.message}`, severity: "ERROR", action_taken: "SKIPPED_ON_FAILURE", timestamp: new Date().toISOString() });
      await db.prepare("UPDATE import_rows SET status = 'FAILED', action_taken = 'SKIPPED_ON_FAILURE' WHERE id = ?").run(importRow.id);
    }
  }
  await db.prepare("UPDATE import_sessions SET status = 'COMPLETED', imported_count = ?, skipped_count = ? WHERE id = ?")
    .run(imported_count, skipped_count, sessionId);
  return { session_id: sessionId, imported_count, skipped_count, report };
}

async function getImportSession(sessionId) {
  return db.prepare("SELECT * FROM import_sessions WHERE id = ?").get(sessionId);
}

async function getImportReport(sessionId) {
  const session = await getImportSession(sessionId);
  if (!session) throw new HttpError(404, "Import session not found");
  const rows = await db.prepare("SELECT * FROM import_rows WHERE session_id = ? ORDER BY row_number").all(sessionId);
  const anomalies = await db.prepare("SELECT * FROM import_anomalies WHERE session_id = ? ORDER BY row_number, id").all(sessionId);
  return {
    session,
    rows: rows.map((row) => ({ ...row, raw_data: JSON.parse(row.raw_data) })),
    anomalies: anomalies.map((item) => ({ ...item, resolved: Boolean(item.resolved), raw_data: JSON.parse(item.raw_data) })),
  };
}

module.exports = { validateCsvRows, processImport, getImportSession, getImportReport };
