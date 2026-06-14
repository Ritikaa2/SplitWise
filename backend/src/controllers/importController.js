const { parseCsv, parseMultipartFile } = require("../utils/csv");
const { getImportSession, processImport, validateCsvRows } = require("../models/importModel");
const { requireGroupMember } = require("../models/groupModel");

async function upload(req, res) {
  const groupId = Number(req.params.groupId);
  requireGroupMember(groupId, req.user.id);
  const fileBuffer = parseMultipartFile(req.body, req.headers["content-type"]);
  res.json(validateCsvRows(groupId, req.user.id, parseCsv(fileBuffer)));
}

async function approve(req, res) {
  const session = getImportSession(req.params.sessionId);
  if (!session) return res.status(404).json({ detail: "Import session not found" });
  requireGroupMember(session.group_id, req.user.id);
  res.json(processImport(req.params.sessionId, req.body?.actions || [], req.user.id));
}

module.exports = { upload, approve };
