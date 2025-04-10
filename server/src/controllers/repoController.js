// server/src/controllers/repoController.js
const NodeGit = require("nodegit");
const path = require("path");
const fs = require('fs');
const os = require('os');
const PullRequest = require("../models/PullRequest");

// Define the base directory where your repositories are located
const REPO_BASE_PATH = "/var/lib/git";

/**
 * List all repositories (directories) in REPO_BASE_PATH.
 */
async function listRepos(req, res) {
  try {
    console.log("Checking directory:", REPO_BASE_PATH);

    // First check if directory exists
    if (!fs.existsSync(REPO_BASE_PATH)) {
      console.log("Creating base directory");
      fs.mkdirSync(REPO_BASE_PATH, { recursive: true });
    }

    // Read directory synchronously
    const files = fs.readdirSync(REPO_BASE_PATH);
    const repos = [];

    // Process each file synchronously
    for (const file of files) {
      const fullPath = path.join(REPO_BASE_PATH, file);
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        repos.push({ name: file });
      }
    }

    console.log("Found repositories:", repos);
    res.json({ repositories: repos });

  } catch (err) {
    console.error("Error in listRepos:", err);
    res.status(500).json({ 
      error: "Error listing repositories",
      details: err.message 
    });
  }
}
/**
 * Create a new repository.
 * Expects a JSON body with: { name: "myproject" } (the tool will append .git if missing)
 */
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


async function getBranches(req, res) {
  const repoName = req.params.repoName;
  try {
    const actualRepoName = repoName.endsWith('.git') ? repoName : `${repoName}.git`;
    const repoPath = path.join(REPO_BASE_PATH, actualRepoName);
    const repo = await NodeGit.Repository.open(repoPath);
    
    // Get all references with proper callback handling
    const references = await new Promise((resolve, reject) => {
      repo.getReferences(NodeGit.Reference.TYPE.ALL, (error, arrayOfRefs) => {
        if (error) reject(error);
        else resolve(arrayOfRefs);
      });
    });

    // Process only local branches
    const branches = [];
    for (const ref of references) {
      if (ref.isBranch() && ref.isLocal()) {
        try {
          branches.push({
            name: ref.shorthand(),
            isHead: ref.isHead(),
            target: ref.target().toString()
          });
        } catch (err) {
          console.warn(`Skipping branch ${ref.name()}: ${err.message}`);
        }
      }
    }

    console.log("Found branches:", branches);
    res.json({ branches });
  } catch(err) {
    console.error("Error getting branches:", err);
    res.status(500).json({ 
      error: "Error getting branches",
      details: err.message 
    });
  }
}

