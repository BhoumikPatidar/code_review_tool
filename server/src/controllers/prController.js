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
 * Uses a temporary working clone of the bare repository,
 * checks out the target branch, and merges the source branch into the target branch.
 * Then pushes the merged changes back to the bare repository.
 */
exports.mergePR = async (req, res) => {
    try {
      console.log("mergePR: Starting merge for PR id:", req.params.id);
      const pr = await PullRequest.findByPk(req.params.id);
      if (!pr) {
        console.error("mergePR: PR not found");
        return res.status(404).json({ error: "Pull Request not found" });
      }
      if (pr.status !== "approved") {
        console.error("mergePR: PR not approved");
        return res.status(400).json({ error: "PR must be approved before merging" });
      }
      
      const bareRepoPath = path.join(REPO_BASE_PATH, pr.repository);
      console.log("mergePR: Bare repo path:", bareRepoPath);
      
      // Create a temporary directory for a working clone
      const tempDir = path.join(os.tmpdir(), `repo-merge-temp-${Date.now()}`);
      console.log("mergePR: Creating temporary directory:", tempDir);
      
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
      console.log("mergePR: Cloning repository from", bareRepoPath, "to", tempDir);
      const repo = await NodeGit.Clone(bareRepoPath, tempDir, cloneOptions);
      console.log("mergePR: Clone completed.");
      
      // Ensure we're on the target branch
      console.log("mergePR: Checking out target branch:", pr.targetBranch);
      await repo.checkoutBranch(pr.targetBranch);
      console.log("mergePR: Target branch checked out.");
      
      // Fetch latest changes from remote
      console.log("mergePR: Fetching all updates from remote...");
      await repo.fetchAll({
        callbacks: {
          certificateCheck: () => 0
        }
      });
      console.log("mergePR: Fetch complete.");
      
      // Ensure source branch is available locally
      console.log("mergePR: Attempting to checkout source branch:", pr.sourceBranch);
      try {
        await repo.checkoutBranch(pr.sourceBranch);
        console.log("mergePR: Source branch checked out.");
      } catch (err) {
        console.warn("mergePR: Source branch not found locally, attempting to create from remote...");
        try {
          const remoteRef = await repo.getReference(`refs/remotes/origin/${pr.sourceBranch}`);
          console.log("mergePR: Remote reference for source branch:", remoteRef.name());
          const remoteCommit = await repo.getCommit(remoteRef.target());
          console.log("mergePR: Remote commit for source branch:", remoteCommit.id().toString());
          await repo.createBranch(pr.sourceBranch, remoteCommit, false);
          await repo.checkoutBranch(pr.sourceBranch);
          console.log("mergePR: Source branch created and checked out.");
        } catch (innerErr) {
          console.error("mergePR: Failed to create source branch from remote:", innerErr);
          throw innerErr;
        }
      }
      
      // Get the commit from the source branch to merge
      console.log("mergePR: Getting commit from source branch:", pr.sourceBranch);
      const sourceCommit = await repo.getBranchCommit(pr.sourceBranch);
      console.log("mergePR: Source Commit OID:", sourceCommit.id().toString());
      
      // Checkout target branch again before merge
      console.log("mergePR: Re-checking out target branch:", pr.targetBranch);
      await repo.checkoutBranch(pr.targetBranch);
      console.log("mergePR: Target branch re-checked out.");
      
      // Perform the merge (using a forced strategy for simplicity)
      console.log("mergePR: Starting merge operation...");
      await NodeGit.Merge.merge(repo, sourceCommit, null, {
        checkoutStrategy: NodeGit.Checkout.STRATEGY.FORCE,
      });
      console.log("mergePR: Merge operation completed.");
      
      // Push the updated target branch back to the bare repository
      const remote = await repo.getRemote("origin");
      console.log("mergePR: Pushing merged target branch back to remote...");
      await remote.push(
        [`refs/heads/${pr.targetBranch}:refs/heads/${pr.targetBranch}`],
        {
          callbacks: {
            certificateCheck: () => 0,
          },
        }
      );
      console.log("mergePR: Push operation completed.");
      
      // Mark the PR as merged in the database
      console.log("mergePR: Updating PR status to merged...");
      pr.status = "merged";
      await pr.save();
      console.log("mergePR: PR status updated to merged.");
      
      // Clean up the temporary directory
      console.log("mergePR: Cleaning up temporary directory:", tempDir);
      await fs.remove(tempDir);
      console.log("mergePR: Temporary directory cleaned up.");
      
      res.json(pr);
    } catch (error) {
      console.error("mergePR: Error during merge process:", error);
      res.status(500).json({ error: error.message });
    }
  };