// server/src/controllers/repoController.js
const NodeGit = require("nodegit");
const path = require("path");
const fs = require('fs');
const os = require('os');
const PullRequest = require("../models/PullRequest");
const { updateGitoliteConf } = require('./permissionsController');


// Define the base directory where your repositories are located
const REPO_BASE_PATH = "/home/git/repositories";
const SSH_TO_USER_FILE = "/var/lib/git/ssh_to_user.json";
const PERMISSIONS_FILE = "/var/lib/git/permissions.json";

/**
 * List all repositories (directories) in REPO_BASE_PATH.
 */
// async function listRepos(req, res) {
//   try {
//     console.log("Checking directory:", REPO_BASE_PATH);

//     // First check if directory exists
//     if (!fs.existsSync(REPO_BASE_PATH)) {
//       console.log("Creating base directory");
//       fs.mkdirSync(REPO_BASE_PATH, { recursive: true });
//     }

//     // Read directory synchronously
//     const files = fs.readdirSync(REPO_BASE_PATH);
//     const repos = [];

//     // Process each file synchronously
//     for (const file of files) {
//       const fullPath = path.join(REPO_BASE_PATH, file);
//       const stats = fs.statSync(fullPath);
      
//       if (stats.isDirectory()) {
//         repos.push({ name: file });
//       }
//     }

//     console.log("Found repositories:", repos);
//     res.json({ repositories: repos });

//   } catch (err) {
//     console.error("Error in listRepos:", err);
//     res.status(500).json({ 
//       error: "Error listing repositories",
//       details: err.message 
//     });
//   }
// }

function hashSshKey(sshKey) {
  return crypto.createHash("sha256").update(sshKey).digest("hex");
}

async function listRepos(req, res) {
  console.log("\n=== LIST REPOS CONTROLLER START ===");
  console.log("Full request object:", {
    headers: req.headers,
    user: req.user,
    method: req.method,
    path: req.path
  });

  try {
    console.log("Checking req.user object...");
    console.log("req.user:", req.user);
    
    if (!req.user || !req.user.keyHash) {
      console.error("❌ Error: req.user or keyHash is missing");
      console.error("req.user present:", !!req.user);
      console.error("keyHash present:", req.user?.keyHash);
      return res.status(400).json({ error: "User is not authenticated" });
    }

    console.log("✅ Valid user data found:", {
      username: req.user.username,
      keyHash: req.user.keyHash
    });

    console.log("Reading permissions.json...");
    const permissions = fs.existsSync(PERMISSIONS_FILE)
      ? JSON.parse(fs.readFileSync(PERMISSIONS_FILE, "utf8"))
      : {};
    
    console.log("Contents of permissions.json:", JSON.stringify(permissions, null, 2));
    console.log("Looking for permissions with key hash:", req.user.keyHash);

    const accessibleRepos = [];
    if (permissions[req.user.keyHash]) {
      console.log("✅ Found permissions for user's key hash");
      for (const repoName of Object.keys(permissions[req.user.keyHash])) {
        console.log(`Adding repo: ${repoName}`);
        accessibleRepos.push({
          name: repoName,
          permissions: permissions[req.user.keyHash][repoName].permissions
        });
      }
    }

    if (accessibleRepos.length === 0) {
      console.log(`ℹ️ No repositories found for user ${req.user.username}`);
      console.log("=== LIST REPOS CONTROLLER END ===\n");
      return res.json({
        repositories: [],
        message: "No repositories available to you"
      });
    }

    console.log("✅ Found repositories:", JSON.stringify(accessibleRepos, null, 2));
    console.log("=== LIST REPOS CONTROLLER END ===\n");
    res.json({ repositories: accessibleRepos });
  } catch (err) {
    console.error("❌ Error listing repositories:", err);
    console.error("Error stack:", err.stack);
    console.log("=== LIST REPOS CONTROLLER END WITH ERROR ===\n");
    res.status(500).json({ error: "Error listing repositories" });
  }
}

// async function createRepo(req, res) {
//   try {
//     const { name } = req.body;
//     if (!name) {
//       return res.status(400).json({ error: "Repository name is required" });
//     }
//     // Ensure repository name ends with .git
//     const repoName = name.endsWith('.git') ? name : `${name}.git`;
//     const newRepoPath = path.join(REPO_BASE_PATH, repoName);

