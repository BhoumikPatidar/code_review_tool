// server/src/routes/repoRoutes.js
const express = require("express");
const router = express.Router();
const { listRepos, getCommits, getDiff, createRepo, getRepoTree, getFileContent } = require("../controllers/repoController");
const authMiddleware = require("../middleware/authMiddleware");

// Endpoint to list all repositories
router.get("/", listRepos);

// Endpoint to create a new repository
router.post("/create", authMiddleware, createRepo);

// Endpoint to get commit history for a specific repository
router.get("/:repoName/commits", getCommits);

// Endpoint to get diff for a specific commit in a repository
router.get("/:repoName/diff/:commitSha", getDiff);

router.get("/:repoName/tree", getRepoTree);     // GET /repos/:repoName/tree?path={optional}
router.get("/:repoName/file", getFileContent);    // GET /repos/:repoName/file?path={filePath}


module.exports = router;
