const { verifyToken } = require("../utils/security");
const { HttpError } = require("../utils/errors");
const { findUserByEmail } = require("../models/userModel");

function requireAuth(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const email = verifyToken(token, "access");
  if (!email) return next(new HttpError(401, "Could not validate credentials"));
  const user = findUserByEmail(email);
  if (!user) return next(new HttpError(401, "Could not validate credentials"));
  req.user = user;
  return next();
}

module.exports = { requireAuth };
