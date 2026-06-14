const { createSettlement, listSettlements } = require("../models/settlementModel");
const { requireGroupMember } = require("../models/groupModel");

async function index(req, res) {
  const groupId = Number(req.params.groupId);
  await requireGroupMember(groupId, req.user.id);
  res.json(await listSettlements(groupId));
}

async function create(req, res) {
  const groupId = Number(req.params.groupId);
  await requireGroupMember(groupId, req.user.id);
  res.status(201).json(await createSettlement(groupId, req.body || {}, req.user.id));
}

module.exports = { index, create };
