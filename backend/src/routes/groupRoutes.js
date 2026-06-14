const express = require("express");
const controller = require("../controllers/groupController");
const { requireAuth } = require("../middleware/auth");
const { asyncHandler } = require("../utils/errors");

const router = express.Router();

router.use(requireAuth);
router.get("/", asyncHandler(controller.index));
router.post("/", asyncHandler(controller.create));
router.get("/:groupId", asyncHandler(controller.show));
router.put("/:groupId", asyncHandler(controller.update));
router.delete("/:groupId", asyncHandler(controller.destroy));
router.post("/:groupId/members", asyncHandler(controller.createMember));
router.patch("/:groupId/members/:userId", asyncHandler(controller.patchMember));
router.delete("/:groupId/members/:userId", asyncHandler(controller.destroyMember));
router.post("/:groupId/budgets", asyncHandler(controller.saveBudget));

module.exports = router;
