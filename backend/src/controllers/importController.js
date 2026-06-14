const { parseCsv, parseMultipartFile } = require("../utils/csv");
const { getImportReport, getImportSession, processImport, validateCsvRows } = require("../models/importModel");
const { requireGroupMember } = require("../models/groupModel");
const { makeTextPdf } = require("../utils/pdf");

async function upload(req, res) {
  const groupId = Number(req.params.groupId);
  await requireGroupMember(groupId, req.user.id);
  const fileBuffer = parseMultipartFile(req.body, req.headers["content-type"]);
  res.json(await validateCsvRows(groupId, req.user.id, parseCsv(fileBuffer)));
}

async function approve(req, res) {
  const session = await getImportSession(req.params.sessionId);
  if (!session) return res.status(404).json({ detail: "Import session not found" });
  await requireGroupMember(session.group_id, req.user.id);
  res.json(await processImport(req.params.sessionId, req.body?.actions || [], req.user.id));
}

async function report(req, res) {
  const data = await getImportReport(req.params.sessionId);
  await requireGroupMember(data.session.group_id, req.user.id);
  res.json(data);
}

async function reportPdf(req, res) {
  const data = await getImportReport(req.params.sessionId);
  await requireGroupMember(data.session.group_id, req.user.id);
  const lines = [
    `Session: ${data.session.id}`,
    `Status: ${data.session.status}`,
    `Rows: ${data.session.rows_count} | Imported: ${data.session.imported_count} | Skipped: ${data.session.skipped_count}`,
    "",
    "Anomalies",
    ...data.anomalies.map((item) => `Row ${item.row_number}: ${item.severity} ${item.field_name || "row"} - ${item.issue} | Action: ${item.action_taken || item.recommended_action}`),
    "",
    "Rows",
    ...data.rows.map((row) => `Row ${row.row_number}: ${row.status} ${row.action_taken || ""}`),
  ];
  const pdf = makeTextPdf("SplitWise Pro Import Report", lines);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="import-${data.session.id}.pdf"`);
  res.send(pdf);
}

module.exports = { upload, approve, report, reportPdf };
