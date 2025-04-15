const fs = require("fs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const SSH_TO_USER_FILE = "/var/lib/git/ssh_to_user.json";

module.exports = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.split(" ")[1];
    console.log("Auth middleware called. Token:", token);

    if (!token) {
      console.log("No token provided");
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token:", decoded);

    // Since we now include keyHash in the token, we can use it directly
    if (!decoded.username || !decoded.keyHash) {
      console.error("Token missing username or keyHash");
      return res.status(401).json({ message: "Invalid token" });
    }

    // Attach user to the request object
    req.user = {
      username: decoded.username,
      keyHash: decoded.keyHash
    };

    console.log("Auth middleware successfully attached user data:", req.user);
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ message: "Token is not valid" });
  }
};
