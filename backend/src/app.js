const express = require("express");
const { cors } = require("./middleware/cors");
const { errorHandler, notFound } = require("./middleware/errorHandler");
const authRoutes = require("./routes/authRoutes");
const groupRoutes = require("./routes/groupRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const importRoutes = require("./routes/importRoutes");
const reportRoutes = require("./routes/reportRoutes");
const settlementRoutes = require("./routes/settlementRoutes");

const app = express();

app.use(cors);
app.use((req, res, next) => {
  if (req.is("multipart/form-data")) return next();
  return express.json({ limit: "2mb" })(req, res, next);
});

app.get("/health", (_req, res) => res.json({ status: "healthy", service: "SplitWise Pro Express API" }));
app.get("/", (_req, res) => res.json({ name: "SplitWise Pro", api: "/api", runtime: "Node.js + Express" }));

app.use("/api/auth", authRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/import", importRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/settlements", settlementRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
