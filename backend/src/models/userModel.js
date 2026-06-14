const { db } = require("../config/database");

function rowToUser(row) {
  return row && { id: row.id, name: row.name, email: row.email, created_at: row.created_at };
}

function findUserByEmail(email) {
  return db.prepare("SELECT * FROM users WHERE email = ?").get(String(email || "").toLowerCase());
}

function findUserById(id) {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(Number(id));
}

function createUser({ name, email, hashedPassword }) {
  const result = db.prepare("INSERT INTO users (name, email, hashed_password) VALUES (?, ?, ?)")
    .run(name, String(email).toLowerCase(), hashedPassword);
  return findUserById(Number(result.lastInsertRowid));
}

function updatePassword(email, hashedPassword) {
  db.prepare("UPDATE users SET hashed_password = ? WHERE email = ?").run(hashedPassword, String(email).toLowerCase());
}

module.exports = { rowToUser, findUserByEmail, findUserById, createUser, updatePassword };
