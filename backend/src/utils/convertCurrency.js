const pool = require("../config/database");

async function convertCurrency(amount, fromCurrency, toCurrency = "INR") {
  if (fromCurrency === toCurrency) return amount;
  const [rows] = await pool.query(
    "SELECT rate FROM exchange_rates WHERE from_currency = ? AND to_currency = ? ORDER BY date DESC LIMIT 1",
    [fromCurrency, toCurrency]
  );
  if (!rows.length) {
    const [cur] = await pool.query("SELECT rate FROM currencies WHERE code = ?", [fromCurrency]);
    if (cur.length) {
      return amount * (toCurrency === "INR" ? cur[0].rate : 1 / cur[0].rate);
    }
    return amount;
  }
  return amount * rows[0].rate;
}

module.exports = { convertCurrency };