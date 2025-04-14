const fs = require("fs");
const path = require("path");

const PERMISSIONS_FILE = "/var/lib/git/permissions.json";

// Fetch permissions for a specific SSH key
exports.getUserPermissions = (req, res) => {
  const sshKey = req.query.sshKey;

  if (!sshKey) {
    return res.status(400).json({ error: "SSH key is required" });
  }

  try {
    const permissions = JSON.parse(fs.readFileSync(PERMISSIONS_FILE, "utf8"));
    const userPermissions = permissions[sshKey] || {};
    const repositories = Object.keys(userPermissions).map(repo => ({
      name: repo,
      permissions: userPermissions[repo]
    }));

    res.json({ repositories });
  } catch (err) {
    console.error("Error reading permissions file:", err);
    res.status(500).json({ error: "Error reading permissions file" });
  }
};

// Fetch all SSH keys and their permissions (admin only)
exports.getAllPermissions = (req, res) => {
  try {
    const permissions = JSON.parse(fs.readFileSync(PERMISSIONS_FILE, "utf8"));
    res.json(permissions);
  } catch (err) {
    console.error("Error reading permissions file:", err);
    res.status(500).json({ error: "Error reading permissions file" });
  }
};

const { exec } = require("child_process");

exports.updatePermissions = (req, res) => {
  const { sshKey, repo, permissions } = req.body;

  if (!sshKey || !repo || !permissions) {
    return res.status(400).json({ error: "SSH key, repo, and permissions are required" });
  }

  try {
    const permissionsData = JSON.parse(fs.readFileSync(PERMISSIONS_FILE, "utf8"));

    if (!permissionsData[sshKey]) {
      permissionsData[sshKey] = {};
    }

    permissionsData[sshKey][repo] = permissions;

    fs.writeFileSync(PERMISSIONS_FILE, JSON.stringify(permissionsData, null, 2));

    // Trigger the hook application script
    exec("/var/lib/git/apply-hooks.sh", (error, stdout, stderr) => {
      if (error) {
        console.error(`Error applying hooks: ${error.message}`);
        return res.status(500).json({ error: "Error applying hooks" });
      }
      console.log(`Hook application output: ${stdout}`);
      res.json({ message: "Permissions updated and hooks applied successfully" });
    });
  } catch (err) {
    console.error("Error updating permissions file:", err);
    res.status(500).json({ error: "Error updating permissions file" });
  }
};