// server/src/controllers/userController.js
const fs = require("fs-extra");
const path = require("path");
const { User } = require('../models');

// Path to the git user's authorized_keys file.
const AUTHORIZED_KEYS_PATH = "/home/git/.ssh/authorized_keys";
// Path to the SSH wrapper script
const GIT_AUTH_WRAPPER = "/path/to/git-auth-wrapper.sh";

exports.updateSshKey = async (req, res) => {
  console.log("updateSshKey called with body:", req.body);
  try {
    const { publicKey } = req.body;

    // Validate the public key
    if (!publicKey || typeof publicKey !== 'string') {
      return res.status(400).json({ error: "A valid publicKey is required" });
    }
    if (!publicKey.startsWith("ssh-rsa") && !publicKey.startsWith("ssh-ed25519")) {
      return res.status(400).json({ error: "Invalid SSH public key format" });
    }

    // Ensure req.user is populated
    if (!req.user || !req.user.username) {
      return res.status(400).json({ error: "User not authenticated" });
    }

    // Update the user's record with the publicKey
    req.user.publicKey = publicKey;
    await req.user.save();

    // Prepare the command restriction for the authorized_keys file
    const username = req.user.username;
    const marker = `# ${username}`;
    
    // Format with command restriction for permission checking
    const restrictedCommand = `command="${GIT_AUTH_WRAPPER} ${username}",no-port-forwarding,no-X11-forwarding,no-agent-forwarding,no-pty ${publicKey} ${marker}`;

    let fileContent = '';
    try {
      console.log("Reading authorized_keys file...");
      fileContent = await fs.readFile(AUTHORIZED_KEYS_PATH, 'utf8');
      console.log("File content read successfully.");
    } catch (err) {
      console.warn("authorized_keys file not found, creating a new one.");
      fileContent = '';
    }

    // Update or add the key
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');
    let updated = false;
    const newLines = lines.map(line => {
      if (line.includes(marker)) {
        updated = true;
        return restrictedCommand;
      }
      return line;
    });
    if (!updated) {
      newLines.push(restrictedCommand);
    }

    // Write the updated content back
    console.log("Writing updated content to authorized_keys...");
    await fs.ensureDir(path.dirname(AUTHORIZED_KEYS_PATH));
    await fs.writeFile(AUTHORIZED_KEYS_PATH, newLines.join('\n') + '\n', { mode: 0o600 });
    console.log("authorized_keys updated successfully.");

    res.json({ message: "SSH key updated successfully" });
  } catch (error) {
    console.error("Error updating SSH key:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    // Return the user's profile without sensitive information
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'username', 'createdAt']
    });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Check if user has an SSH key
    const hasSSHKey = !!req.user.publicKey;
    
    res.json({
      id: user.id,
      username: user.username,
      createdAt: user.createdAt,
      hasSSHKey
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.status(400).json({ error: "Search query must be at least 2 characters" });
    }
    
    // Search for users by username
    const users = await User.findAll({
      where: {
        username: {
          [sequelize.Op.like]: `%${query}%`
        }
      },
      attributes: ['id', 'username'],
      limit: 10
    });
    
    res.json({ users });
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ error: error.message });
  }
};