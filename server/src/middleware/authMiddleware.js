const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const USER_TO_SSH_FILE = "/var/lib/git/ssh_to_user.json";

module.exports = async (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];
  console.log("Auth middleware called. Token:", token);

  if (!token) {
    console.log("No token provided");
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token:", decoded);

    // Load the user-to-SSH mapping
    const userToSsh = fs.existsSync(USER_TO_SSH_FILE)
      ? JSON.parse(fs.readFileSync(USER_TO_SSH_FILE, "utf8"))
      : {};

    const keyHash = userToSsh[decoded.username]; // Use the username to find the SSH key hash

    if (!keyHash) {
      console.error(`User not found in user_to_ssh.json for username: ${decoded.username}`);
      return res.status(401).json({ message: "User not found, authorization denied" });
    }

    // Attach user to the request object
    req.user = {
      id: decoded.id,
      username: decoded.username,
      keyHash: keyHash,
    };

    console.log("Auth middleware called. User attached to req:", req.user);
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ message: "Token is not valid" });
  }
};