//     // Check if repository already exists
//     try {
//       await fs.access(newRepoPath);
//       return res.status(400).json({ error: "Repository already exists" });
//     } catch (err) {
//       // Repository doesn't exist; continue to create.
//     }

//     console.log("Creating repository at:", newRepoPath);
//     // Create a bare repository (isBare = 1)
//     const repo = await NodeGit.Repository.init(newRepoPath, 1);
//     console.log("Repository created at:", repo.path());
//     res.json({ message: "Repository created successfully", repository: repoName });
//   } catch (error) {
//     console.error("Error creating repository:", error);
//     res.status(500).json({ error: error.message });
//   }
// }
// async function createRepo(req, res) {
//   try {
//     const { name } = req.body;
//     if (!name) {
//       return res.status(400).json({ error: "Repository name is required" });
//     }

//     // Get creator's SSH key hash from ssh_to_user.json
//     const sshToUser = JSON.parse(fs.readFileSync(SSH_TO_USER_FILE, "utf8"));
//     const creatorKeyHash = req.user.keyHash; // This comes from auth middleware

//     if (!creatorKeyHash) {
//       return res.status(400).json({ error: "Could not determine creator's SSH key" });
//     }

//     // Ensure repository name ends with .git
//     const repoName = name.endsWith('.git') ? name : `${name}.git`;
//     const newRepoPath = path.join(REPO_BASE_PATH, repoName);

//     // Check if repository already exists
//     try {
//       await fs.access(newRepoPath);
//       return res.status(400).json({ error: "Repository already exists" });
//     } catch (err) {
//       // Repository doesn't exist; continue to create.
//     }

//     console.log("Creating repository at:", newRepoPath);
//     // Create a bare repository (isBare = 1)
//     const repo = await NodeGit.Repository.init(newRepoPath, 1);
//     console.log("Repository created at:", repo.path());

//     // Update permissions.json to give creator RW+ access
//     const permissionsPath = "/var/lib/git/permissions.json";
//     const permissions = fs.existsSync(permissionsPath)
//       ? JSON.parse(fs.readFileSync(permissionsPath, "utf8"))
//       : {};

//     if (!permissions[creatorKeyHash]) {
//       permissions[creatorKeyHash] = {};
//     }

//     // Give RW+ permission to the creator
//     const repoBaseName = name.replace('.git', '');
//     permissions[creatorKeyHash][repoBaseName] = {
//       permissions: ["RW+"],
//       branch: ""  // Empty string for all branches
//     };

//     // Write updated permissions to file
//     fs.writeFileSync(permissionsPath, JSON.stringify(permissions, null, 2));

//     // Update gitolite configuration using existing function
//     const { updateGitoliteConf } = require('./permissionsController');
//     try {
//       await updateGitoliteConf(req.user.sshKey, repoBaseName, ["RW+"], "");
//     } catch (gitoliteError) {
//       console.error("Error updating gitolite config:", gitoliteError);
//       // Continue anyway since the permissions.json was updated
//     }

//     res.json({ 
//       message: "Repository created successfully and permissions granted", 
//       repository: repoName 
//     });
//   } catch (error) {
//     console.error("Error creating repository:", error);
//     res.status(500).json({ error: error.message });
//   }
// }

async function getCommits(req, res) {
  const repoName = req.params.repoName;
  const repoPath = path.join(REPO_BASE_PATH, repoName.endsWith('.git') ? repoName : `${repoName}.git`);

  console.log("Attempting to open repository at path:", repoPath);

  try {
    const repo = await NodeGit.Repository.open(repoPath);
    let headCommit;

    // Try to get the HEAD commit.
    try {
      const branchName = (await repo.getCurrentBranch()).shorthand();
      headCommit = await repo.getBranchCommit(branchName);
    } catch (e) {
      console.warn("getHeadCommit failed:", e.message);
      headCommit = null;
    }

    // If no HEAD, try to get the commit from the 'main' branch.
    if (!headCommit) {
      try {
        headCommit = await repo.getBranchCommit('master');
      } catch (e) {
        console.warn("getBranchCommit('master') failed:", e.message);
        return res.json({ commits: [] });
      }
    }

    let commits = [];
    const history = headCommit.history();

    history.on("commit", commit => {
      commits.push({
        sha: commit.sha(),
        message: commit.message().trim(),
        author: commit.author().name(),
        date: commit.date()
      });
    });

    history.on("end", () => {
      res.json({ commits });
    });

    history.on("error", err => {
      console.error("Error reading commit history:", err);
      res.status(500).json({ error: "Error reading commit history" });
    });

    history.start();
  } catch (err) {
    console.error("Error opening repository:", err.message);
    res.status(500).json({ error: "Error opening repository" });
  }
}

