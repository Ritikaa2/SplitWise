const express = require("express");
const controller = require("../controllers/settlementController");
const { requireAuth } = require("../middleware/auth");
const { asyncHandler } = require("../utils/errors");

const router = express.Router();

router.use(requireAuth);
router.get("/groups/:groupId", asyncHandler(controller.index));
router.post("/groups/:groupId", asyncHandler(controller.create));

module.exports = router;
