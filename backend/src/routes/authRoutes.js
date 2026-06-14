const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");

router.post("/register", ctrl.register);
router.post("/login", ctrl.login);
router.post("/password/forgot", ctrl.forgotPassword);
router.post("/password/reset", ctrl.resetPassword);
router.get("/me", authenticate, ctrl.me);
router.post("/logout", authenticate, ctrl.logout);

module.exports = router;