async function createRepo(req, res) {
  try {
    console.log("\n=== CREATE REPO START ===");
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Repository name is required" });
    }

    // Get creator's details from auth middleware
    const creatorKeyHash = req.user.keyHash;
    const creatorSshKey = req.user.sshKey; // Make sure this is available from auth middleware

    if (!creatorKeyHash || !creatorSshKey) {
      console.error("Missing user authentication details:", { keyHash: !!creatorKeyHash, sshKey: !!creatorSshKey });
      return res.status(400).json({ error: "Could not determine creator's credentials" });
    }

    // Ensure repository name ends with .git
    const repoName = name.endsWith('.git') ? name : `${name}.git`;
    const newRepoPath = path.join(REPO_BASE_PATH, repoName);

    // Check if repository already exists
    try {
      await fs.access(newRepoPath);
      return res.status(400).json({ error: "Repository already exists" });
    } catch (err) {
      // Repository doesn't exist; continue to create.
    }

    console.log("Creating repository at:", newRepoPath);
    const repo = await NodeGit.Repository.init(newRepoPath, 1);
    console.log("Repository created at:", repo.path());

    // Update permissions.json
    console.log("Updating permissions.json...");
    const permissions = fs.existsSync(PERMISSIONS_FILE)
      ? JSON.parse(fs.readFileSync(PERMISSIONS_FILE, "utf8"))
      : {};

    if (!permissions[creatorKeyHash]) {
      permissions[creatorKeyHash] = {};
    }

    const repoBaseName = name.replace('.git', '');
    permissions[creatorKeyHash][repoBaseName] = {
      permissions: ["RW+"],
      branch: ""
    };

    fs.writeFileSync(PERMISSIONS_FILE, JSON.stringify(permissions, null, 2));
    console.log("permissions.json updated");

    // Update gitolite configuration
    console.log("Updating gitolite configuration...");
    try {
      await updateGitoliteConf(creatorSshKey, repoBaseName, ["RW+"], "");
      console.log("Gitolite configuration updated");
    } catch (gitoliteError) {
      console.error("Error updating gitolite config:", gitoliteError);
      // Don't return error yet since permissions.json was updated
    }

    console.log("=== CREATE REPO END ===\n");
    res.json({ 
      message: "Repository created successfully and permissions granted", 
      repository: repoName 
    });

  } catch (error) {
    console.error("Error in createRepo:", error);
    res.status(500).json({ error: error.message });
  }
}




// async function getRepoTree(req, res) {
//   const repoName = req.params.repoName;
//   const queryPath = req.query.path || '';
//   const branch = req.query.branch || 'main';

//   try {
//     const actualRepoName = repoName.endsWith('.git') ? repoName : `${repoName}.git`;
//     const repoPath = path.join(REPO_BASE_PATH, actualRepoName);
//     const repo = await NodeGit.Repository.open(repoPath);
    
//     // Get specified branch commit
//     const commit = await repo.getBranchCommit(branch);
//     const tree = await commit.getTree();
    
//     let targetTree = tree;
//     if (queryPath) {
//       try {
//         const entry = await tree.getEntry(queryPath);
//         if (entry.isTree()) {
//           targetTree = await entry.getTree();
//         } else {
//           return res.status(400).json({ error: "The provided path points to a file, not a directory" });
//         }
//       } catch (err) {
//         console.error("Error getting subtree:", err);
//         return res.status(400).json({ error: "Invalid path" });
//       }
//     }

//     const entries = [];
//     targetTree.entries().forEach(entry => {
//       entries.push({
//         name: entry.name(),
//         type: entry.isBlob() ? 'file' : 'directory',
//         sha: entry.sha()
//       });
//     });

//     res.json({ path: queryPath, entries });
//   } catch(err) {
//     console.error("Error getting repository tree:", err);
//     res.status(500).json({ error: "Error getting repository tree" });
//   }
// }

