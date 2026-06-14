const { auditFeed, dashboard, groupBalances } = require("../models/reportModel");
const { requireGroupMember } = require("../models/groupModel");

async function dashboardReport(req, res) {
  res.json(dashboard(req.user.id));
}

async function balances(req, res) {
  const groupId = Number(req.params.groupId);
  requireGroupMember(groupId, req.user.id);
  res.json(groupBalances(groupId));
}

async function audit(req, res) {
  res.json(auditFeed(req.user.id));
}

module.exports = { dashboardReport, balances, audit };
