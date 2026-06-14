const { auditFeed, dashboard, groupBalances } = require("../models/reportModel");
const { requireGroupMember } = require("../models/groupModel");

async function dashboardReport(req, res) {
  res.json(await dashboard(req.user.id));
}

async function balances(req, res) {
  const groupId = Number(req.params.groupId);
  await requireGroupMember(groupId, req.user.id);
  res.json(await groupBalances(groupId));
}

async function audit(req, res) {
  res.json(await auditFeed(req.user.id));
}

module.exports = { dashboardReport, balances, audit };