// async function getRepoTree(req, res) {
//   const repoName = req.params.repoName;
//   const queryPath = req.query.path || '';
//   const branch = req.query.branch || 'master';

//   try {
//     const actualRepoName = repoName.endsWith('.git') ? repoName : `${repoName}.git`;
//     const repoPath = path.join(REPO_BASE_PATH, actualRepoName);
//     const repo = await NodeGit.Repository.open(repoPath);

//     // Get specified branch commit
//     const commit = await repo.getBranchCommit(branch);
//     const tree = await commit.getTree();

//     let targetTree = tree;
//     if (queryPath) {
//       try {
//         const entry = await tree.getEntry(queryPath);
//         if (entry.isTree()) {
//           targetTree = await entry.getTree();
//         } else {
//           return res.status(400).json({ error: "The provided path points to a file, not a directory" });
//         }
//       } catch (err) {
//         console.error("Error getting subtree:", err);
//         return res.status(400).json({ error: "Invalid path" });
//       }
//     }

//     const entries = [];
//     targetTree.entries().forEach(entry => {
//       const fileType = entry.isBlob() ? 'file' : 'directory';
//       entries.push({
//         name: entry.name(),
//         type: fileType,
//         sha: entry.sha(),
//       });
//     });

//     if (entries.length === 0) {
//       return res.json({ path: queryPath, entries: [], message: "The repository is empty or contains no supported files." });
//     }

//     res.json({ path: queryPath, entries });
//   } catch (err) {
//     console.error("Error getting repository tree:", err);
//     res.status(500).json({ error: "Error getting repository tree" });
//   }
// }
async function getRepoTree(req, res) {
  const repoName = req.params.repoName;
  const queryPath = req.query.path || '';
  const requestedBranch = req.query.branch || 'main';

  try {
    const actualRepoName = repoName.endsWith('.git') ? repoName : `${repoName}.git`;
    const repoPath = path.join(REPO_BASE_PATH, actualRepoName);
    console.log(`Opening repository at: ${repoPath}`);
    
    const repo = await NodeGit.Repository.open(repoPath);

    // Try to get specified branch commit with fallback logic
    let commit;
    try {
      // Try requested branch first
      commit = await repo.getBranchCommit(requestedBranch);
    } catch (branchErr) {
      console.log(`Branch '${requestedBranch}' not found, trying alternatives...`);
      try {
        // Try 'master' branch
        commit = await repo.getBranchCommit('master');
      } catch (masterErr) {
        try {
          // Try 'main' branch
          commit = await repo.getBranchCommit('main');
        } catch (mainErr) {
          // If no standard branches exist, try to get HEAD
          try {
            const head = await repo.head();
            commit = await repo.getCommit(head.target());
          } catch (headErr) {
            // If repository is completely empty, return empty result
            console.log("Repository appears to be empty");
            return res.json({
              path: queryPath,
              entries: [],
              message: "Repository is empty. Initialize with a commit to view contents."
            });
          }
        }
      }
    }

    console.log("Successfully found a valid commit");
    const tree = await commit.getTree();

    let targetTree = tree;
    if (queryPath) {
      try {
        const entry = await tree.getEntry(queryPath);
        if (entry.isTree()) {
          targetTree = await entry.getTree();
        } else {
          return res.status(400).json({ error: "The provided path points to a file, not a directory" });
        }
      } catch (err) {
        console.error("Error getting subtree:", err);
        return res.status(400).json({ error: "Invalid path" });
      }
    }

    const entries = [];
    targetTree.entries().forEach(entry => {
      const fileType = entry.isBlob() ? 'file' : 'directory';
      entries.push({
        name: entry.name(),
        type: fileType,
        sha: entry.sha(),
      });
    });

    if (entries.length === 0) {
      return res.json({
        path: queryPath,
        entries: [],
        message: "This directory is empty."
      });
    }

    res.json({ path: queryPath, entries });
  } catch (err) {
    console.error("Error getting repository tree:", err);
    res.status(500).json({
      error: "Error getting repository tree",
      details: err.message
    });
  }
}

// async function getFileContent(req, res) {
//   const repoName = req.params.repoName;
//   const filePath = req.query.path;

//   if (!filePath) {
//     return res.status(400).json({ error: "File path is required" });
//   }

//   try {
//     const actualRepoName = repoName.endsWith('.git') ? repoName : `${repoName}.git`;
//     const repoPath = path.join(REPO_BASE_PATH, actualRepoName);
//     const repo = await NodeGit.Repository.open(repoPath);

