const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/settlementController");
const { authenticate } = require("../middleware/auth");

router.use(authenticate);
router.get("/groups/:groupId", ctrl.list);
router.post("/groups/:groupId", ctrl.create);

module.exports = router;