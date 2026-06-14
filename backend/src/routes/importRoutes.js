const express = require("express");
const controller = require("../controllers/importController");
const { requireAuth } = require("../middleware/auth");
const { asyncHandler } = require("../utils/errors");

const router = express.Router();

router.use(requireAuth);
router.post("/groups/:groupId/sessions", express.raw({ type: () => true, limit: "10mb" }), asyncHandler(controller.upload));
router.post("/sessions/:sessionId/approve", asyncHandler(controller.approve));

module.exports = router;
