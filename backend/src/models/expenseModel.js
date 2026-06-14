const { db } = require("../config/database");
const { HttpError } = require("../utils/errors");
const { convertToInr, round2 } = require("../utils/money");
const { isActiveMember } = require("./groupModel");

function calculateSplits(amount, splitType, participants) {
  if (!participants.length) throw new HttpError(400, "At least one participant is required");
  const total = Number(amount);
  if (splitType === "EQUAL") {
    const share = round2(total / participants.length);
    const shares = participants.map(() => share);
    shares[shares.length - 1] = round2(total - shares.slice(0, -1).reduce((sum, value) => sum + value, 0));
    return shares;
  }
  if (splitType === "EXACT") {
    const shares = participants.map((item) => Number(item.share_value || 0));
    const sum = round2(shares.reduce((acc, item) => acc + item, 0));
    if (Math.abs(sum - total) > 0.01) throw new HttpError(400, "Exact split values must add up to the expense amount");
    return shares.map(round2);
  }
  if (splitType === "PERCENTAGE") {
    const percentages = participants.map((item) => Number(item.share_value || 0));
    const sum = round2(percentages.reduce((acc, item) => acc + item, 0));
    if (Math.abs(sum - 100) > 0.01) throw new HttpError(400, "Percentage split values must add up to 100");
    return percentages.map((percent) => round2((total * percent) / 100));
  }
  if (splitType === "SHARES") {
    const weights = participants.map((item) => Number(item.share_value || 0));
    const sum = weights.reduce((acc, item) => acc + item, 0);
    if (sum <= 0) throw new HttpError(400, "Share split requires positive share values");
    return weights.map((weight) => round2((total * weight) / sum));
  }
  throw new HttpError(400, "Invalid split type");
}

function expenseResponse(expenseId) {
  const expense = db.prepare(`
    SELECT e.*, u.name AS payer_name, u.email AS payer_email, u.created_at AS payer_created_at
    FROM expenses e
    JOIN users u ON u.id = e.paid_by_id
    WHERE e.id = ?
  `).get(Number(expenseId));
  if (!expense) return null;
  const participants = db.prepare(`
    SELECT ep.*, u.name, u.email, u.created_at AS user_created_at
    FROM expense_participants ep
    JOIN users u ON u.id = ep.user_id
    WHERE ep.expense_id = ?
    ORDER BY u.name
  `).all(Number(expenseId)).map((row) => ({
    id: row.id,
    expense_id: row.expense_id,
    user_id: row.user_id,
    amount_owed: row.amount_owed,
    share_value: row.share_value,
    user: { id: row.user_id, name: row.name, email: row.email, created_at: row.user_created_at },
  }));
  return {
    id: expense.id,
    group_id: expense.group_id,
    title: expense.title,
    description: expense.description,
    amount: expense.amount,
    currency: expense.currency,
    converted_amount_inr: expense.converted_amount_inr,
    date: expense.date,
    paid_by_id: expense.paid_by_id,
    split_type: expense.split_type,
    category: expense.category,
    merchant: expense.merchant,
    is_recurring: Boolean(expense.is_recurring),
    created_at: expense.created_at,
    paid_by: { id: expense.paid_by_id, name: expense.payer_name, email: expense.payer_email, created_at: expense.payer_created_at },
    participants,
  };
}

function listExpenses(groupId) {
  return db.prepare("SELECT id FROM expenses WHERE group_id = ? ORDER BY date DESC, id DESC")
    .all(Number(groupId))
    .map((row) => expenseResponse(row.id));
}