//     // Get the current branch's head commit
//     let headCommit;
//     try {
//       const branchName = (await repo.getCurrentBranch()).shorthand();
//       headCommit = await repo.getBranchCommit(branchName);
//     } catch (e) {
//       headCommit = await repo.getBranchCommit('main');
//     }

//     const tree = await headCommit.getTree();
//     const entry = await tree.getEntry(filePath);

//     if (!entry.isBlob()) {
//       return res.status(400).json({ error: "The provided path is not a file" });
//     }

//     const blob = await entry.getBlob();
//     res.json({ 
//       path: filePath,
//       content: blob.toString(),
//       size: blob.rawsize()
//     });

//   } catch(err) {
//     console.error("Error getting file content:", err);
//     res.status(500).json({ 
//       error: "Error getting file content",
//       details: err.message 
//     });
//   }
// }
async function getFileContent(req, res) {
  const repoName = req.params.repoName;
  const filePath = req.query.path;

  if (!filePath) {
    return res.status(400).json({ error: "File path is required" });
  }

  try {
    const actualRepoName = repoName.endsWith('.git') ? repoName : `${repoName}.git`;
    const repoPath = path.join(REPO_BASE_PATH, actualRepoName);
    const repo = await NodeGit.Repository.open(repoPath);

    // Get the current branch's head commit
    let headCommit;
    try {
      const branchName = (await repo.getCurrentBranch()).shorthand();
      headCommit = await repo.getBranchCommit(branchName);
    } catch (e) {
      headCommit = await repo.getBranchCommit('master');
    }

    const tree = await headCommit.getTree();
    const entry = await tree.getEntry(filePath);

    if (!entry.isBlob()) {
      return res.status(400).json({ error: "The provided path is not a file" });
    }

    const blob = await entry.getBlob();
    const content = blob.toString();

    if (!content.trim()) {
      return res.json({ path: filePath, content: "This file is empty." });
    }

    res.json({ path: filePath, content, size: blob.rawsize() });
  } catch (err) {
    console.error("Error getting file content:", err);
    res.status(500).json({ error: "Error getting file content", details: err.message });
  }
}

// old
// async function getBranches(req, res) {
//   const repoName = req.params.repoName;
//   try {
//     const actualRepoName = repoName.endsWith('.git') ? repoName : `${repoName}.git`;
//     const repoPath = path.join(REPO_BASE_PATH, actualRepoName);
//     const repo = await NodeGit.Repository.open(repoPath);
    
//     const refs = await repo.getReferences(NodeGit.Reference.TYPE.LISTALL);
//     const branches = refs
//       .filter(ref => ref.isBranch())
//       .map(ref => ({
//         name: ref.shorthand(),
//         isHead: ref.isHead()
//       }));
    
//     res.json({ branches });
//   } catch(err) {
//     console.error("Error getting branches:", err);
//     res.status(500).json({ error: "Error getting branches" });
//   }
// }
//new
async function getBranches(req, res) {
  const repoName = req.params.repoName;
  try {
    const actualRepoName = repoName.endsWith('.git') ? repoName : `${repoName}.git`;
    const repoPath = path.join(REPO_BASE_PATH, actualRepoName);
    const repo = await NodeGit.Repository.open(repoPath);
    
    // Use Reference.list() instead of getReferences
    const branchRefs = await NodeGit.Reference.list(repo);
    const branches = [];

    // Process each reference
    for (const refName of branchRefs) {
      const ref = await NodeGit.Reference.lookup(repo, refName);
      if (ref.isBranch()) {
        branches.push({
          name: ref.shorthand(),
          isHead: ref.isHead(),
          target: ref.target().tostrS()
        });
      }
    }

    console.log("Found branches:", branches); // Debug log
    res.json({ branches });
  } catch(err) {
    console.error("Error getting branches:", err);
    res.status(500).json({ 
      error: "Error getting branches",
      details: err.message 
    });
  }
}

// async function getDiff(req, res) {
//   const repoName = req.params.repoName;
//   const { commit1, commit2, filePath } = req.query;

//   if (!commit1 || !commit2 || !filePath) {
//     return res.status(400).json({ error: "Missing required parameters" });
//   }

