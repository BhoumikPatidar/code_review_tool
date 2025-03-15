// server/src/controllers/prController.js
const NodeGit = require("nodegit");
const path = require("path");
const os = require("os");
const fs = require("fs-extra"); // Using fs-extra for convenient directory removal
const PullRequest = require("../models/PullRequest");

// Base directory where your bare repositories are stored
const REPO_BASE_PATH = "/var/lib/git";

/**
 * Create a new Pull Request.
 * Expects a request body with: repository, sourceBranch, targetBranch, title, description.
 */
exports.createPR = async (req, res) => {
  try {
    const { repository, sourceBranch, targetBranch, title, description } = req.body;
    const pr = await PullRequest.create({
      repository,
      sourceBranch,
      targetBranch,
      title,
      description,
      creatorId: req.user.id,
    });
    res.json(pr);
  } catch (error) {
    console.error("Error creating PR:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * List all Pull Requests.
 */
exports.listPRs = async (req, res) => {
  try {
    const prs = await PullRequest.findAll();
    res.json(prs);
  } catch (error) {
    console.error("Error listing PRs:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get details of a specific Pull Request.
 */
exports.getPR = async (req, res) => {
  try {
    const pr = await PullRequest.findByPk(req.params.id);
    if (!pr) {
      return res.status(404).json({ error: "Pull Request not found" });
    }
    res.json(pr);
  } catch (error) {
    console.error("Error fetching PR:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Approve a Pull Request.
 * This marks the PR as "approved" in the database.
 */
exports.approvePR = async (req, res) => {
  try {
    const pr = await PullRequest.findByPk(req.params.id);
    if (!pr) {
      return res.status(404).json({ error: "Pull Request not found" });
    }
    pr.status = "approved";
    await pr.save();
    res.json(pr);
  } catch (error) {
    console.error("Error approving PR:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Merge an approved Pull Request.
 * Since bare repositories do not support checkout operations, this method:
 *   1. Clones the bare repository into a temporary working directory.
 *   2. Checks out the target branch.
 *   3. Merges the source branch into the target branch.
 *   4. Pushes the merged changes back to the bare repository.
 *   5. Cleans up the temporary directory.
 */
exports.mergePR = async (req, res) => {
  try {
    const pr = await PullRequest.findByPk(req.params.id);
    if (!pr) {
      return res.status(404).json({ error: "Pull Request not found" });
    }
    if (pr.status !== "approved") {
      return res.status(400).json({ error: "PR must be approved before merging" });
    }
    
    const bareRepoPath = path.join(REPO_BASE_PATH, pr.repository);
    // Create a temporary directory for a working clone
    const tempDir = path.join(os.tmpdir(), `repo-merge-temp-${Date.now()}`);
    
    // Clone the bare repository into a working (non-bare) clone
    const cloneOptions = {
      bare: 0,
      checkoutBranch: pr.targetBranch,
      fetchOpts: {
        callbacks: {
          certificateCheck: () => 0
        }
      }
    };
    const repo = await NodeGit.Clone(bareRepoPath, tempDir, cloneOptions);
    
    // Ensure we're on the target branch
    await repo.checkoutBranch(pr.targetBranch);
    
    // Fetch latest changes and ensure the source branch is available locally
    await repo.fetchAll({
      callbacks: {
        certificateCheck: () => 0
      }
    });
    try {
      await repo.checkoutBranch(pr.sourceBranch);
    } catch (err) {
      // If the source branch doesn't exist locally, create it tracking the remote branch
      await repo.createBranch(pr.sourceBranch, `origin/${pr.sourceBranch}`, false);
      await repo.checkoutBranch(pr.sourceBranch);
    }
    
    // Get the commit from the source branch to merge
    const sourceCommit = await repo.getBranchCommit(pr.sourceBranch);
    
    // Checkout the target branch again before merging
    await repo.checkoutBranch(pr.targetBranch);
    
    // Perform the merge (using a forced strategy for simplicity)
    await NodeGit.Merge.merge(repo, sourceCommit, null, {
      checkoutStrategy: NodeGit.Checkout.STRATEGY.FORCE,
    });
    
    // Push the updated target branch back to the bare repository
    const remote = await repo.getRemote("origin");
    await remote.push(
      [`refs/heads/${pr.targetBranch}:refs/heads/${pr.targetBranch}`],
      {
        callbacks: {
          certificateCheck: () => 0,
        },
      }
    );
    
    // Update the PR status to merged
    pr.status = "merged";
    await pr.save();
    
    // Clean up the temporary clone
    await fs.remove(tempDir);
    
    res.json(pr);
  } catch (error) {
    console.error("Error merging PR:", error);
    res.status(500).json({ error: error.message });
  }
};
