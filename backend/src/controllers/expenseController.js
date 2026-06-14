const { createExpense, listExpenses } = require("../models/expenseModel");
const { requireGroupMember } = require("../models/groupModel");

async function index(req, res) {
  const groupId = Number(req.params.groupId);
  requireGroupMember(groupId, req.user.id);
  res.json(listExpenses(groupId));
}

async function create(req, res) {
  const groupId = Number(req.params.groupId);
  requireGroupMember(groupId, req.user.id);
  res.status(201).json(createExpense(groupId, req.body || {}, req.user.id));
}

module.exports = { index, create };
