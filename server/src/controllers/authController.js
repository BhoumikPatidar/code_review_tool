const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const SSH_TO_USER_FILE = "/var/lib/git/ssh_to_user.json";

exports.login = async (req, res) => {
  console.log("\n=== LOGIN CONTROLLER START ===");
  try {
    const { username, password } = req.body;
    console.log("Login attempt for username:", username);

    console.log("Reading ssh_to_user.json...");
    const userToSsh = fs.existsSync(SSH_TO_USER_FILE)
      ? JSON.parse(fs.readFileSync(SSH_TO_USER_FILE, "utf8"))
      : {};
    
    console.log("Contents of ssh_to_user.json:", JSON.stringify(userToSsh, null, 2));

    const keyHash = userToSsh[username];
    console.log("Found keyHash for user:", keyHash);

    if (!keyHash) {
      console.error(`❌ User not found in ssh_to_user.json for username: ${username}`);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    console.log("Generating JWT token with payload:", { username, keyHash });
    const token = jwt.sign({ username, keyHash }, process.env.JWT_SECRET, { expiresIn: "1d" });
    console.log("✅ Token generated:", token);

    const response = { token, user: { username, keyHash } };
    console.log("Sending response:", JSON.stringify(response, null, 2));
    console.log("=== LOGIN CONTROLLER END ===\n");
    
    res.json(response);
  } catch (error) {
    console.error("❌ Login error:", error);
    console.error("Error stack:", error.stack);
    console.log("=== LOGIN CONTROLLER END WITH ERROR ===\n");
    res.status(500).json({ message: "Failed to log in" });
  }
};

exports.register = async (req, res) => {
  try {
    const { username, password, publicKey } = req.body;

    // Validate the SSH key
    if (!publicKey || typeof publicKey !== "string") {
      return res.status(400).json({ message: "A valid SSH public key is required" });
    }
    if (!publicKey.startsWith("ssh-rsa") && !publicKey.startsWith("ssh-ed25519")) {
      return res.status(400).json({ message: "Invalid SSH public key format" });
    }

    // Hash the SSH key
    const keyHash = crypto.createHash("sha256").update(publicKey).digest("hex");

    // Load or initialize the user-to-SSH mapping
    let userToSsh = {};
    if (fs.existsSync(SSH_TO_USER_FILE)) {
      const fileContent = fs.readFileSync(SSH_TO_USER_FILE, "utf8");
      userToSsh = fileContent ? JSON.parse(fileContent) : {};
    }

    // Check if the username already exists
    if (userToSsh[username]) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Add the mapping (username -> SSH hash)
    userToSsh[username] = keyHash;

    // Save the updated mapping
    fs.writeFileSync(SSH_TO_USER_FILE, JSON.stringify(userToSsh, null, 2));

    // Generate a token that includes both username and keyHash
    const token = jwt.sign({ username, keyHash }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.json({ token, user: { username, keyHash } });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Failed to register user" });
  }
};