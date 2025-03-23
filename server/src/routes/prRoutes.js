// // server/src/routes/prRoutes.js
// const express = require("express");
// const router = express.Router();
// const authMiddleware = require("../middleware/authMiddleware");
// const prController = require("../controllers/prController");

// // Create a new PR
// router.post("/create", authMiddleware, prController.createPR);
// // List all PRs
// router.get("/", authMiddleware, prController.listPRs);
// // Get a specific PR's details
// router.get("/:id", authMiddleware, prController.getPR);
// // Approve a PR
// router.post("/:id/approve", authMiddleware, prController.approvePR);
// // Merge a PR (only if approved)
// router.post("/:id/merge", authMiddleware, prController.mergePR);

// module.exports = router;
// const express = require('express');
// const { runStaticAnalysis, getStaticAnalysisReports } = require('../controllers/prController');
// const authMiddleware = require('../middleware/authMiddleware');

// router.post('/:prId/static-analysis', authMiddleware, runStaticAnalysis);
// router.get('/:prId/static-analysis', authMiddleware, getStaticAnalysisReports);

// module.exports = router;



// server/src/routes/prRoutes.js
// server/src/routes/prRoutes.js
const express = require("express");
const router = express.Router();
const { runStaticAnalysis, createPR, listPRs, getPR, approvePR, mergePR } = require("../controllers/prController");
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

module.exports = router;
