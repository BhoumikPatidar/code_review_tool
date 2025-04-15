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

// exports.updatePermissions = (req, res) => {
//     const { sshKey, repo, permissions } = req.body;
  
//     if (!sshKey || !repo || !permissions || !Array.isArray(permissions)) {
//       return res.status(400).json({ error: "SSH key, repo, and permissions array are required" });
//     }
  
//     // Validate permissions array
//     const validActions = ["clone", "push"];
//     const invalidPermissions = permissions.filter(action => !validActions.includes(action));
//     if (invalidPermissions.length > 0) {
//       return res.status(400).json({ error: `Invalid permissions: ${invalidPermissions.join(", ")}` });
//     }
  
//     try {
//       const permissionsData = JSON.parse(fs.readFileSync(PERMISSIONS_FILE, "utf8"));
  
//       if (!permissionsData[sshKey]) {
//         permissionsData[sshKey] = {};
//       }
  
//       permissionsData[sshKey][repo] = permissions;
  
//       fs.writeFileSync(PERMISSIONS_FILE, JSON.stringify(permissionsData, null, 2));
  
//       // Trigger the hook application script
//       exec("/var/lib/git/apply-hooks.sh", (error, stdout, stderr) => {
//         if (error) {
//           console.error(`Error applying hooks: ${error.message}`);
//           return res.status(500).json({ error: "Error applying hooks" });
//         }
//         console.log(`Hook application output: ${stdout}`);
//         res.json({ message: "Permissions updated and hooks applied successfully" });
//       });
//     } catch (err) {
//       console.error("Error updating permissions file:", err);
//       res.status(500).json({ error: "Error updating permissions file" });
//     }
//   };
exports.updatePermissions = (req, res) => {
  const { sshKey, repo, permissions } = req.body;

  if (!sshKey || !repo || !permissions || !Array.isArray(permissions)) {
    return res.status(400).json({ error: "SSH key, repo, and permissions array are required" });
  }

  // Validate permissions array
  const validActions = ["clone", "push"];
  const invalidPermissions = permissions.filter(action => !validActions.includes(action));
  if (invalidPermissions.length > 0) {
    return res.status(400).json({ error: `Invalid permissions: ${invalidPermissions.join(", ")}` });
  }

  try {
    const permissionsData = JSON.parse(fs.readFileSync(PERMISSIONS_FILE, "utf8"));

    if (!permissionsData[sshKey]) {
      permissionsData[sshKey] = {};
    }

    permissionsData[sshKey][repo] = permissions;

    fs.writeFileSync(PERMISSIONS_FILE, JSON.stringify(permissionsData, null, 2));

    // Update gitolite.conf
    updateGitoliteConf(permissionsData);

    res.json({ message: "Permissions updated successfully." });
  } catch (err) {
    console.error("Error updating permissions file:", err);
    res.status(500).json({ error: "Error updating permissions file" });
  }
};

  const { execSync } = require("child_process");
  const GITOLITE_ADMIN_PATH = "/home/git/gitolite-admin"; // Path to the gitolite-admin repo
  const GITOLITE_CONF_PATH = `${GITOLITE_ADMIN_PATH}/conf/gitolite.conf`;
  
  function updateGitoliteConf(permissionsData) {
    try {
      // Read the current gitolite.conf file
      let gitoliteConf = fs.readFileSync(GITOLITE_CONF_PATH, "utf8");
  
      // Start building the new gitolite.conf content
      let newConf = "";
  
      // Iterate over the permissions data
      for (const [sshKey, repos] of Object.entries(permissionsData)) {
        for (const [repo, actions] of Object.entries(repos)) {
          const permissionLevel = actions.includes("push") ? "RW+" : "R";
  
          // Add or update the repo entry in the gitolite.conf file
          const repoEntry = `repo ${repo}\n    ${permissionLevel}     =   ${sshKey}\n`;
          newConf += repoEntry;
        }
      }
  
      // Write the updated content back to gitolite.conf
      fs.writeFileSync(GITOLITE_CONF_PATH, newConf, "utf8");
  
      // Commit and push the changes to the gitolite-admin repo
      execSync(`cd ${GITOLITE_ADMIN_PATH} && git add conf/gitolite.conf && git commit -m "Update permissions" && git push`, {
        stdio: "inherit",
      });
  
      console.log("Gitolite configuration updated and pushed successfully.");
    } catch (err) {
      console.error("Error updating gitolite.conf:", err);
      throw new Error("Failed to update gitolite configuration.");
    }
  }