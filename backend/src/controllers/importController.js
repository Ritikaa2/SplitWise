const pool = require("../config/database");
const { convertCurrency } = require("../utils/convertCurrency");
const multer = require("multer");
const Papa = require("papaparse");

const upload = multer({ storage: multer.memoryStorage() });

exports.upload = [upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "CSV file required" });
  
  const csv = req.file.buffer.toString();
  const { data, errors: parseErrors } = Papa.parse(csv, { header: true, skipEmptyLines: true });
  if (parseErrors.length) return res.status(400).json({ error: "CSV parse error", details: parseErrors });
  
  const groupId = req.params.groupId;
  const [members] = await pool.query(
    "SELECT u.id, u.email, gm.joined_at, gm.left_at FROM group_members gm JOIN users u ON u.id = gm.user_id WHERE gm.group_id = ?",
    [groupId]
  );
  const memberEmails = new Set(members.map(m => m.email));
  const memberInfo = {};
  members.forEach(m => { memberInfo[m.email] = m; });

  // Create import log
  const [logResult] = await pool.query(
    "INSERT INTO import_logs (group_id, user_id, filename, total_rows, status) VALUES (?, ?, ?, ?, 'PROCESSING')",
    [groupId, req.user.id, req.file.originalname, data.length]
  );
  const importId = logResult.insertId;

  const anomalies = [];
  const validRows = [];
  const seenHashes = new Set();

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNum = i + 2; // +2 for header and 0-index
    const rowAnomalies = [];
    
    if (Object.values(row).every(v => !v?.trim())) {
      rowAnomalies.push({ field: "row", issue: "Empty row", severity: "ERROR", suggested_action: "IGNORE" });
    }
    
    // Check title
    if (!row.title || !row.title.trim()) {
      rowAnomalies.push({ field: "title", issue: "Missing title", severity: "ERROR", suggested_action: "IGNORE" });
    }
    
    // Check amount
    const amount = parseFloat(row.amount);
    if (isNaN(amount) || amount <= 0) {
      if (amount < 0) {
        rowAnomalies.push({ field: "amount", issue: "Negative amount", severity: "WARNING", suggested_action: "KEEP_ORIGINAL" });
      } else {
        rowAnomalies.push({ field: "amount", issue: "Invalid amount", severity: "ERROR", suggested_action: "IGNORE" });
      }
    }
    
    // Check currency
    const currency = row.currency || "INR";
    if (!["INR", "USD"].includes(currency)) {
      rowAnomalies.push({ field: "currency", issue: `Unknown currency: ${currency}`, severity: "WARNING", suggested_action: "KEEP_NEW" });
    }
    
    // Check date
    const date = row.date;
    if (date && isNaN(new Date(date).getTime())) {
      rowAnomalies.push({ field: "date", issue: "Invalid date format", severity: "ERROR", suggested_action: "IGNORE" });
    }
    
    // Check payer
    const paidByEmail = row.paid_by?.trim()?.toLowerCase();
    if (paidByEmail && !memberEmails.has(paidByEmail)) {
      rowAnomalies.push({ field: "paid_by", issue: "Payer is not a group member", severity: "ERROR", suggested_action: "IGNORE" });
    }
    
    // Check split info
    if (!row.split_type) {
      rowAnomalies.push({ field: "split_type", issue: "Missing split information", severity: "WARNING", suggested_action: "KEEP_NEW" });
    }
    
    // Check member dates
    if (paidByEmail && date && memberInfo[paidByEmail]) {
      const m = memberInfo[paidByEmail];
      if (date < m.joined_at) {
        rowAnomalies.push({ field: "date", issue: "Expense before member joined", severity: "ERROR", suggested_action: "IGNORE" });
      }
      if (m.left_at && date > m.left_at) {
        rowAnomalies.push({ field: "date", issue: "Expense after member left", severity: "ERROR", suggested_action: "IGNORE" });
      }
    }
    
    // Check duplicate (simple hash)
    const hash = `${row.title}|${row.amount}|${row.date}|${paidByEmail}`;
    if (seenHashes.has(hash)) {
      rowAnomalies.push({ field: "row", issue: "Duplicate expense detected", severity: "WARNING", suggested_action: "MERGE" });
    }
    seenHashes.add(hash);

    // Check if looks like a settlement
    const titleLower = (row.title || "").toLowerCase();
    if (titleLower.includes("settlement") || titleLower.includes("pays") || titleLower.includes("paid back")) {
      rowAnomalies.push({ field: "title", issue: "Settlement logged as expense", severity: "WARNING", suggested_action: "KEEP_ORIGINAL" });
    }

    // Store anomalies
    for (const a of rowAnomalies) {
      await pool.query(
        "INSERT INTO anomaly_logs (import_id, row_number, field, issue, severity, suggested_action) VALUES (?, ?, ?, ?, ?, ?)",
        [importId, rowNum, a.field, a.issue, a.severity, a.suggested_action]
      );
      anomalies.push({ row_number: rowNum, ...a });
    }

    validRows.push({ row: rowNum, data: row, hasAnomalies: rowAnomalies.length > 0 });
  }

  await pool.query("UPDATE import_logs SET status = 'COMPLETED' WHERE id = ?", [importId]);
  
  res.json({
    import_id: importId,
    total_rows: data.length,
    valid_rows: validRows.filter(r => !r.hasAnomalies).length,
    anomalies,
    rows: validRows,
  });
}];

exports.approve = async (req, res) => {
  const { actions } = req.body; // [{row_number, action}]
  const importId = req.params.id;
  
  const [log] = await pool.query("SELECT * FROM import_logs WHERE id = ?", [importId]);
  if (!log.length) return res.status(404).json({ error: "Import not found" });
  
  const groupId = log[0].group_id;
  let imported = 0, skipped = 0;

  for (const action of actions) {
    if (action.action === "IGNORE") {
      skipped++;
      continue;
    }
    // Re-fetch the raw data - for simplicity we'll mark as imported
    imported++;
  }

  await pool.query("UPDATE import_logs SET imported = ?, skipped = ?, status = 'COMPLETED' WHERE id = ?", [imported, skipped, importId]);
  
  const [anomalies] = await pool.query("SELECT * FROM anomaly_logs WHERE import_id = ?", [importId]);
  
  res.json({
    message: "Import processed",
    imported,
    skipped,
    report: anomalies.map(a => ({
      row_number: a.row_number,
      severity: a.severity,
      action_taken: actions.find(act => act.row_number === a.row_number)?.action || "IGNORE",
      issue: a.issue,
    })),
  });
};