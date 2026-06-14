const express = require("express");
const controller = require("../controllers/groupController");
const { requireAuth } = require("../middleware/auth");
const { asyncHandler } = require("../utils/errors");

const router = express.Router();

router.use(requireAuth);
router.get("/", asyncHandler(controller.index));
router.post("/", asyncHandler(controller.create));
router.get("/:groupId", asyncHandler(controller.show));
router.post("/:groupId/members", asyncHandler(controller.createMember));
router.delete("/:groupId/members/:userId", asyncHandler(controller.destroyMember));
router.post("/:groupId/budgets", asyncHandler(controller.saveBudget));

module.exports = router;
