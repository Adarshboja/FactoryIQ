const router = require("express").Router();
const Notification = require("../models/Notification");
const auth = require("../middleware/auth");

router.get("/", auth, async (req, res) => {
  const data = await Notification.find();
  res.json(data);
});

module.exports = router; // ✅ MUST BE THERE
