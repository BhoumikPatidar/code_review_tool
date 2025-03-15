// server/src/routes/prRoutes.js
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const prController = require("../controllers/prController");

// Create a new PR
router.post("/create", authMiddleware, prController.createPR);
// List all PRs
router.get("/", authMiddleware, prController.listPRs);
// Get a specific PR's details
router.get("/:id", authMiddleware, prController.getPR);
// Approve a PR
router.post("/:id/approve", authMiddleware, prController.approvePR);
// Merge a PR (only if approved)
router.post("/:id/merge", authMiddleware, prController.mergePR);

module.exports = router;
