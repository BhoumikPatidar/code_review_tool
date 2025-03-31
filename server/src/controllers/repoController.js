// server/src/controllers/repoController.js
const NodeGit = require("nodegit");
const path = require("path");
const fs = require("fs-extra"); // using fs-extra for convenience
const PullRequest = require("../models/PullRequest");

// Define the base directory where your repositories are located
const REPO_BASE_PATH = "/var/lib/git";

/**
 * List all repositories (directories) in REPO_BASE_PATH.
 */
async function listRepos(req, res) {
  try {
    const files = await fs.promises.readdir(REPO_BASE_PATH, { withFileTypes: true });
    const repos = files
      .filter(file => file.isDirectory())
      .map(dir => ({ name: dir.name }));
    res.json({ repositories: repos });
  } catch (err) {
    console.error("Error listing repositories:", err);
    res.status(500).json({ error: "Error listing repositories" });
  }
}

/**
 * Create a new repository.
 * Expects a JSON body with: { name: "myproject" } (the tool will append .git if missing)
 */
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
async function getCommits(req, res) {
  const repoName = req.params.repoName;
  const repoPath = path.join(REPO_BASE_PATH, repoName);

  try {
    const repo = await NodeGit.Repository.open(repoPath);
    let headCommit;

    // Try to get the HEAD commit.
    try {
      // headCommit = await repo.getHeadCommit();
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
    console.error("Error opening repository:", err);
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

module.exports = { listRepos, createRepo, getCommits, getDiff };
