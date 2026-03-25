const Project = require("../models/Project");
const Log = require("../models/ActivityLog");
const Notification = require("../models/Notification");

// CREATE PROJECT
const createProject = async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json("Only admins can create projects");
    }

    const owner =
      req.body.owner ||
      req.userProfile?.name ||
      req.userProfile?.email ||
      "Unknown Owner";

    const project = await Project.create({ ...req.body, owner });

    await Log.create({
      action: "Project Created",
      projectId: project._id,
      projectTitle: project.title,
      status: project.status,
      user: "admin"
    });

    await Notification.create({
      message: `Project "${project.title}" created`
    });

    res.json(project);
  } catch (err) {
    console.log(err);
    res.status(500).json("Error creating project");
  }
};

// GET PROJECTS
const getProjects = async (req, res) => {
  try {
    const { owner } = req.query;
    const filter = owner ? { owner } : {};
    const projects = await Project.find(filter).sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json("Error fetching projects");
  }
};

// SEARCH
const searchProjects = async (req, res) => {
  try {
    const { query, owner } = req.query;
    const filter = { title: { $regex: query || "", $options: "i" } };
    if (owner) filter.owner = owner;

    const projects = await Project.find(filter).sort({ createdAt: -1 });

    res.json(projects);
  } catch (err) {
    res.status(500).json("Search failed");
  }
};

// UPDATE PROJECT (admin only)
const updateProject = async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json("Only admins can update projects");
    }
    const { id } = req.params;
    const update = req.body || {};
    const project = await Project.findByIdAndUpdate(
      id,
      update,
      { returnDocument: "after" }
    );
    if (!project) return res.status(404).json("Not found");

    await Log.create({
      action: `Project ${id} updated`,
      projectId: id,
      projectTitle: project.title,
      status: project.status,
      user: req.userProfile?.name || "admin"
    });

    // Generate contextual notifications
    if (update.status === "At Risk") {
      await Notification.create({
        message: `Project "${project.title}" flagged At Risk — check delays/quality.`,
        user: req.userProfile?.name || "admin",
        read: false
      });
    }
    if (update.status === "Done") {
      await Notification.create({
        message: `Project "${project.title}" marked Done — generate evidence pack.`,
        user: req.userProfile?.name || "admin",
        read: false
      });
    }

    res.json(project);
  } catch (err) {
    res.status(500).json("Update failed");
  }
};

// DELETE PROJECT (admin only)
const deleteProject = async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json("Only admins can delete projects");
    }
    const { id } = req.params;
    const project = await Project.findByIdAndDelete(id);
    if (!project) return res.status(404).json("Not found");

    await Log.create({
      action: `Project "${project.title}" deleted`,
      projectId: id,
      projectTitle: project.title,
      status: project.status,
      user: req.userProfile?.name || "admin"
    });

    await Notification.create({
      message: `Project "${project.title}" removed from portfolio.`,
      user: req.userProfile?.name || "admin",
      read: false
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json("Delete failed");
  }
};

// DOWNLOAD PACK (audit/evidence bundle placeholder)
const downloadPack = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);
    if (!project) return res.status(404).json("Not found");

    const content = `FactoryIQ Evidence Pack\nProject: ${project.title}\nStatus: ${project.status}\nOwner: ${project.owner}\nContents: Audit trail, ECO log, test reports, PPAP readiness, shipment/quality alerts.`;

    res.set({
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${project.title}-evidence-pack.txt"`
    });
    res.send(content);
  } catch (err) {
    res.status(500).json("Download failed");
  }
};

module.exports = {
  createProject,
  getProjects,
  searchProjects,
  updateProject,
  deleteProject,
  downloadPack
};
