const {
  addMember,
  createGroup,
  deleteGroup,
  getGroupDetail,
  listGroups,
  removeMember,
  requireGroupMember,
  updateGroup,
  updateMember,
  upsertBudget,
} = require("../models/groupModel");

async function index(req, res) {
  res.json(await listGroups(req.user.id, req.query.search || ""));
}

async function create(req, res) {
  res.status(201).json(await createGroup(req.body || {}, req.user.id));
}

async function update(req, res) {
  const groupId = Number(req.params.groupId);
  await requireGroupMember(groupId, req.user.id);
  res.json(await updateGroup(groupId, req.body || {}));
}

async function destroy(req, res) {
  const groupId = Number(req.params.groupId);
  await requireGroupMember(groupId, req.user.id);
  res.json(await deleteGroup(groupId));
}

async function show(req, res) {
  const groupId = Number(req.params.groupId);
  await requireGroupMember(groupId, req.user.id);
  res.json(await getGroupDetail(groupId));
}

async function createMember(req, res) {
  const groupId = Number(req.params.groupId);
  await requireGroupMember(groupId, req.user.id);
  res.status(201).json(await addMember(groupId, req.body || {}));
}

async function destroyMember(req, res) {
  const groupId = Number(req.params.groupId);
  await requireGroupMember(groupId, req.user.id);
  res.json(await removeMember(groupId, Number(req.params.userId)));
}

async function patchMember(req, res) {
  const groupId = Number(req.params.groupId);
  await requireGroupMember(groupId, req.user.id);
  res.json(await updateMember(groupId, Number(req.params.userId), req.body || {}));
}

async function saveBudget(req, res) {
  const groupId = Number(req.params.groupId);
  await requireGroupMember(groupId, req.user.id);
  res.json(await upsertBudget(groupId, req.body || {}));
}

module.exports = { index, create, update, destroy, show, createMember, destroyMember, patchMember, saveBudget };
