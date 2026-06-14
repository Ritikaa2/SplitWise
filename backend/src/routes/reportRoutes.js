const express = require("express");
const controller = require("../controllers/reportController");
const { requireAuth } = require("../middleware/auth");
const { asyncHandler } = require("../utils/errors");

const router = express.Router();

router.use(requireAuth);
router.get("/dashboard", asyncHandler(controller.dashboardReport));
router.get("/groups/:groupId/balances", asyncHandler(controller.balances));
router.get("/audit", asyncHandler(controller.audit));

module.exports = router;
