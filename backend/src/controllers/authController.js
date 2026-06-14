const crypto = require("node:crypto");
const { HttpError } = require("../utils/errors");
const { createToken, hashPassword, verifyPassword, verifyToken } = require("../utils/security");
const {
  consumePasswordOtp,
  createUser,
  findUserByEmail,
  rowToUser,
  savePasswordOtp,
  updatePassword,
} = require("../models/userModel");

function hashOtp(email, otp) {
  return crypto
    .createHash("sha256")
    .update(`${String(email).toLowerCase()}:${otp}:${process.env.JWT_SECRET || "splitwise-pro-node-secret-change-me"}`)
    .digest("hex");
}

function makeOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

async function deliverOtp(email, otp) {
  if (process.env.SMTP_HOST) {
    console.log(`[email-otp] SMTP configured for ${email}. OTP: ${otp}`);
    return;
  }
  console.log(`[email-otp] Password reset OTP for ${email}: ${otp}`);
}

async function register(req, res) {
  const body = req.body || {};
  if (!body.name || !body.email || String(body.password || "").length < 8) {
    throw new HttpError(400, "Name, valid email, and 8 character password are required");
  }
  const user = await createUser({ name: body.name, email: body.email, hashedPassword: hashPassword(body.password) });
  res.status(201).json({ access_token: createToken(user.email), token_type: "bearer", user: rowToUser(user) });
}

async function login(req, res) {
  const body = req.body || {};
  const user = await findUserByEmail(body.email);
  if (!user || !verifyPassword(body.password || "", user.hashed_password)) throw new HttpError(401, "Incorrect email or password");
  res.json({ access_token: createToken(user.email), token_type: "bearer", user: rowToUser(user) });
}

async function forgotPassword(req, res) {
  const email = String(req.body?.email || "").toLowerCase();
  const user = await findUserByEmail(email);
  if (!user) {
    return res.json({ message: "If this email exists, a 6-digit OTP has been sent." });
  }
  const otp = makeOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString().slice(0, 19).replace("T", " ");
  await savePasswordOtp(user.id, user.email, hashOtp(user.email, otp), expiresAt);
  await deliverOtp(user.email, otp);
  res.json({
    message: "If this email exists, a 6-digit OTP has been sent.",
    expires_in_minutes: 10,
    dev_otp: process.env.NODE_ENV === "production" ? undefined : otp,
  });
}

async function resetPassword(req, res) {
  const password = req.body?.password || "";
  if (String(password).length < 8) throw new HttpError(400, "Password must be at least 8 characters");

  let email = "";
  if (req.body?.token) {
    email = verifyToken(req.body.token, "password_reset");
    if (!email) throw new HttpError(400, "Reset link is invalid or expired");
  } else {
    email = String(req.body?.email || "").toLowerCase();
    const otp = String(req.body?.otp || "");
    if (!email || !/^\d{6}$/.test(otp)) throw new HttpError(400, "Email and 6-digit OTP are required");
    await consumePasswordOtp(email, hashOtp(email, otp));
  }

  await updatePassword(email, hashPassword(password));
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
