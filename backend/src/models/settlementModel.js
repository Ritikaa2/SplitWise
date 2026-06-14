const { db } = require("../config/database");
const { HttpError } = require("../utils/errors");
const { convertToInr } = require("../utils/money");
const { isActiveMember } = require("./groupModel");

function listSettlements(groupId) {
  return db.prepare(`
    SELECT s.*, payer.name AS payer_name, payee.name AS payee_name
    FROM settlements s
    JOIN users payer ON payer.id = s.payer_id
    JOIN users payee ON payee.id = s.payee_id
    WHERE s.group_id = ?
    ORDER BY s.date DESC, s.id DESC
  `).all(Number(groupId)).map((row) => ({
    ...row,
    payer: { id: row.payer_id, name: row.payer_name },
    payee: { id: row.payee_id, name: row.payee_name },
  }));
}

function createSettlement(groupId, payload, actingUserId) {
  const amount = Number(payload.amount);
  const currency = String(payload.currency || "INR").toUpperCase();
  const date = payload.date || new Date().toISOString().slice(0, 10);
  if (!amount || amount <= 0) throw new HttpError(400, "Settlement amount must be greater than zero");
  if (!["INR", "USD"].includes(currency)) throw new HttpError(400, "Only INR and USD are supported");
  if (!isActiveMember(groupId, payload.payer_id, date) || !isActiveMember(groupId, payload.payee_id, date)) {
    throw new HttpError(400, "Payer and payee must be active members on the settlement date");
  }
  const result = db.prepare(`
    INSERT INTO settlements (group_id, payer_id, payee_id, amount, currency, converted_amount_inr, date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(Number(groupId), Number(payload.payer_id), Number(payload.payee_id), amount, currency, convertToInr(amount, currency), date);
  db.prepare("INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)")
    .run(actingUserId, "SETTLEMENT_RECORDED", "settlement", Number(result.lastInsertRowid), `${payload.payer_id} paid ${payload.payee_id}`);
  return listSettlements(groupId).find((item) => item.id === Number(result.lastInsertRowid));
}

module.exports = { listSettlements, createSettlement };
