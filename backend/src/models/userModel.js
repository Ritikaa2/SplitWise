const { db } = require("../config/database");
const { HttpError } = require("../utils/errors");

function rowToUser(row) {
  return row && { id: row.id, name: row.name, email: row.email, created_at: row.created_at };
}

async function findUserByEmail(email) {
  return db.prepare("SELECT * FROM users WHERE email = ?").get(String(email || "").toLowerCase());
}

async function findUserById(id) {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(Number(id));
}

async function createUser({ name, email, hashedPassword }) {
  const result = await db.prepare("INSERT INTO users (name, email, hashed_password) VALUES (?, ?, ?)")
    .run(name, String(email).toLowerCase(), hashedPassword);
  return findUserById(Number(result.lastInsertRowid));
}

async function updatePassword(email, hashedPassword) {
  await db.prepare("UPDATE users SET hashed_password = ? WHERE email = ?").run(hashedPassword, String(email).toLowerCase());
}

async function savePasswordOtp(userId, email, otpHash, expiresAt) {
  await db.prepare("UPDATE password_otps SET consumed_at = CURRENT_TIMESTAMP WHERE user_id = ? AND consumed_at IS NULL")
    .run(Number(userId));
  const result = await db.prepare(`
    INSERT INTO password_otps (user_id, email, otp_hash, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(Number(userId), String(email).toLowerCase(), otpHash, expiresAt);
  return Number(result.lastInsertRowid);
}

async function consumePasswordOtp(email, otpHash) {
  const row = await db.prepare(`
    SELECT * FROM password_otps
    WHERE email = ? AND consumed_at IS NULL
    ORDER BY created_at DESC
    LIMIT 1
  `).get(String(email).toLowerCase());
  if (!row) throw new HttpError(400, "OTP is invalid or expired");
  if (new Date(row.expires_at).getTime() < Date.now()) throw new HttpError(400, "OTP is invalid or expired");
  if (row.attempts >= 5) throw new HttpError(429, "Too many OTP attempts. Request a new OTP.");
  if (row.otp_hash !== otpHash) {
    await db.prepare("UPDATE password_otps SET attempts = attempts + 1 WHERE id = ?").run(row.id);
    throw new HttpError(400, "OTP is invalid or expired");
  }
  await db.prepare("UPDATE password_otps SET consumed_at = CURRENT_TIMESTAMP WHERE id = ?").run(row.id);
  return row;
}

module.exports = {
  rowToUser,
  findUserByEmail,
  findUserById,
  createUser,
  updatePassword,
  savePasswordOtp,
  consumePasswordOtp,
};
