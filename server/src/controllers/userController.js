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

    // Load the existing mapping file
    let sshToUser = {};
    if (fs.existsSync(SSH_TO_USER_FILE)) {
      sshToUser = JSON.parse(fs.readFileSync(SSH_TO_USER_FILE, "utf8"));
    }

    // Update the mapping
    sshToUser[keyHash] = req.user.username;

    // Save the updated mapping
    fs.writeFileSync(SSH_TO_USER_FILE, JSON.stringify(sshToUser, null, 2));

    res.json({ message: "SSH key updated successfully" });
  } catch (error) {
    console.error("Error updating SSH key:", error);
    res.status(500).json({ error: error.message });
  }
};