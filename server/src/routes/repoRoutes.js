// server/src/routes/repoRoutes.js
const express = require("express");
const router = express.Router();
const { 
  listRepos, 
  createRepo,
  getRepository, 
  getCommits, 
  getDiff,
  getRepoTree,
  getFileContent,
  getBranches,
  managePermissions,
  getCollaborators
} = require("../controllers/repositoryController");
const authMiddleware = require("../middleware/authMiddleware");

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Repository listing and creation
router.get("/", listRepos);
router.post("/create", createRepo);

// Repository details
router.get("/:repoId", getRepository);

// Repository collaborators management
router.get("/:repoId/collaborators", getCollaborators);
router.post("/:repoId/permissions", managePermissions);

// Git operations
router.get("/:repoName/commits", getCommits);
router.get("/:repoName/branches", getBranches);
router.get("/:repoName/tree", getRepoTree);
router.get("/:repoName/file", getFileContent);
router.get("/:repoName/diff", getDiff);

module.exports = router;