function createExpense(groupId, payload, actingUserId) {
  const splitType = String(payload.split_type || "").toUpperCase();
  const currency = String(payload.currency || "INR").toUpperCase();
  const amount = Number(payload.amount);
  const date = payload.date || new Date().toISOString().slice(0, 10);
  if (!payload.title) throw new HttpError(400, "Title is required");
  if (!amount || amount <= 0) throw new HttpError(400, "Amount must be greater than zero");
  if (!["INR", "USD"].includes(currency)) throw new HttpError(400, "Only INR and USD are supported");
  if (!isActiveMember(groupId, Number(payload.paid_by_id), date)) {
    throw new HttpError(400, "Payer was not active in the group on the expense date");
  }
  for (const participant of payload.participants || []) {
    if (!isActiveMember(groupId, Number(participant.user_id), date)) {
      throw new HttpError(400, `Participant ${participant.user_id} was not active in the group on the expense date`);
    }
  }
  const shares = calculateSplits(amount, splitType, payload.participants || []);
  const converted = convertToInr(amount, currency);

  const tx = db.transaction(() => {
    const result = db.prepare(`
      INSERT INTO expenses (group_id, title, description, amount, currency, converted_amount_inr, date, paid_by_id, split_type, category, merchant, is_recurring)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      Number(groupId),
      payload.title,
      payload.description || "",
      amount,
      currency,
      converted,
      date,
      Number(payload.paid_by_id),
      splitType,
      payload.category || "General",
      payload.merchant || "",
      payload.is_recurring ? 1 : 0,
    );
    const expenseId = Number(result.lastInsertRowid);
    payload.participants.forEach((participant, index) => {
      db.prepare("INSERT INTO expense_participants (expense_id, user_id, amount_owed, share_value) VALUES (?, ?, ?, ?)")
        .run(expenseId, Number(participant.user_id), shares[index], participant.share_value ?? null);
    });
    db.prepare("INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)")
      .run(actingUserId, "EXPENSE_CREATED", "expense", expenseId, payload.title);
    return expenseId;
  });

  return expenseResponse(tx());
}

function calculateGroupBalances(groupId) {
  const balances = new Map();
  for (const member of db.prepare("SELECT user_id FROM group_members WHERE group_id = ?").all(Number(groupId))) {
    balances.set(member.user_id, 0);
  }
  const expenses = db.prepare("SELECT * FROM expenses WHERE group_id = ?").all(Number(groupId));
  for (const expense of expenses) {
    balances.set(expense.paid_by_id, round2((balances.get(expense.paid_by_id) || 0) + expense.converted_amount_inr));
    const participants = db.prepare("SELECT * FROM expense_participants WHERE expense_id = ?").all(expense.id);
    for (const participant of participants) {
      const inrShare = expense.amount > 0 ? expense.converted_amount_inr * (participant.amount_owed / expense.amount) : 0;
      balances.set(participant.user_id, round2((balances.get(participant.user_id) || 0) - inrShare));
    }
  }
  const settlements = db.prepare("SELECT * FROM settlements WHERE group_id = ?").all(Number(groupId));
  for (const settlement of settlements) {
    balances.set(settlement.payer_id, round2((balances.get(settlement.payer_id) || 0) + settlement.converted_amount_inr));
    balances.set(settlement.payee_id, round2((balances.get(settlement.payee_id) || 0) - settlement.converted_amount_inr));
  }
  return balances;
}

function simplifyDebts(groupId) {
  const balances = calculateGroupBalances(groupId);
  const debtors = [];
  const creditors = [];
  for (const [userId, amount] of balances.entries()) {
    if (amount < -0.01) debtors.push([userId, amount]);
    if (amount > 0.01) creditors.push([userId, amount]);
  }
  const plan = [];
  while (debtors.length && creditors.length) {
    debtors.sort((a, b) => a[1] - b[1]);
    creditors.sort((a, b) => b[1] - a[1]);
    const debtor = debtors[0];
    const creditor = creditors[0];
    const amount = round2(Math.min(Math.abs(debtor[1]), creditor[1]));
    const from = db.prepare("SELECT * FROM users WHERE id = ?").get(debtor[0]);
    const to = db.prepare("SELECT * FROM users WHERE id = ?").get(creditor[0]);
    plan.push({
      from_user_id: debtor[0],
      from_user_name: from?.name || `User ${debtor[0]}`,
      to_user_id: creditor[0],
      to_user_name: to?.name || `User ${creditor[0]}`,
      amount,
      currency: "INR",
    });
    debtor[1] = round2(debtor[1] + amount);
    creditor[1] = round2(creditor[1] - amount);
    if (Math.abs(debtor[1]) < 0.01) debtors.shift();
    if (Math.abs(creditor[1]) < 0.01) creditors.shift();
  }
  return plan;
}

function categoryBreakdown(groupIds) {
  if (!groupIds.length) return [];
  const placeholders = groupIds.map(() => "?").join(",");
  const rows = db.prepare(`
    SELECT category AS name, SUM(converted_amount_inr) AS amount
    FROM expenses
    WHERE group_id IN (${placeholders})
    GROUP BY category
    ORDER BY amount DESC
  `).all(...groupIds);
  const total = rows.reduce((sum, row) => sum + row.amount, 0) || 1;
  return rows.map((row) => ({ name: row.name || "General", value: round2((row.amount / total) * 100), amount: round2(row.amount) }));
}

module.exports = {
  calculateSplits,
  expenseResponse,
  listExpenses,
  createExpense,
  calculateGroupBalances,
  simplifyDebts,
  categoryBreakdown,
};
