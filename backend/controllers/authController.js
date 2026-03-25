const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json("User already exists");

    const hashed = await bcrypt.hash(password, 10);
    const normalizedRole = role === "admin" ? "admin" : "member";

    const user = await User.create({
      name,
      email,
      password: hashed,
      role: normalizedRole
    });

    const token = jwt.sign({ id: user._id, role: user.role }, "secret");
    res.json({ token, role: user.role, name: user.name, email: user.email });
  } catch (err) {
    res.status(500).json("Registration failed");
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json("User not found");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json("Invalid password");

  const token = jwt.sign(
    { id: user._id, role: user.role },
    "secret"
  );

  res.json({ token, role: user.role, name: user.name, email: user.email });
};
