const fs = require("fs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
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

    // Load the SSH-to-user mapping
    console.log("Reading ssh_to_user.json...");
    const sshToUser = fs.existsSync(SSH_TO_USER_FILE)
      ? JSON.parse(fs.readFileSync(SSH_TO_USER_FILE, "utf8"))
      : {};
    
    console.log("Contents of ssh_to_user.json:", sshToUser);

    const user = sshToUser[decoded.username];
    if (!user || !user.keyHash) {
      console.error(`User or keyHash not found for username: ${decoded.username}`);
      return res.status(401).json({ message: "User not found or SSH key not set" });
    }

    // Attach user to the request object
    req.user = {
      username: decoded.username,
      keyHash: user.keyHash // This is already the hash of the SSH key
    };

    console.log("Auth middleware successfully attached user data:", req.user);
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ message: "Token is not valid" });
  }
};