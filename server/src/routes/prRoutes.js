
const express = require("express");
const router = express.Router();
const { 
  runStaticAnalysis, 
  createPR, 
  listPRs, 
  getPR, 
  approvePR, 
  mergePR,
  resolveConflicts  // Add this new import
} = require("../controllers/prController");
const authMiddleware = require("../middleware/authMiddleware");

// Create a new PR
router.post("/create", authMiddleware, createPR);

// Run static analysis for a PR
router.post("/:id/static-analysis", authMiddleware, runStaticAnalysis);

// List all PRs
router.get("/", authMiddleware, listPRs);

// Get a specific PR's details
router.get("/:id", authMiddleware, getPR);

// Approve a PR
router.post("/:id/approve", authMiddleware, approvePR);

// Merge a PR (only if approved)
router.post("/:id/merge", authMiddleware, mergePR);

// Resolve conflicts for a PR
router.post("/:id/resolve-conflicts", authMiddleware, resolveConflicts);  // Add this new route

module.exports = router;