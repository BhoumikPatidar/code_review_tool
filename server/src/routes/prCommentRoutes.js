// server/src/routes/prCommentRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { createPRComment, getPRComments } = require('../controllers/prCommentController');

// Create a new PR comment
router.post('/', authMiddleware, createPRComment);

// Get all comments for a specific PR (pass prId as a URL parameter)
router.get('/:prId', authMiddleware, getPRComments);

module.exports = router;
