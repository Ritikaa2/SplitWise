const {
  addMember,
  createGroup,
  getGroupDetail,
  listGroups,
  removeMember,
  requireGroupMember,
  upsertBudget,
} = require("../models/groupModel");

async function index(req, res) {
  res.json(listGroups(req.user.id, req.query.search || ""));
}

async function create(req, res) {
  res.status(201).json(createGroup(req.body || {}, req.user.id));
}

async function show(req, res) {
  const groupId = Number(req.params.groupId);
  requireGroupMember(groupId, req.user.id);
  res.json(getGroupDetail(groupId));
}

async function createMember(req, res) {
  const groupId = Number(req.params.groupId);
  requireGroupMember(groupId, req.user.id);
  res.status(201).json(addMember(groupId, req.body || {}));
}

async function destroyMember(req, res) {
  const groupId = Number(req.params.groupId);
  requireGroupMember(groupId, req.user.id);
  res.json(removeMember(groupId, Number(req.params.userId)));
}

async function saveBudget(req, res) {
  const groupId = Number(req.params.groupId);
  requireGroupMember(groupId, req.user.id);
  res.json(upsertBudget(groupId, req.body || {}));
}

module.exports = { index, create, show, createMember, destroyMember, saveBudget };
