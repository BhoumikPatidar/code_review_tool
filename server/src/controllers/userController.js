// server/src/controllers/userController.js
const fs = require("fs-extra");
const path = require("path");
const crypto = require("crypto");
const AUTHORIZED_KEYS_PATH = "/home/git/.ssh/authorized_keys";
const SSH_TO_USER_FILE = "/var/lib/git/ssh_to_user.json";


exports.updateSshKey = async (req, res) => {
  try {
    const { publicKey } = req.body;

    // Validate the public key
    if (!publicKey || typeof publicKey !== "string") {
      return res.status(400).json({ error: "A valid publicKey is required" });
    }
    if (!publicKey.startsWith("ssh-rsa") && !publicKey.startsWith("ssh-ed25519")) {
      return res.status(400).json({ error: "Invalid SSH public key format" });
    }

    // Hash the SSH key
    const keyHash = crypto.createHash("sha256").update(publicKey).digest("hex");

    // Load or initialize the mapping file
    let userToSsh = {};
    if (fs.existsSync(USER_TO_SSH_FILE)) {
      const fileContent = fs.readFileSync(USER_TO_SSH_FILE, "utf8");
      userToSsh = fileContent ? JSON.parse(fileContent) : {};
    }

    // Ensure req.user is populated
    if (!req.user || !req.user.username) {
      console.error("Error: req.user or username is missing");
      return res.status(401).json({ error: "User is not authenticated" });
    }

    // Update the mapping
    userToSsh[req.user.username] = keyHash;

    // Save the updated mapping
    fs.writeFileSync(USER_TO_SSH_FILE, JSON.stringify(userToSsh, null, 2));

    // Debug log
    console.log(`Updated user_to_ssh.json: ${JSON.stringify(userToSsh, null, 2)}`);

    res.json({ message: "SSH key updated successfully" });
  } catch (error) {
    console.error("Error updating SSH key:", error);
    res.status(500).json({ error: "Failed to update SSH key" });
  }
};