async function createRepo(req, res) {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Repository name is required" });
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
    // Create a bare repository (isBare = 1)
    const repo = await NodeGit.Repository.init(newRepoPath, 1);
    console.log("Repository created at:", repo.path());
    res.json({ message: "Repository created successfully", repository: repoName });
  } catch (error) {
    console.error("Error creating repository:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get the commit history for a specified repository.
 * Expects the repository name in req.params.repoName.
 */
// async function getCommits(req, res) {
//   const repoName = req.params.repoName;
//   const repoPath = path.join(REPO_BASE_PATH, repoName);

//   try {
//     const repo = await NodeGit.Repository.open(repoPath);
//     let headCommit;

//     // Try to get the HEAD commit.
//     try {
//       // headCommit = await repo.getHeadCommit();
//       const branchName = (await repo.getCurrentBranch()).shorthand();
//       headCommit = await repo.getBranchCommit(branchName);
//     } catch (e) {
//       console.warn("getHeadCommit failed:", e.message);
//       headCommit = null;
//     }

//     // If no HEAD, try to get the commit from the 'main' branch.
//     if (!headCommit) {
//       try {
//         headCommit = await repo.getBranchCommit('main');
//       } catch (e) {
//         console.warn("getBranchCommit('main') failed:", e.message);
//         return res.json({ commits: [] });
//       }
//     }

//     let commits = [];
//     const history = headCommit.history();

//     history.on("commit", commit => {
//       commits.push({
//         sha: commit.sha(),
//         message: commit.message().trim(),
//         author: commit.author().name(),
//         date: commit.date()
//       });
//     });

//     history.on("end", () => {
//       res.json({ commits });
//     });

//     history.on("error", err => {
//       console.error("Error reading commit history:", err);
//       res.status(500).json({ error: "Error reading commit history" });
//     });

//     history.start();
//   } catch (err) {
//     console.error("Error opening repository:", err);
//     res.status(500).json({ error: "Error opening repository" });
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
        headCommit = await repo.getBranchCommit('main');
      } catch (e) {
        console.warn("getBranchCommit('main') failed:", e.message);
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

/**
 * Get the diff for a specific commit.
 * Expects repository name in req.params.repoName and commit SHA in req.params.commitSha.
 */
async function getDiff(req, res) {
  const repoName = req.params.repoName;
  const commitSha = req.params.commitSha;
  const repoPath = path.join(REPO_BASE_PATH, repoName);

  try {
    const repo = await NodeGit.Repository.open(repoPath);
    const commit = await repo.getCommit(commitSha);
    let diffs = [];

    // If the commit has a parent, diff against it.
    if (commit.parentcount() > 0) {
      const parent = await commit.parent(0);
      const diffList = await NodeGit.Diff.treeToTree(
        repo,
        await parent.getTree(),
        await commit.getTree()
      );
      const patches = await diffList.patches();
      patches.forEach(patch => {
        diffs.push({
          file: patch.newFile().path(),
          status: patch.status(), // status can indicate if a file was modified, added, etc.
          additions: patch.lineStats().total_additions,
          deletions: patch.lineStats().total_deletions
        });
      });
    } else {
      // For an initial commit, diff against an empty tree.
      const diffList = await NodeGit.Diff.treeToTree(
        repo,
        null,
        await commit.getTree()
      );
      const patches = await diffList.patches();
      patches.forEach(patch => {
        diffs.push({
          file: patch.newFile().path(),
          status: patch.status(),
          additions: patch.lineStats().total_additions,
          deletions: patch.lineStats().total_deletions
        });
      });
    }

    res.json({ diffs });
  } catch (err) {
    console.error("Error getting diff:", err);
    res.status(500).json({ error: "Error getting diff" });
  }
}

async function getRepoTree(req, res) {
  const repoName = req.params.repoName;
  const queryPath = req.query.path || '';
  const branch = req.query.branch || 'main';

  try {
    const actualRepoName = repoName.endsWith('.git') ? repoName : `${repoName}.git`;
    const repoPath = path.join(REPO_BASE_PATH, actualRepoName);
    console.log("Opening repository at:", repoPath);
    
    const repo = await NodeGit.Repository.open(repoPath);
    let headCommit;

    // Try to get the specified branch, fallback to available branches if it fails
    try {
      headCommit = await repo.getBranchCommit(branch);
    } catch (e) {
      console.log("Failed to get specified branch:", branch);
      // Try to get current branch
      try {
        const currentBranch = await repo.getCurrentBranch();
        headCommit = await repo.getBranchCommit(currentBranch.shorthand());
      } catch (e) {
        console.log("Failed to get current branch, trying main/master");
        // Try main or master
        try {
          headCommit = await repo.getBranchCommit('main');
        } catch (e) {
          try {
            headCommit = await repo.getBranchCommit('master');
          } catch (e) {
            return res.status(404).json({ error: "No valid branch found" });
          }
        }
      }
    }

    const tree = await headCommit.getTree();
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
    for (const entry of targetTree.entries()) {
      entries.push({
        name: entry.name(),
        type: entry.isBlob() ? 'file' : 'directory',
        sha: entry.sha()
      });
    }

    res.json({ 
      path: queryPath, 
      entries,
      currentBranch: branch 
    });

  } catch(err) {
    console.error("Error getting repository tree:", err);
    res.status(500).json({ 
      error: "Error getting repository tree",
      details: err.message 
    });
  }
}

async function getFileContent(req, res) {
  const repoName = req.params.repoName;
  const filePath = req.query.path;
  const branch = req.query.branch || 'main';

  if (!filePath) {
    return res.status(400).json({ error: "File path is required" });
  }

  try {
    const actualRepoName = repoName.endsWith('.git') ? repoName : `${repoName}.git`;
    const repoPath = path.join(REPO_BASE_PATH, actualRepoName);
    const repo = await NodeGit.Repository.open(repoPath);

    // Get the current branch's head commit
    // let headCommit;
    // try {
    //   const branchName = (await repo.getCurrentBranch()).shorthand();
    //   headCommit = await repo.getBranchCommit(branchName);
    // } catch (e) {
    //   headCommit = await repo.getBranchCommit('main');
    // }
    const headCommit = await repo.getBranchCommit(branch);

    const tree = await headCommit.getTree();
    const entry = await tree.getEntry(filePath);

    if (!entry.isBlob()) {
      return res.status(400).json({ error: "The provided path is not a file" });
    }

    const blob = await entry.getBlob();
    res.json({ 
      path: filePath,
      content: blob.toString(),
      size: blob.rawsize()
    });

  } catch(err) {
    console.error("Error getting file content:", err);
    res.status(500).json({ 
      error: "Error getting file content",
      details: err.message 
    });
  }
}

module.exports = { listRepos, createRepo, getCommits, getDiff, getRepoTree, getFileContent, getBranches };