//   try {
//     const actualRepoName = repoName.endsWith('.git') ? repoName : `${repoName}.git`;
//     const repoPath = path.join(REPO_BASE_PATH, actualRepoName);
//     const repo = await NodeGit.Repository.open(repoPath);

//     const c1 = await repo.getCommit(commit1);
//     const c2 = await repo.getCommit(commit2);

//     const tree1 = await c1.getTree();
//     const tree2 = await c2.getTree();

//     const diff = await NodeGit.Diff.treeToTree(repo, tree1, tree2, {
//       pathspec: [filePath],
//       flags: NodeGit.Diff.OPTION.SHOW_UNTRACKED_CONTENT
//     });

//     const patches = await diff.patches();
//     let diffText = '';

//     for (const patch of patches) {
//       const hunks = await patch.hunks();
//       for (const hunk of hunks) {
//         const lines = await hunk.lines();
//         for (const line of lines) {
//           const prefix = String.fromCharCode(line.origin());
//           diffText += prefix + line.content();
//         }
//       }
//     }

//     res.json({ diff: diffText });
//   } catch (err) {
//     console.error("Error getting diff:", err);
//     res.status(500).json({ error: "Error getting diff", details: err.message });
//   }
// }
async function getDiff(req, res) {
  const repoName = req.params.repoName;
  const { commit1, commit2, sourceBranch, targetBranch } = req.query;

  if (!commit1 || !commit2) {
    return res.status(400).json({ error: "Both commit1 and commit2 are required" });
  }

  try {
    const actualSourceBranch = sourceBranch || "master"; // Default to "main" if not provided
    const actualTargetBranch = targetBranch || "master"; // Default to "main" if not provided

    const actualRepoName = repoName.endsWith('.git') ? repoName : `${repoName}.git`;
    const repoPath = path.join(REPO_BASE_PATH, actualRepoName);
    const repo = await NodeGit.Repository.open(repoPath);

    const commitObj1 = await repo.getCommit(commit1);
    const commitObj2 = await repo.getCommit(commit2);

    const tree1 = await commitObj1.getTree();
    const tree2 = await commitObj2.getTree();

    const diff = await NodeGit.Diff.treeToTree(repo, tree1, tree2);

    const patches = await diff.patches();
    let diffText = "";

    for (const patch of patches) {
      const hunks = await patch.hunks();
      for (const hunk of hunks) {
        const lines = await hunk.lines();
        for (const line of lines) {
          const prefix = String.fromCharCode(line.origin());
          diffText += prefix + line.content();
        }
      }
    }

    res.json({ diff: diffText });
  } catch (err) {
    console.error("Error getting diff:", err);
    res.status(500).json({ error: "Error getting diff", details: err.message });
  }
}
async function getPRDiff(req, res) {
  const repoName = req.params.repoName;
  const { sourceBranch, targetBranch } = req.query;

  if (!sourceBranch || !targetBranch) {
    return res.status(400).json({ error: "Source and target branches are required" });
  }

  try {
    const actualRepoName = repoName.endsWith('.git') ? repoName : `${repoName}.git`;
    const repoPath = path.join(REPO_BASE_PATH, actualRepoName);
    const repo = await NodeGit.Repository.open(repoPath);

    const sourceCommit = await repo.getBranchCommit(sourceBranch);
    const targetCommit = await repo.getBranchCommit(targetBranch);

    const sourceTree = await sourceCommit.getTree();
    const targetTree = await targetCommit.getTree();

    const diff = await NodeGit.Diff.treeToTree(repo, sourceTree, targetTree);

    const filesWithDiffs = [];
    const patches = await diff.patches();

    for (const patch of patches) {
      const filePath = patch.newFile().path();
      const hunks = await patch.hunks();
      const diffLines = [];

      for (const hunk of hunks) {
        const lines = await hunk.lines();
        for (const line of lines) {
          const prefix = String.fromCharCode(line.origin());
          diffLines.push(prefix + line.content());
        }
      }

      filesWithDiffs.push({
        file: filePath,
        diff: diffLines.join(""),
      });
    }

    res.json({ files: filesWithDiffs });
  } catch (err) {
    console.error("Error getting PR diff:", err);
    res.status(500).json({ error: "Error getting PR diff", details: err.message });
  }
}

module.exports = { listRepos, createRepo, getCommits, getDiff, getRepoTree, getFileContent, getBranches, getPRDiff};
