const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const USER_TO_SSH_FILE = "/var/lib/git/user_to_ssh.json";

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
    if (fs.existsSync(USER_TO_SSH_FILE)) {
      const fileContent = fs.readFileSync(USER_TO_SSH_FILE, "utf8");
      userToSsh = fileContent ? JSON.parse(fileContent) : {};
    }

    // Check if the username already exists
    if (userToSsh[username]) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Add the user to the mapping
    userToSsh[username] = { keyHash, password: hashedPassword };

    // Save the updated mapping
    fs.writeFileSync(USER_TO_SSH_FILE, JSON.stringify(userToSsh, null, 2));

    // Generate a token
    const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.json({ token, user: { username } });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Failed to register user" });
  }
};
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Load the SSH-to-user mapping
    const sshToUser = fs.existsSync(SSH_TO_USER_FILE)
      ? JSON.parse(fs.readFileSync(SSH_TO_USER_FILE, "utf8"))
      : {};

    const user = sshToUser[username];
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Verify the password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate a token
    const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.json({ token, user: { username } });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Failed to log in" });
  }
};
