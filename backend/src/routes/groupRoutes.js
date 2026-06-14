const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/groupController");
const { authenticate } = require("../middleware/auth");

router.use(authenticate);
router.get("/", ctrl.list);
router.post("/", ctrl.create);
router.get("/:id", ctrl.get);
router.put("/:id", ctrl.update);
router.delete("/:id", ctrl.remove);
router.post("/:id/members", ctrl.addMember);
router.delete("/:id/members/:userId", ctrl.removeMember);

module.exports = router;