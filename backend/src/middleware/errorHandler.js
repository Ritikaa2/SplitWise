const { HttpError } = require("../utils/errors");

function notFound(_req, _res, next) {
  next(new HttpError(404, "Not found"));
}

function errorHandler(error, _req, res, _next) {
  if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
    return res.status(400).json({ detail: "A record with this unique value already exists" });
  }
  const status = error instanceof HttpError ? error.status : 500;
  return res.status(status).json({ detail: error.message || "Server error" });
}

module.exports = { notFound, errorHandler };
