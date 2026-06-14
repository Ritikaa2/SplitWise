const pool = require("../config/database");
const { convertCurrency } = require("../utils/convertCurrency");

exports.list = async (req, res) => {
  const [settlements] = await pool.query(
    `SELECT s.*, u1.name as paid_by_name, u2.name as paid_to_name 
     FROM settlements s 
     JOIN users u1 ON u1.id = s.paid_by 
     JOIN users u2 ON u2.id = s.paid_to 
     WHERE s.group_id = ? ORDER BY s.date DESC`,
    [req.params.groupId]
  );
  res.json(settlements);
};

exports.create = async (req, res) => {
  const { paid_by, paid_to, amount, currency = "INR", date, note } = req.body;
  const converted = await convertCurrency(amount, currency, "INR");
  const [result] = await pool.query(
    "INSERT INTO settlements (group_id, paid_by, paid_to, amount, currency, converted_amount, date, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [req.params.groupId, paid_by, paid_to, amount, currency, converted, date || new Date().toISOString().slice(0, 10), note || ""]
  );
  const [settlement] = await pool.query("SELECT * FROM settlements WHERE id = ?", [result.insertId]);
  res.status(201).json(settlement[0]);
};