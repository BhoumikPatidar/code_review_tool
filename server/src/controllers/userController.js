// server/src/controllers/userController.js
const fs = require("fs-extra");
const path = require("path");

// Path to the git user's authorized_keys file.
// Adjust the path as needed for your server environment.
const AUTHORIZED_KEYS_PATH = "/home/git/.ssh/authorized_keys";

exports.updateSshKey = async (req, res) => {
  try {
    const { publicKey } = req.body;
    if (!publicKey || typeof publicKey !== 'string') {
      return res.status(400).json({ error: "A valid publicKey is required" });
    }
    // Simple validation: key should start with 'ssh-rsa' or 'ssh-ed25519'
    if (!publicKey.startsWith("ssh-rsa") && !publicKey.startsWith("ssh-ed25519")) {
      return res.status(400).json({ error: "Invalid SSH public key format" });
    }
    
    // Update the user's record with the publicKey.
    // req.user is set by your auth middleware.
    req.user.publicKey = publicKey;
    await req.user.save();

    // Prepare a marker comment to identify the user's key in authorized_keys.
    const marker = `# ${req.user.username}`;
    const newKeyLine = `${publicKey} ${marker}`;

    let fileContent = '';
    try {
      fileContent = await fs.readFile(AUTHORIZED_KEYS_PATH, 'utf8');
    } catch (err) {
      // If file doesn't exist, we'll create it.
      fileContent = '';
    }
    // Split into lines and filter out empty lines.
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');
    let updated = false;
    const newLines = lines.map(line => {
      if (line.includes(marker)) {
        updated = true;
        return newKeyLine;
      }
      return line;
    });
    if (!updated) {
      newLines.push(newKeyLine);
    }
    // Write the updated content back.
    await fs.writeFile(AUTHORIZED_KEYS_PATH, newLines.join('\n') + '\n');
    
    res.json({ message: "SSH key updated successfully" });
  } catch (error) {
    console.error("Error updating SSH key:", error);
    res.status(500).json({ error: error.message });
  }
};
