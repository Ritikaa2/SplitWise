const { createSettlement, listSettlements } = require("../models/settlementModel");
const { requireGroupMember } = require("../models/groupModel");

async function index(req, res) {
  const groupId = Number(req.params.groupId);
  requireGroupMember(groupId, req.user.id);
  res.json(listSettlements(groupId));
}

async function create(req, res) {
  const groupId = Number(req.params.groupId);
  requireGroupMember(groupId, req.user.id);
  res.status(201).json(createSettlement(groupId, req.body || {}, req.user.id));
}

module.exports = { index, create };
