const { db } = require("../config/database");
const { HttpError } = require("../utils/errors");

function requireGroupMember(groupId, userId) {
  const member = db.prepare("SELECT * FROM group_members WHERE group_id = ? AND user_id = ?").get(Number(groupId), Number(userId));
  if (!member) throw new HttpError(403, "You are not a member of this group");
  return member;
}

function isActiveMember(groupId, userId, date) {
  const member = db.prepare(`
    SELECT * FROM group_members
    WHERE group_id = ? AND user_id = ?
    ORDER BY joined_at DESC
    LIMIT 1
  `).get(Number(groupId), Number(userId));
  if (!member) return false;
  return member.joined_at <= date && (!member.left_at || member.left_at >= date);
}

function getGroupDetail(groupId) {
  const group = db.prepare("SELECT * FROM groups WHERE id = ?").get(Number(groupId));
  if (!group) return null;
  const members = db.prepare(`
    SELECT gm.*, u.name, u.email, u.created_at AS user_created_at
    FROM group_members gm
    JOIN users u ON u.id = gm.user_id
    WHERE gm.group_id = ?
    ORDER BY gm.left_at IS NOT NULL, gm.joined_at, u.name
  `).all(Number(groupId)).map((row) => ({
    id: row.id,
    group_id: row.group_id,
    user_id: row.user_id,
    joined_at: row.joined_at,
    left_at: row.left_at,
    user: { id: row.user_id, name: row.name, email: row.email, created_at: row.user_created_at },
  }));
  const budgets = db.prepare("SELECT * FROM budgets WHERE group_id = ? ORDER BY category").all(Number(groupId));
  return { ...group, members, budgets };
}

function listGroups(userId, search = "") {
  const term = String(search || "").toLowerCase();
  return db.prepare(`
    SELECT g.*,
      COUNT(DISTINCT gm_all.user_id) AS member_count,
      COALESCE(SUM(e.converted_amount_inr), 0) AS total_spend
    FROM groups g
    JOIN group_members gm_user ON gm_user.group_id = g.id AND gm_user.user_id = ?
    LEFT JOIN group_members gm_all ON gm_all.group_id = g.id
    LEFT JOIN expenses e ON e.group_id = g.id
    GROUP BY g.id
    ORDER BY g.created_at DESC
  `).all(Number(userId)).filter((group) => !term || group.name.toLowerCase().includes(term));
}

function createGroup(payload, ownerId) {
  const result = db.prepare("INSERT INTO groups (name, description, default_currency, emoji) VALUES (?, ?, ?, ?)")
    .run(payload.name, payload.description || "", payload.default_currency || "INR", payload.emoji || "Wallet");
  const groupId = Number(result.lastInsertRowid);
  const today = new Date().toISOString().slice(0, 10);
  db.prepare("INSERT INTO group_members (group_id, user_id, joined_at) VALUES (?, ?, ?)").run(groupId, ownerId, today);
  for (const member of payload.members || []) {
    const target = db.prepare("SELECT * FROM users WHERE email = ?").get(String(member.user_email || "").toLowerCase());
    if (target) db.prepare("INSERT INTO group_members (group_id, user_id, joined_at) VALUES (?, ?, ?)").run(groupId, target.id, member.joined_at || today);
  }
  for (const budget of payload.budgets || []) {
    if (budget.category && Number(budget.monthly_limit) > 0) {
      db.prepare("INSERT INTO budgets (group_id, category, monthly_limit, currency) VALUES (?, ?, ?, ?)")
        .run(groupId, budget.category, Number(budget.monthly_limit), budget.currency || "INR");
    }
  }
  return getGroupDetail(groupId);
}

function addMember(groupId, payload) {
  const target = db.prepare("SELECT * FROM users WHERE email = ?").get(String(payload.user_email || "").toLowerCase());
  if (!target) throw new HttpError(400, "User with this email does not exist");
  const result = db.prepare("INSERT INTO group_members (group_id, user_id, joined_at) VALUES (?, ?, ?)")
    .run(Number(groupId), target.id, payload.joined_at || new Date().toISOString().slice(0, 10));
  return getGroupDetail(groupId).members.find((member) => member.id === Number(result.lastInsertRowid));
}

function removeMember(groupId, userId) {
  db.prepare("UPDATE group_members SET left_at = ? WHERE group_id = ? AND user_id = ? AND left_at IS NULL")
    .run(new Date().toISOString().slice(0, 10), Number(groupId), Number(userId));
  return getGroupDetail(groupId).members.find((member) => member.user_id === Number(userId));
}

function upsertBudget(groupId, payload) {
  if (!payload.category || Number(payload.monthly_limit) <= 0) throw new HttpError(400, "Category and monthly limit are required");
  const existing = db.prepare("SELECT * FROM budgets WHERE group_id = ? AND lower(category) = lower(?)").get(Number(groupId), payload.category);
  if (existing) {
    db.prepare("UPDATE budgets SET monthly_limit = ?, currency = ? WHERE id = ?")
      .run(Number(payload.monthly_limit), payload.currency || "INR", existing.id);
  } else {
    db.prepare("INSERT INTO budgets (group_id, category, monthly_limit, currency) VALUES (?, ?, ?, ?)")
      .run(Number(groupId), payload.category, Number(payload.monthly_limit), payload.currency || "INR");
  }
  return getGroupDetail(groupId).budgets;
}

module.exports = {
  requireGroupMember,
  isActiveMember,
  getGroupDetail,
  listGroups,
  createGroup,
  addMember,
  removeMember,
  upsertBudget,
};
