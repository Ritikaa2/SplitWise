const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/reportController");
const { authenticate } = require("../middleware/auth");

router.use(authenticate);
router.get("/dashboard", ctrl.dashboard);

module.exports = router;