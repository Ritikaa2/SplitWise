const { HttpError } = require("../utils/errors");
const { createToken, hashPassword, verifyPassword, verifyToken } = require("../utils/security");
const { createUser, findUserByEmail, rowToUser, updatePassword } = require("../models/userModel");

async function register(req, res) {
  const body = req.body || {};
  if (!body.name || !body.email || String(body.password || "").length < 8) {
    throw new HttpError(400, "Name, valid email, and 8 character password are required");
  }
  const user = createUser({ name: body.name, email: body.email, hashedPassword: hashPassword(body.password) });
  res.status(201).json({ access_token: createToken(user.email), token_type: "bearer", user: rowToUser(user) });
}

async function login(req, res) {
  const body = req.body || {};
  const user = findUserByEmail(body.email);
  if (!user || !verifyPassword(body.password || "", user.hashed_password)) throw new HttpError(401, "Incorrect email or password");
  res.json({ access_token: createToken(user.email), token_type: "bearer", user: rowToUser(user) });
}

async function forgotPassword(req, res) {
  const user = findUserByEmail(req.body?.email);
  res.json({
    message: "If this email exists, a reset link has been prepared.",
    reset_token: user ? createToken(user.email, "password_reset", 30) : null,
  });
}

async function resetPassword(req, res) {
  const email = verifyToken(req.body?.token, "password_reset");
  if (!email) throw new HttpError(400, "Reset link is invalid or expired");
  updatePassword(email, hashPassword(req.body?.password || ""));
  res.json({ message: "Password updated successfully" });
}

async function googleLogin() {
  throw new HttpError(501, "Google sign-in needs GOOGLE_CLIENT_ID and token verification before it can be enabled");
}

async function me(req, res) {
  res.json(rowToUser(req.user));
}

async function logout(_req, res) {
  res.json({ message: "Token discarded on client" });
}

module.exports = { register, login, forgotPassword, resetPassword, googleLogin, me, logout };
