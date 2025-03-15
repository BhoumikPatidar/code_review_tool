// server/src/routes/repoRoutes.js
const express = require("express");
const router = express.Router();
const { listRepos, getCommits, getDiff } = require("../controllers/repoController");

// Endpoint to list all repositories
router.get("/", listRepos);

// Endpoint to get commit history for a specific repository
router.get("/:repoName/commits", getCommits);

// Endpoint to get diff for a specific commit in a repository
router.get("/:repoName/diff/:commitSha", getDiff);

module.exports = router;
