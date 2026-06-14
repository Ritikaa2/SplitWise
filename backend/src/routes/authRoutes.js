const express = require("express");
const controller = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");
const { asyncHandler } = require("../utils/errors");

const router = express.Router();

router.post("/register", asyncHandler(controller.register));
router.post("/login", asyncHandler(controller.login));
router.post("/password/forgot", asyncHandler(controller.forgotPassword));
router.post("/password/reset", asyncHandler(controller.resetPassword));
router.post("/google", asyncHandler(controller.googleLogin));
router.get("/me", requireAuth, asyncHandler(controller.me));
router.post("/logout", asyncHandler(controller.logout));

module.exports = router;
