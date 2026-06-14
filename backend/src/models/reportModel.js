const { db } = require("../config/database");
const { round2 } = require("../utils/money");
const { calculateGroupBalances, categoryBreakdown, simplifyDebts } = require("./expenseModel");

function monthKey(date) {
  return String(date || "").slice(0, 7);
}

async function dashboard(userId) {
  const groups = await db.prepare("SELECT g.* FROM groups g JOIN group_members gm ON gm.group_id = g.id WHERE gm.user_id = ?")
    .all(Number(userId));
  const groupIds = groups.map((group) => group.id);
  let total_expenses = 0;
  let amount_spent = 0;
  let amount_owed = 0;
  let amount_to_receive = 0;
  const recent_activity = [];
  const monthly = new Map();
  const recurring = [];

  for (const group of groups) {
    const balances = await calculateGroupBalances(group.id);
    const userBalance = balances.get(Number(userId)) || 0;
    amount_to_receive += Math.max(userBalance, 0);
    amount_owed += Math.abs(Math.min(userBalance, 0));
    for (const expense of await db.prepare("SELECT * FROM expenses WHERE group_id = ? ORDER BY date DESC").all(group.id)) {
      total_expenses += expense.converted_amount_inr;
      monthly.set(monthKey(expense.date), round2((monthly.get(monthKey(expense.date)) || 0) + expense.converted_amount_inr));
      if (expense.paid_by_id === Number(userId)) amount_spent += expense.converted_amount_inr;
      if (expense.is_recurring) recurring.push({ id: expense.id, title: expense.title, group: group.name, amount: expense.converted_amount_inr, category: expense.category });
      recent_activity.push({
        id: expense.id,
        group: group.name,
        title: expense.title,
        amount: expense.converted_amount_inr,
        date: expense.date,
        category: expense.category,
        merchant: expense.merchant,
      });
    }
  }

  const monthly_expenses = [...monthly.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([key, amount]) => ({ month: key.slice(5), amount }));

  const budgets = groupIds.length
    ? (await db.prepare(`
        SELECT b.category, b.monthly_limit, b.currency, g.name AS group_name,
          COALESCE(SUM(CASE WHEN e.date >= DATE_FORMAT(CURRENT_DATE(), '%Y-%m-01') THEN e.converted_amount_inr ELSE 0 END), 0) AS spent
        FROM budgets b
        JOIN groups g ON g.id = b.group_id
        LEFT JOIN expenses e ON e.group_id = b.group_id AND e.category = b.category
        WHERE b.group_id IN (${groupIds.map(() => "?").join(",")})
        GROUP BY b.id
        ORDER BY spent DESC
      `).all(...groupIds)).map((item) => ({
        ...item,
        spent: round2(item.spent),
        progress: round2(Math.min(100, (item.spent / item.monthly_limit) * 100)),
      }))
    : [];

  return {
    total_expenses: round2(total_expenses),
    amount_spent: round2(amount_spent),
    amount_owed: round2(amount_owed),
    amount_to_receive: round2(amount_to_receive),
    active_groups: groups.length,
    pending_settlements: (await Promise.all(groups.map((group) => simplifyDebts(group.id)))).reduce((sum, plan) => sum + plan.length, 0),
    monthly_expenses: monthly_expenses.length ? monthly_expenses : [
      { month: "Jan", amount: 0 },
      { month: "Feb", amount: 0 },
      { month: "Mar", amount: 0 },
      { month: "Apr", amount: 0 },
      { month: "May", amount: 0 },
      { month: "Jun", amount: 0 },
    ],
    category_breakdown: await categoryBreakdown(groupIds),
    recent_activity: recent_activity.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10),
    budgets,
    recurring,
    insights: [
      "Recurring items are tracked separately so monthly obligations are visible before settlement.",
      "Category budgets compare this month against group limits.",
      "Settlement plans are calculated after reimbursements, not just raw expenses.",
    ],
  };
}

async function groupBalances(groupId) {
  const balances = await calculateGroupBalances(groupId);
  const rows = [];
  for (const [user_id, amount] of balances.entries()) {
    const user = await db.prepare("SELECT name FROM users WHERE id = ?").get(user_id);
    rows.push({ user_id, user_name: user?.name || `User ${user_id}`, amount: round2(amount), currency: "INR" });
  }
  return {
    balances: rows,
    settlement_plan: await simplifyDebts(groupId),
  };
}

async function auditFeed(userId) {
  return db.prepare(`
    SELECT a.*, u.name AS actor
    FROM audit_logs a
    LEFT JOIN users u ON u.id = a.user_id
    WHERE a.user_id = ? OR a.user_id IS NULL
    ORDER BY a.timestamp DESC
    LIMIT 25
  `).all(Number(userId));
}

module.exports = { dashboard, groupBalances, auditFeed };
