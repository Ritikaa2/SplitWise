const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/importController");
const { authenticate } = require("../middleware/auth");

router.use(authenticate);
router.post("/groups/:groupId/sessions", ctrl.upload);
router.post("/sessions/:id/approve", ctrl.approve);

module.exports = router;