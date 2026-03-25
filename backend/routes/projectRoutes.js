const express = require("express");
const router = express.Router();

const projectController = require("../controllers/projectController");
const auth = require("../middleware/auth");

// Create Project (admin only via middleware check)
router.post("/", auth, projectController.createProject);

// Get All Projects
router.get("/", auth, projectController.getProjects);

// Search Projects
router.get("/search", auth, projectController.searchProjects);

// Update Project (status/description)
router.put("/:id", auth, projectController.updateProject);

// Delete Project
router.delete("/:id", auth, projectController.deleteProject);
// Alias delete path if needed
router.delete("/delete/:id", auth, projectController.deleteProject);

// Download audit/evidence pack
router.get("/:id/package", auth, projectController.downloadPack);

module.exports = router; // ✅ VERY IMPORTANT
