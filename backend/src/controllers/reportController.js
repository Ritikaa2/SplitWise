const pool = require("../config/database");

exports.dashboard = async (req, res) => {
  const userId = req.user.id;
  
  const [totalExpenses] = await pool.query(
    "SELECT COUNT(*) as count FROM expenses e JOIN group_members gm ON gm.group_id = e.group_id WHERE gm.user_id = ? AND gm.left_at IS NULL",
    [userId]
  );
  
  const [amountSpent] = await pool.query(
    "SELECT COALESCE(SUM(e.converted_amount), 0) as total FROM expenses e JOIN group_members gm ON gm.group_id = e.group_id WHERE e.paid_by = ? AND gm.user_id = ? AND gm.left_at IS NULL",
    [userId, userId]
  );
  
  const [amountOwed] = await pool.query(
    "SELECT COALESCE(SUM(es.amount), 0) as total FROM expense_splits es JOIN expenses e ON e.id = es.expense_id JOIN group_members gm ON gm.group_id = e.group_id WHERE es.user_id = ? AND gm.user_id = ? AND gm.left_at IS NULL",
    [userId, userId]
  );

  const [activeGroups] = await pool.query(
    "SELECT COUNT(*) as count FROM group_members WHERE user_id = ? AND left_at IS NULL",
    [userId]
  );

  const [pendingSettlements] = await pool.query(
    "SELECT COUNT(DISTINCT e.id) as count FROM expenses e JOIN group_members gm ON gm.group_id = e.group_id WHERE gm.user_id = ? AND gm.left_at IS NULL",
    [userId]
  );

  // Monthly expenses
  const [monthly] = await pool.query(`
    SELECT DATE_FORMAT(e.date, '%b') as month, SUM(e.converted_amount) as amount 
    FROM expenses e JOIN group_members gm ON gm.group_id = e.group_id 
    WHERE gm.user_id = ? AND e.date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
    GROUP BY DATE_FORMAT(e.date, '%Y-%m') ORDER BY MIN(e.date)
  `, [userId]);

  // Category breakdown
  const [categories] = await pool.query(`
    SELECT e.category as name, SUM(e.converted_amount) as value 
    FROM expenses e JOIN group_members gm ON gm.group_id = e.group_id 
    WHERE gm.user_id = ? AND gm.left_at IS NULL 
    GROUP BY e.category ORDER BY value DESC
  `, [userId]);

  // Recent activity
  const [recent] = await pool.query(`
    SELECT e.title, e.date, e.converted_amount as amount, g.name as \`group\`, e.category 
    FROM expenses e JOIN \`groups\` g ON g.id = e.group_id 
    JOIN group_members gm ON gm.group_id = e.group_id 
    WHERE gm.user_id = ? AND gm.left_at IS NULL 
    ORDER BY e.created_at DESC LIMIT 5
  `, [userId]);

  res.json({
    total_expenses: totalExpenses[0].count,
    amount_spent: amountSpent[0].total,
    amount_owed: amountOwed[0].total,
    active_groups: activeGroups[0].count,
    pending_settlements: pendingSettlements[0].count,
    monthly_expenses: monthly,
    category_breakdown: categories,
    recent_activity: recent,
  });
};