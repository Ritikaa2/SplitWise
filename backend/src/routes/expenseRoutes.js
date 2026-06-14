const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/expenseController");
const { authenticate } = require("../middleware/auth");

router.use(authenticate);
router.get("/groups/:groupId", ctrl.list);
router.post("/groups/:groupId", ctrl.create);
router.put("/:id", ctrl.update);
router.delete("/:id", ctrl.remove);
router.get("/groups/:groupId/balances", ctrl.balances);

module.exports = router;