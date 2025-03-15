// server/src/controllers/prController.js
const NodeGit = require("nodegit");
const path = require("path");
const PullRequest = require("../models/PullRequest");

// Base directory where repositories are stored
const REPO_BASE_PATH = "/var/lib/git";

/**
 * Create a new Pull Request.
 * Expected body: { repository, sourceBranch, targetBranch, title, description }
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
 * Marks the PR as 'approved'.
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
 * Uses NodeGit to merge the source branch into the target branch.
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
    const repoPath = path.join(REPO_BASE_PATH, pr.repository);
    const repo = await NodeGit.Repository.open(repoPath);

    // Checkout the target branch (force checkout for simplicity)
    await repo.checkoutBranch(pr.targetBranch);
    // Get the commit pointed to by the source branch
    const sourceCommit = await repo.getBranchCommit(pr.sourceBranch);
    // Perform a simplified merge of the source commit into the target branch.
    // (Note: This example uses a forced merge strategy; real-world scenarios require more robust conflict handling.)
    await NodeGit.Merge.merge(repo, sourceCommit, null, {
      checkoutStrategy: NodeGit.Checkout.STRATEGY.FORCE,
    });

    // Mark the PR as merged
    pr.status = "merged";
    await pr.save();
    res.json(pr);
  } catch (error) {
    console.error("Error merging PR:", error);
    res.status(500).json({ error: error.message });
  }
};
