const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Simple JWT guard for demo purposes.
module.exports = function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : header;

  if (!token) return res.status(401).json("Auth token missing");

  try {
    const decoded = jwt.verify(token, "secret");
    req.user = decoded;

    // hydrate lightweight user profile for convenience
    User.findById(decoded.id)
      .select("name email role")
      .then((dbUser) => {
        if (dbUser) {
          req.userProfile = {
            id: dbUser._id.toString(),
            name: dbUser.name,
            email: dbUser.email,
            role: dbUser.role
          };
        }
        return next();
      })
      .catch(() => next());
  } catch (err) {
    return res.status(401).json("Invalid or expired token");
  }
};
