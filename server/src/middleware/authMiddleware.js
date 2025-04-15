const jwt = require('jsonwebtoken');
const { User } = require('../models');
require('dotenv').config();

module.exports = async (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  console.log("Auth middleware called. User:", req.user);
  if (!token)
    return res.status(401).json({ message: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found, authorization denied' });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};
const authenticateUser = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"]; // Example: Fetch user ID from headers
    if (!userId) {
      console.log("Auth middleware called. User: undefined");
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Fetch user from the database
    const user = await User.findOne({ where: { id: userId } });
    if (!user) {
      console.log("Auth middleware called. User: not found");
      return res.status(401).json({ error: "User not found" });
    }

    // Attach user to the request object
    req.user = {
      id: user.id,
      username: user.username,
      publicKey: user.publicKey, // Ensure publicKey is included
    };

    console.log("Auth middleware called. User:", req.user);
    next();
  } catch (err) {
    console.error("Error in authentication middleware:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = authenticateUser;