const jwt = require("jsonwebtoken");
const poolPromise = require("../config/database");

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-jwt-key-change-in-production-123456";

function generateToken(userId) {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

async function authenticate(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }
    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const pool = await poolPromise;
    const [users] = await pool.query("SELECT id, name, email FROM users WHERE id = ?", [decoded.id]);
    if (!users.length) {
      return res.status(401).json({ error: "User not found" });
    }
    req.user = users[0];
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = { generateToken, authenticate };