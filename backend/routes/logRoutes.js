const router = require("express").Router();
const Log = require("../models/ActivityLog");
const auth = require("../middleware/auth");

router.get("/", auth, async (req, res) => {
  const logs = await Log.find();
  res.json(logs);
});

// Delete one log entry
router.delete("/:id", auth, async (req, res) => {
  try {
    await Log.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json("Failed to delete entry");
  }
});

module.exports = router; // ✅ MUST BE THERE
