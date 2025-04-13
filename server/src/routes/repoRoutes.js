const express = require("express");
const router = express.Router();
const { 
  listRepos, 
  createRepo, 
  getCommits, 
  getDiff,
  getPRDiff,
  getRepoTree,
  getFileContent,
  getBranches
} = require("../controllers/repoController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/:repoName/branches", getBranches);
router.get("/:repoName/pr-diff", getPRDiff); // New endpoint for PR diffs
router.get("/:repoName/diff", getDiff); // Existing endpoint for Repository Management
// Endpoint to list all repositories
router.get("/", listRepos);

// Endpoint to create a new repository
router.post("/create", authMiddleware, createRepo);

// Endpoint to get commit history for a specific repository
router.get("/:repoName/commits", getCommits);

// // Endpoint to get diff for a specific commit in a repository
// router.get("/:repoName/diff/:commitSha", getDiff);

// Endpoint to get repository tree
router.get("/:repoName/tree", getRepoTree);

// Endpoint to get file content
router.get("/:repoName/file", getFileContent);


module.exports = router;