const express = require("express");
const controller = require("../controllers/expenseController");
const { requireAuth } = require("../middleware/auth");
const { asyncHandler } = require("../utils/errors");

const router = express.Router();

router.use(requireAuth);
router.get("/groups/:groupId", asyncHandler(controller.index));
router.post("/groups/:groupId", asyncHandler(controller.create));
router.get("/:expenseId", asyncHandler(controller.show));
router.put("/:expenseId", asyncHandler(controller.update));
router.delete("/:expenseId", asyncHandler(controller.destroy));

module.exports = router;
