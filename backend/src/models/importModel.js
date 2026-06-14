const crypto = require("node:crypto");
const { db } = require("../config/database");
const { HttpError } = require("../utils/errors");
const { isActiveMember } = require("./groupModel");
const { createExpense } = require("./expenseModel");

function anomalyRow(row) {
  return { ...row, category: row.category || "General", merchant: row.merchant || "" };
}

function validateCsvRows(groupId, userId, rows) {
  const sessionId = crypto.randomUUID();
  db.prepare("INSERT INTO import_sessions (id, group_id, user_id, status) VALUES (?, ?, ?, 'VALIDATED')")
    .run(sessionId, Number(groupId), Number(userId));
  const seenIds = new Set();
  const insert = db.prepare(`
    INSERT INTO import_anomalies (session_id, row_number, field_name, issue, severity, raw_data)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const add = (rowNumber, row, field, issue, severity = "ERROR") => {
    insert.run(sessionId, rowNumber, field, issue, severity, JSON.stringify(anomalyRow(row)));
  };

  rows.forEach((row, index) => {
    const rowNumber = index + 1;
    const title = row.title || "";
    const raw = JSON.stringify(row);
    if (row.id) {
      if (seenIds.has(row.id)) add(rowNumber, row, "id", `Duplicate row ID detected: ${row.id}`);
      seenIds.add(row.id);
    }
    if (!title) add(rowNumber, row, "title", "Missing expense title");
    if (!row.description) add(rowNumber, row, "description", "Empty description", "WARNING");
    if (/(settle|payment|repay|settlement)/i.test(title)) add(rowNumber, row, "title", `Potential settlement logged as expense ('${title}')`, "WARNING");

    const amount = Number(row.amount);
    if (!row.amount) add(rowNumber, row, "amount", "Missing amount");
    else if (Number.isNaN(amount)) add(rowNumber, row, "amount", `Invalid amount number format: ${row.amount}`);
    else if (amount < 0) add(rowNumber, row, "amount", `Negative amount detected: ${amount}`);
    else if (amount === 0) add(rowNumber, row, "amount", "Amount is zero");

    const currency = String(row.currency || "INR").toUpperCase();
    const group = db.prepare("SELECT * FROM groups WHERE id = ?").get(Number(groupId));
    if (!["USD", "INR"].includes(currency)) add(rowNumber, row, "currency", `Unsupported currency '${currency}'`);
    else if (group && group.default_currency !== currency) add(rowNumber, row, "currency", `Currency mismatch: row currency '${currency}' does not match group default currency '${group.default_currency}'`, "WARNING");

    const date = row.date || "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) add(rowNumber, row, "date", `Invalid date format: ${date || "(missing)"} (Use YYYY-MM-DD)`);
    else if (date > new Date().toISOString().slice(0, 10)) add(rowNumber, row, "date", `Future date detected: ${date}`);

    const splitType = String(row.split_type || "").toUpperCase();
    if (!splitType) add(rowNumber, row, "split_type", "Missing split type");
    else if (!["EQUAL", "EXACT", "PERCENTAGE", "SHARES"].includes(splitType)) add(rowNumber, row, "split_type", `Invalid split type '${splitType}'`);

    const payer = row.paid_by_email ? db.prepare("SELECT * FROM users WHERE email = ?").get(row.paid_by_email.toLowerCase()) : null;
    if (!row.paid_by_email) add(rowNumber, row, "paid_by_email", "Missing payer email");
    else if (!payer) add(rowNumber, row, "paid_by_email", `Unknown member: Payer with email '${row.paid_by_email}' does not exist`);
    else if (/^\d{4}-\d{2}-\d{2}$/.test(date) && !isActiveMember(groupId, payer.id, date)) add(rowNumber, row, "paid_by_email", `Payer '${payer.name}' was not active on ${date}`);

    const emails = row.participants_emails ? row.participants_emails.split(";").map((email) => email.trim()).filter(Boolean) : [];
    const shares = row.share_values ? row.share_values.split(";").map((value) => value.trim()).filter(Boolean) : [];
    if (!emails.length) add(rowNumber, row, "participants_emails", "Missing participants emails list");
    emails.forEach((email) => {
      const participant = db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase());
      if (!participant) add(rowNumber, row, "participants_emails", `Unknown member: Participant with email '${email}' does not exist`);
      else if (/^\d{4}-\d{2}-\d{2}$/.test(date) && !isActiveMember(groupId, participant.id, date)) add(rowNumber, row, "participants_emails", `Participant '${participant.name}' was not active on ${date}`);
    });
    if (["EXACT", "PERCENTAGE", "SHARES"].includes(splitType)) {
      if (shares.length !== emails.length) add(rowNumber, row, "share_values", `Mismatch: split type '${splitType}' requires matching share values`);
      shares.forEach((value, shareIndex) => {
        const parsed = Number(value);
        if (Number.isNaN(parsed)) add(rowNumber, row, "share_values", `Invalid share value for ${emails[shareIndex]}: ${value}`);
        if (parsed < 0) add(rowNumber, row, "share_values", `Negative share value for ${emails[shareIndex]}: ${value}`);
      });
    }
    if (raw.length > 5000) add(rowNumber, row, "row", "Row is unusually large", "WARNING");
  });

  const anomalies = db.prepare("SELECT * FROM import_anomalies WHERE session_id = ? ORDER BY row_number, id").all(sessionId);
  return {
    session_id: sessionId,
    status: "VALIDATED",
    rows: rows.length,
    anomalies: anomalies.map((item) => ({ ...item, resolved: Boolean(item.resolved), raw_data: JSON.parse(item.raw_data) })),
  };
}

function processImport(sessionId, actions, userId) {
  const session = db.prepare("SELECT * FROM import_sessions WHERE id = ?").get(sessionId);
  if (!session) throw new HttpError(404, "Import session not found");
  const anomalies = db.prepare("SELECT * FROM import_anomalies WHERE session_id = ? ORDER BY row_number, id").all(sessionId);
  const byRow = new Map();
  for (const anomaly of anomalies) {
    if (!byRow.has(anomaly.row_number)) byRow.set(anomaly.row_number, []);
    byRow.get(anomaly.row_number).push(anomaly);
  }

  let imported_count = 0;
  let skipped_count = 0;
  const report = [];
  for (const item of actions || []) {
    const rowNumber = Number(item.row_number);
    const rowAnomalies = byRow.get(rowNumber) || [];
    const raw = rowAnomalies[0] ? JSON.parse(rowAnomalies[0].raw_data) : null;
    if (!raw) continue;
    const issue = rowAnomalies.map((entry) => `${entry.field_name || "row"}: ${entry.issue} (${entry.severity})`).join("; ");
    const severity = rowAnomalies.some((entry) => entry.severity === "ERROR") ? "ERROR" : "WARNING";
    if (String(item.action || "SKIP").toUpperCase() === "SKIP") {
      skipped_count += 1;
      report.push({ row_number: rowNumber, issue, severity, action_taken: "SKIPPED", timestamp: new Date().toISOString() });
      continue;
    }
    try {
      const payer = db.prepare("SELECT * FROM users WHERE email = ?").get(String(raw.paid_by_email || "").toLowerCase());
      const emails = String(raw.participants_emails || "").split(";").map((email) => email.trim()).filter(Boolean);
      const shareValues = String(raw.share_values || "").split(";").map((value) => value.trim()).filter(Boolean);
      const participants = emails.map((email, index) => {
        const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase());
        if (!user) throw new Error(`Unknown participant ${email}`);
        return { user_id: user.id, share_value: shareValues[index] ? Number(shareValues[index]) : null };
      });
      if (!payer) throw new Error(`Unknown payer ${raw.paid_by_email}`);
      createExpense(session.group_id, {
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
    } catch (error) {
      skipped_count += 1;
      report.push({ row_number: rowNumber, issue: `${issue}; Exec failed: ${error.message}`, severity: "ERROR", action_taken: "SKIPPED_ON_FAILURE", timestamp: new Date().toISOString() });
    }
  }
  db.prepare("UPDATE import_sessions SET status = 'COMPLETED' WHERE id = ?").run(sessionId);
  return { session_id: sessionId, imported_count, skipped_count, report };
}

function getImportSession(sessionId) {
  return db.prepare("SELECT * FROM import_sessions WHERE id = ?").get(sessionId);
}

module.exports = { validateCsvRows, processImport, getImportSession };
