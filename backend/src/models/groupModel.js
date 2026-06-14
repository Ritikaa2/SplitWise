const { db } = require("../config/database");
const { HttpError } = require("../utils/errors");

async function requireGroupMember(groupId, userId) {
  const member = await db.prepare("SELECT * FROM group_members WHERE group_id = ? AND user_id = ?").get(Number(groupId), Number(userId));
  if (!member) throw new HttpError(403, "You are not a member of this group");
  return member;
}

async function isActiveMember(groupId, userId, date) {
  const member = await db.prepare(`
    SELECT * FROM group_members
    WHERE group_id = ? AND user_id = ?
    ORDER BY joined_at DESC
    LIMIT 1
  `).get(Number(groupId), Number(userId));
  if (!member) return false;
  return member.joined_at <= date && (!member.left_at || member.left_at >= date);
}

async function getGroupDetail(groupId) {
  const group = await db.prepare("SELECT * FROM groups WHERE id = ?").get(Number(groupId));
  if (!group) return null;
  const members = (await db.prepare(`
    SELECT gm.*, u.name, u.email, u.created_at AS user_created_at
    FROM group_members gm
    JOIN users u ON u.id = gm.user_id
    WHERE gm.group_id = ?
    ORDER BY gm.left_at IS NOT NULL, gm.joined_at, u.name
  `).all(Number(groupId))).map((row) => ({
    id: row.id,
    group_id: row.group_id,
    user_id: row.user_id,
    joined_at: row.joined_at,
    left_at: row.left_at,
    user: { id: row.user_id, name: row.name, email: row.email, created_at: row.user_created_at },
  }));
  const budgets = await db.prepare("SELECT * FROM budgets WHERE group_id = ? ORDER BY category").all(Number(groupId));
  return { ...group, members, budgets };
}

async function listGroups(userId, search = "") {
  const term = String(search || "").toLowerCase();
  return (await db.prepare(`
    SELECT g.*,
      COUNT(DISTINCT gm_all.user_id) AS member_count,
      COALESCE(SUM(e.converted_amount_inr), 0) AS total_spend
    FROM groups g
    JOIN group_members gm_user ON gm_user.group_id = g.id AND gm_user.user_id = ?
    LEFT JOIN group_members gm_all ON gm_all.group_id = g.id
    LEFT JOIN expenses e ON e.group_id = g.id
    GROUP BY g.id
    ORDER BY g.created_at DESC
  `).all(Number(userId))).filter((group) => !term || group.name.toLowerCase().includes(term));
}

async function createGroup(payload, ownerId) {
  const result = await db.prepare("INSERT INTO groups (name, description, default_currency, emoji) VALUES (?, ?, ?, ?)")
    .run(payload.name, payload.description || "", payload.default_currency || "INR", payload.emoji || "Wallet");
  const groupId = Number(result.lastInsertRowid);
  const today = new Date().toISOString().slice(0, 10);
  await db.prepare("INSERT INTO group_members (group_id, user_id, joined_at) VALUES (?, ?, ?)").run(groupId, ownerId, today);
  for (const member of payload.members || []) {
    const target = await db.prepare("SELECT * FROM users WHERE email = ?").get(String(member.user_email || "").toLowerCase());
    if (target) await db.prepare("INSERT INTO group_members (group_id, user_id, joined_at) VALUES (?, ?, ?)").run(groupId, target.id, member.joined_at || today);
  }
  for (const budget of payload.budgets || []) {
    if (budget.category && Number(budget.monthly_limit) > 0) {
      await db.prepare("INSERT INTO budgets (group_id, category, monthly_limit, currency) VALUES (?, ?, ?, ?)")
        .run(groupId, budget.category, Number(budget.monthly_limit), budget.currency || "INR");
    }
  }
  return getGroupDetail(groupId);
}

async function updateGroup(groupId, payload) {
  const existing = await db.prepare("SELECT * FROM groups WHERE id = ?").get(Number(groupId));
  if (!existing) throw new HttpError(404, "Group not found");
  await db.prepare(`
    UPDATE groups
    SET name = ?, description = ?, default_currency = ?, emoji = ?
    WHERE id = ?
  `).run(
    payload.name || existing.name,
    payload.description ?? existing.description,
    payload.default_currency || existing.default_currency,
    payload.emoji || existing.emoji,
    Number(groupId),
  );
  return getGroupDetail(groupId);
}

async function deleteGroup(groupId) {
  const result = await db.prepare("DELETE FROM groups WHERE id = ?").run(Number(groupId));
  if (!result.changes) throw new HttpError(404, "Group not found");
  return { message: "Group deleted" };
}

async function addMember(groupId, payload) {
  const target = await db.prepare("SELECT * FROM users WHERE email = ?").get(String(payload.user_email || "").toLowerCase());
  if (!target) throw new HttpError(400, "User with this email does not exist");
  const result = await db.prepare("INSERT INTO group_members (group_id, user_id, joined_at) VALUES (?, ?, ?)")
    .run(Number(groupId), target.id, payload.joined_at || new Date().toISOString().slice(0, 10));
  return (await getGroupDetail(groupId)).members.find((member) => member.id === Number(result.lastInsertRowid));
}

async function removeMember(groupId, userId) {
  await db.prepare("UPDATE group_members SET left_at = ? WHERE group_id = ? AND user_id = ? AND left_at IS NULL")
    .run(new Date().toISOString().slice(0, 10), Number(groupId), Number(userId));
  return (await getGroupDetail(groupId)).members.find((member) => member.user_id === Number(userId));
}

async function updateMember(groupId, userId, payload) {
  const member = await db.prepare(`
    SELECT * FROM group_members
    WHERE group_id = ? AND user_id = ?
    ORDER BY joined_at DESC
    LIMIT 1
  `).get(Number(groupId), Number(userId));
  if (!member) throw new HttpError(404, "Member not found");
  await db.prepare("UPDATE group_members SET joined_at = ?, left_at = ? WHERE id = ?")
    .run(payload.joined_at || member.joined_at, payload.left_at || null, member.id);
  return (await getGroupDetail(groupId)).members.find((item) => item.id === member.id);
}

async function upsertBudget(groupId, payload) {
  if (!payload.category || Number(payload.monthly_limit) <= 0) throw new HttpError(400, "Category and monthly limit are required");
  const existing = await db.prepare("SELECT * FROM budgets WHERE group_id = ? AND lower(category) = lower(?)").get(Number(groupId), payload.category);
  if (existing) {
    await db.prepare("UPDATE budgets SET monthly_limit = ?, currency = ? WHERE id = ?")
      .run(Number(payload.monthly_limit), payload.currency || "INR", existing.id);
  } else {
    await db.prepare("INSERT INTO budgets (group_id, category, monthly_limit, currency) VALUES (?, ?, ?, ?)")
      .run(Number(groupId), payload.category, Number(payload.monthly_limit), payload.currency || "INR");
  }
  return (await getGroupDetail(groupId)).budgets;
}

module.exports = {
  requireGroupMember,
  isActiveMember,
  getGroupDetail,
  listGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  addMember,
  removeMember,
  updateMember,
  upsertBudget,
};
