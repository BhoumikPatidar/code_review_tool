const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PERMISSIONS_FILE = "/var/lib/git/permissions.json";
const SSH_TO_USER_FILE = "/var/lib/git/ssh_to_user.json";

// Fetch permissions for a specific SSH key
// exports.getUserPermissions = (req, res) => {
//   const sshKey = req.query.sshKey;

//   if (!sshKey) {
//     return res.status(400).json({ error: "SSH key is required" });
//   }

//   try {
//     const permissions = JSON.parse(fs.readFileSync(PERMISSIONS_FILE, "utf8"));
//     const userPermissions = permissions[sshKey] || {};
//     const repositories = Object.keys(userPermissions).map(repo => ({
//       name: repo,
//       permissions: userPermissions[repo]
//     }));

//     res.json({ repositories });
//   } catch (err) {
//     console.error("Error reading permissions file:", err);
//     res.status(500).json({ error: "Error reading permissions file" });
//   }
// };

exports.getUserPermissions = async (req, res) => {
  try {
    console.log("\n=== GET USER PERMISSIONS START ===");
    console.log("Request user:", req.user);
    
    // Get username from authenticated user
    if (!req.user?.username) {
      console.error("No username found in req.user");
      return res.status(400).json({ error: "User not authenticated properly" });
    }

    // Get SSH key hash from ssh_to_user.json
    const userToSsh = JSON.parse(fs.readFileSync(SSH_TO_USER_FILE, "utf8"));
    console.log("ssh_to_user.json content:", userToSsh);
    console.log("Looking for username:", req.user.username);
    
    const keyHash = userToSsh[req.user.username];
    console.log("Found keyHash:", keyHash);

    if (!keyHash) {
      console.error("No SSH key hash found for user:", req.user.username);
      return res.status(400).json({ error: "No SSH key found for user" });
    }

    // Get permissions from permissions.json
    const permissions = JSON.parse(fs.readFileSync(PERMISSIONS_FILE, "utf8"));
    const userPermissions = permissions[keyHash] || {};

    console.log("All permissions:", permissions);
    console.log("User permissions for keyHash:", userPermissions);

    // Transform permissions into expected format
    const repositories = Object.entries(userPermissions).map(([repo, data]) => ({
      name: repo,
      permissions: data.permissions || []
    }));

    console.log("Formatted repositories:", repositories);
    console.log("=== GET USER PERMISSIONS END ===\n");

    return res.json({ repositories });
  } catch (error) {
    console.error("Error in getUserPermissions:", error);
    console.error("Stack trace:", error.stack);
    return res.status(500).json({ error: "Failed to get user permissions" });
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

// gitolite only clone and push
// exports.updatePermissions = (req, res) => {
//   const { sshKey, repo, permissions } = req.body;

//   if (!sshKey || !repo || !permissions || !Array.isArray(permissions)) {
//     return res.status(400).json({ error: "SSH key, repo, and permissions array are required" });
//   }

//   // Validate permissions array
//   const validActions = ["clone", "push"];
//   const invalidPermissions = permissions.filter(action => !validActions.includes(action));
//   if (invalidPermissions.length > 0) {
//     return res.status(400).json({ error: `Invalid permissions: ${invalidPermissions.join(", ")}` });
//   }

//   try {
//     const permissionsData = JSON.parse(fs.readFileSync(PERMISSIONS_FILE, "utf8"));

//     if (!permissionsData[sshKey]) {
//       permissionsData[sshKey] = {};
//     }

//     permissionsData[sshKey][repo] = permissions;

//     fs.writeFileSync(PERMISSIONS_FILE, JSON.stringify(permissionsData, null, 2));

//     // Update gitolite.conf
//     updateGitoliteConf(permissionsData);

//     res.json({ message: "Permissions updated successfully." });
//   } catch (err) {
//     console.error("Error updating permissions file:", err);
//     res.status(500).json({ error: "Error updating permissions file" });
//   }
// };

function hashSshKey(sshKey) {
  return crypto.createHash("sha256").update(sshKey).digest("hex");
}


// exports.updatePermissions = (req, res) => {
//   const { sshKey, repo, permissions, branch } = req.body;

//   if (!sshKey || !repo || !permissions || !Array.isArray(permissions)) {
//     return res.status(400).json({ error: "SSH key, repo, and permissions array are required" });
//   }

//   // Validate permissions array
//   const validActions = ["R", "W", "RW+", "branch"];
//   const invalidPermissions = permissions.filter((action) => !validActions.includes(action));
//   if (invalidPermissions.length > 0) {
//     return res.status(400).json({ error: `Invalid permissions: ${invalidPermissions.join(", ")}` });
//   }

//   try {
//     const sshKeyHash = hashSshKey(sshKey);
//     const permissionsData = fs.existsSync(PERMISSIONS_FILE)
//       ? JSON.parse(fs.readFileSync(PERMISSIONS_FILE, "utf8"))
//       : {};

//     if (!permissionsData[sshKeyHash]) {
//       permissionsData[sshKeyHash] = {};
//     }

//     permissionsData[sshKeyHash][repo] = { permissions, branch };

//     fs.writeFileSync(PERMISSIONS_FILE, JSON.stringify(permissionsData, null, 2));

//     res.json({ message: "Permissions updated successfully." });
//   } catch (err) {
//     console.error("Error updating permissions file:", err);
//     res.status(500).json({ error: "Error updating permissions file" });
//   }
// };

// exports.updatePermissions = async (req, res) => {
//   try {
//     const { sshKey, repo, permissions, branch } = req.body;
//     console.log("first0");
//     // Validate inputs
//     if (!sshKey || !repo || !permissions || !Array.isArray(permissions)) {
//       return res.status(400).json({ 
//         error: "SSH key, repo, and permissions array are required" 
//       });
//     }
//     console.log("first-1");
//     // Hash the SSH key
//     const sshKeyHash = hashSshKey(sshKey);
    
//     // Update permissions.json
//     const permissionsData = fs.existsSync(PERMISSIONS_FILE)
//       ? JSON.parse(fs.readFileSync(PERMISSIONS_FILE, "utf8"))
//       : {};

//     if (!permissionsData[sshKeyHash]) {
//       permissionsData[sshKeyHash] = {};
//     }
//     console.log("first");
//     permissionsData[sshKeyHash][repo] = { permissions, branch };
//     console.log("first1");
//     fs.writeFileSync(PERMISSIONS_FILE, JSON.stringify(permissionsData, null, 2));
//     console.log("first3");
//     // Update gitolite configuration
//     try {
//       await updateGitoliteConf(sshKey, repo, permissions, branch);
//       res.json({ message: "Permissions updated successfully" });
//     } catch (error) {
//       console.error("Error updating gitolite config:", error);
//       res.status(500).json({ error: "Failed to update gitolite configuration" });
//     }
//   } catch (err) {
//     console.error("Error updating permissions:", err);
//     res.status(500).json({ error: "Error updating permissions" });
//   }
// };
exports.updatePermissions = async (req, res) => {
  try {
    const { sshKey, repo, permissions, branch } = req.body;
    console.log("\n=== UPDATE PERMISSIONS START ===");
    console.log("Received request:", { repo, permissions, branch });
    
    // Validate inputs
    if (!sshKey || !repo || !permissions || !Array.isArray(permissions)) {
      console.error("Invalid input data");
      return res.status(400).json({ 
        error: "SSH key, repo, and permissions array are required" 
      });
    }

    // Hash the SSH key
    const sshKeyHash = hashSshKey(sshKey);
    console.log("Generated key hash:", sshKeyHash);
    
    // Read current permissions
    console.log("Reading current permissions from:", PERMISSIONS_FILE);
    const oldPermissions = fs.existsSync(PERMISSIONS_FILE) 
      ? JSON.parse(fs.readFileSync(PERMISSIONS_FILE, "utf8"))
      : {};
    console.log("Current permissions:", oldPermissions);

    // Create new permissions object
    if (!oldPermissions[sshKeyHash]) {
      oldPermissions[sshKeyHash] = {};
    }

    // Update permissions
    oldPermissions[sshKeyHash][repo] = { permissions, branch };
    console.log("Updated permissions object:", oldPermissions);

    // Write to file
    try {
      fs.writeFileSync(PERMISSIONS_FILE, JSON.stringify(oldPermissions, null, 2));
      console.log("Successfully wrote to permissions.json");
      
      // Verify write
      const verifyContent = JSON.parse(fs.readFileSync(PERMISSIONS_FILE, "utf8"));
      console.log("Verified file content:", verifyContent);
    } catch (writeErr) {
      console.error("Error writing permissions file:", writeErr);
      throw writeErr;
    }

    // Update gitolite configuration
    try {
      await updateGitoliteConf(sshKey, repo, permissions, branch);
      console.log("=== UPDATE PERMISSIONS END ===\n");
      res.json({ message: "Permissions updated successfully" });
    } catch (error) {
      console.error("Error updating gitolite config:", error);
      res.status(500).json({ error: "Failed to update gitolite configuration" });
    }
  } catch (err) {
    console.error("Error updating permissions:", err);
    console.error("Stack trace:", err.stack);
    res.status(500).json({ error: "Error updating permissions" });
  }
};
  const { execSync } = require("child_process");
  const GITOLITE_ADMIN_PATH = "/tmp/gitolite-admin"; // Path to the gitolite-admin repo
  const GITOLITE_CONF_PATH = `${GITOLITE_ADMIN_PATH}/conf/gitolite.conf`;
  
  // function updateGitoliteConf(permissionsData) {
  //   try {
  //     // Read the current gitolite.conf file
  //     let gitoliteConf = fs.readFileSync(GITOLITE_CONF_PATH, "utf8");
  
  //     // Start building the new gitolite.conf content
  //     let newConf = "";
  
  //     // Iterate over the permissions data
  //     for (const [sshKey, repos] of Object.entries(permissionsData)) {
  //       for (const [repo, actions] of Object.entries(repos)) {
  //         const permissionLevel = actions.includes("push") ? "RW+" : "R";
  
  //         // Add or update the repo entry in the gitolite.conf file
  //         const repoEntry = `repo ${repo}\n    ${permissionLevel}     =   ${sshKey}\n`;
  //         newConf += repoEntry;
  //       }
  //     }
  
  //     // Write the updated content back to gitolite.conf
  //     fs.writeFileSync(GITOLITE_CONF_PATH, newConf, "utf8");
  
  //     // Commit and push the changes to the gitolite-admin repo
  //     execSync(`cd ${GITOLITE_ADMIN_PATH} && git add conf/gitolite.conf && git commit -m "Update permissions" && git push`, {
  //       stdio: "inherit",
  //     });
  
  //     console.log("Gitolite configuration updated and pushed successfully.");
  //   } catch (err) {
  //     console.error("Error updating gitolite.conf:", err);
  //     throw new Error("Failed to update gitolite configuration.");
  //   }
  // }
  const KEYDIR_PATH = path.join(GITOLITE_ADMIN_PATH, "keydir");
  
function updateGitoliteConf(sshKey, repo, permissions, branch) {
    try {
      // Generate a unique hash for the SSH key
      const keyHash = crypto.createHash("sha256").update(sshKey).digest("hex");
      const keyFilePath = path.join(KEYDIR_PATH, `${keyHash}.pub`);
  
      // Ensure the SSH key is added to the keydir
      if (!fs.existsSync(keyFilePath)) {
        fs.writeFileSync(keyFilePath, sshKey, "utf8");
        console.log(`Added SSH key to keydir: ${keyFilePath}`);
      }
  
      // Read the existing gitolite.conf file
      let gitoliteConf = fs.readFileSync(GITOLITE_CONF_PATH, "utf8").split("\n");
  
      // Ensure the admin entry is preserved
      if (!gitoliteConf.some((line) => line.startsWith("repo gitolite-admin"))) {
        gitoliteConf.unshift("repo gitolite-admin\n    RW+     =   admin");
      }
        console.log(1);
      // Check if the repo already exists in the config
      const repoIndex = gitoliteConf.findIndex((line) => line.startsWith(`repo ${repo}`));
      if (repoIndex !== -1) {
        // Update existing repo entry
        const permissionLineIndex = repoIndex + 1;
  
        // Remove any existing permissions for this SSH key
        gitoliteConf = gitoliteConf.filter(
          (line) => !line.includes(`= ${keyHash}`) || !line.startsWith("    ")
        );
        console.log(2);
        // Add new permissions for this SSH key
        permissions.forEach((perm) => {
          const newPermission = branch
            ? `${perm} refs/heads/${branch} = ${keyHash}`
            : `${perm} = ${keyHash}`;
          gitoliteConf.splice(permissionLineIndex + 1, 0, `    ${newPermission}`);
        });
      } else {
        // Add a new repo entry
        const newRepoEntry = [`repo ${repo}`];
        permissions.forEach((perm) => {
          const newPermission = branch
            ? `    ${perm} refs/heads/${branch} = ${keyHash}`
            : `    ${perm} = ${keyHash}`;
          newRepoEntry.push(newPermission);
        });
        gitoliteConf.push(newRepoEntry.join("\n"));
      }
      console.log(3);
      // Write the updated config back to gitolite.conf
      fs.writeFileSync(GITOLITE_CONF_PATH, gitoliteConf.join("\n"), "utf8");
      console.log(4);
      // Commit and push the changes to the gitolite-admin repo
      execSync(`cd ${GITOLITE_ADMIN_PATH} && git add . && git commit -m "Update permissions" && git push`, {
        stdio: "inherit",
      });
      console.log(5);
      console.log("Gitolite configuration updated and pushed successfully.");
    } catch (err) {
      console.error("Error updating gitolite.conf:", err);
      throw new Error("Failed to update gitolite configuration.");
    }
  }