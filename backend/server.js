require("dotenv").config(); // ✅ add this at top

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// ✅ MongoDB Atlas Connection (UPDATED)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.log(err));

// ROUTES
const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const logRoutes = require("./routes/logRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/notifications", notificationRoutes);

// Server
app.listen(5000, () => console.log("Server running on port 5000"));