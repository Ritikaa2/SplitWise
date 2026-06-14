const crypto = require("node:crypto");

const JWT_SECRET = process.env.JWT_SECRET || "splitwise-pro-node-secret-change-me";

function base64url(input) {
  return Buffer.from(input).toString("base64url");
}

function sign(payload) {
  return crypto.createHmac("sha256", JWT_SECRET).update(payload).digest("base64url");
}

function createToken(subject, purpose = "access", minutes = 60 * 24 * 7) {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64url(JSON.stringify({ sub: String(subject), purpose, exp: Date.now() + minutes * 60 * 1000 }));
  return `${header}.${payload}.${sign(`${header}.${payload}`)}`;
}

function verifyToken(token, purpose = "access") {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;
  const expected = sign(`${header}.${payload}`);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length) return null;
  if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) return null;
  const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  if (data.purpose !== purpose || Date.now() > data.exp) return null;
  return data.sub;
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
  return `pbkdf2$${salt}$${hash}`;
}

function verifyPassword(password, stored) {
  const [, salt, hash] = String(stored).split("$");
  if (!salt || !hash) return false;
  const candidate = crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
  const candidateBuffer = Buffer.from(candidate);
  const hashBuffer = Buffer.from(hash);
  return candidateBuffer.length === hashBuffer.length && crypto.timingSafeEqual(candidateBuffer, hashBuffer);
}

module.exports = { createToken, verifyToken, hashPassword, verifyPassword };
