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

    // Load the user-to-SSH mapping
    console.log("Reading ssh_to_user.json...");
    const userToSsh = fs.existsSync(SSH_TO_USER_FILE)
      ? JSON.parse(fs.readFileSync(SSH_TO_USER_FILE, "utf8"))
      : {};
    
    console.log("Contents of ssh_to_user.json:", userToSsh);

    const keyHash = userToSsh[decoded.username];
    if (!keyHash) {
      console.error(`SSH hash not found for username: ${decoded.username}`);
      return res.status(401).json({ message: "User not found or SSH key not set" });
    }

    // Attach user to the request object
    req.user = {
      username: decoded.username,
      keyHash: keyHash // Direct hash value from the mapping
    };

    console.log("Auth middleware successfully attached user data:", req.user);
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ message: "Token is not valid" });
  }
};