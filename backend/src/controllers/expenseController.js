const { createExpense, deleteExpense, expenseResponse, listExpenses, updateExpense } = require("../models/expenseModel");
const { requireGroupMember } = require("../models/groupModel");
const { HttpError } = require("../utils/errors");

async function index(req, res) {
  const groupId = Number(req.params.groupId);
  await requireGroupMember(groupId, req.user.id);
  res.json(await listExpenses(groupId));
}

async function create(req, res) {
  const groupId = Number(req.params.groupId);
  await requireGroupMember(groupId, req.user.id);
  res.status(201).json(await createExpense(groupId, req.body || {}, req.user.id));
}

async function show(req, res) {
  const expense = await expenseResponse(Number(req.params.expenseId));
  if (!expense) throw new HttpError(404, "Expense not found");
  await requireGroupMember(expense.group_id, req.user.id);
  res.json(expense);
}

async function update(req, res) {
  const expense = await expenseResponse(Number(req.params.expenseId));
  if (!expense) throw new HttpError(404, "Expense not found");
  await requireGroupMember(expense.group_id, req.user.id);
  res.json(await updateExpense(Number(req.params.expenseId), req.body || {}, req.user.id));
}

async function destroy(req, res) {
  const expense = await expenseResponse(Number(req.params.expenseId));
  if (!expense) throw new HttpError(404, "Expense not found");
  await requireGroupMember(expense.group_id, req.user.id);
  res.json(await deleteExpense(Number(req.params.expenseId), req.user.id));
}

module.exports = { index, create, show, update, destroy };
