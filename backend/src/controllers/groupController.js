const pool = require("../config/database");
const { convertCurrency } = require("../utils/convertCurrency");

exports.list = async (req, res) => {
  const [groups] = await pool.query(`
    SELECT g.*, COUNT(DISTINCT gm.user_id) as member_count,
      COALESCE(SUM(e.converted_amount), 0) as total_spend
    FROM \`groups\` g
    JOIN group_members gm_user ON gm_user.group_id = g.id AND gm_user.user_id = ?
    LEFT JOIN group_members gm ON gm.group_id = g.id
    LEFT JOIN expenses e ON e.group_id = g.id
    GROUP BY g.id
    ORDER BY g.created_at DESC
  `, [req.user.id]);
  res.json(groups);
};

exports.get = async (req, res) => {
  const [groups] = await pool.query("SELECT * FROM `groups` WHERE id = ?", [req.params.id]);
  if (!groups.length) return res.status(404).json({ error: "Group not found" });
  const [members] = await pool.query(`
    SELECT gm.*, u.name, u.email FROM group_members gm
    JOIN users u ON u.id = gm.user_id
    WHERE gm.group_id = ? ORDER BY gm.joined_at
  `, [req.params.id]);
  const [budgets] = await pool.query("SELECT * FROM budgets WHERE group_id = ?", [req.params.id]);
  res.json({ ...groups[0], members, budgets });
};

exports.create = async (req, res) => {
  const { name, description, default_currency = "INR" } = req.body;
  const [result] = await pool.query(
    "INSERT INTO `groups` (name, description, default_currency, created_by) VALUES (?, ?, ?, ?)",
    [name, description || "", default_currency, req.user.id]
  );
  const today = new Date().toISOString().slice(0, 10);
  await pool.query("INSERT INTO group_members (group_id, user_id, joined_at) VALUES (?, ?, ?)", [result.insertId, req.user.id, today]);
  
  // Add members if provided
  if (req.body.members) {
    for (const m of req.body.members) {
      const [users] = await pool.query("SELECT id FROM users WHERE email = ?", [m.email]);
      if (users.length) {
        await pool.query("INSERT IGNORE INTO group_members (group_id, user_id, joined_at) VALUES (?, ?, ?)",
          [result.insertId, users[0].id, m.joined_at || today]);
      }
    }
  }
  
  const [group] = await pool.query("SELECT * FROM `groups` WHERE id = ?", [result.insertId]);
  res.status(201).json(group[0]);
};

exports.update = async (req, res) => {
  const { name, description, default_currency } = req.body;
  await pool.query("UPDATE `groups` SET name=?, description=?, default_currency=? WHERE id=?",
    [name, description, default_currency, req.params.id]);
  const [groups] = await pool.query("SELECT * FROM `groups` WHERE id = ?", [req.params.id]);
  res.json(groups[0]);
};

exports.remove = async (req, res) => {
  await pool.query("DELETE FROM `groups` WHERE id = ?", [req.params.id]);
  res.json({ message: "Group deleted" });
};

exports.addMember = async (req, res) => {
  const { email, joined_at } = req.body;
  const [users] = await pool.query("SELECT id FROM users WHERE email = ?", [email?.toLowerCase()]);
  if (!users.length) return res.status(400).json({ error: "User not found" });
  await pool.query("INSERT IGNORE INTO group_members (group_id, user_id, joined_at) VALUES (?, ?, ?)",
    [req.params.id, users[0].id, joined_at || new Date().toISOString().slice(0, 10)]);
  const [members] = await pool.query(`
    SELECT gm.*, u.name, u.email FROM group_members gm
    JOIN users u ON u.id = gm.user_id WHERE gm.group_id = ? AND gm.user_id = ?
  `, [req.params.id, users[0].id]);
  res.json(members[0]);
};

exports.removeMember = async (req, res) => {
  await pool.query("UPDATE group_members SET left_at = ? WHERE group_id = ? AND user_id = ? AND left_at IS NULL",
    [new Date().toISOString().slice(0, 10), req.params.id, req.params.userId]);
  res.json({ message: "Member removed" });
};