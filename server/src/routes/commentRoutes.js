const express = require('express');
const router = express.Router();
const { createComment, getCommentsByCode } = require('../controllers/commentController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, createComment);
router.get('/:codeId', authMiddleware, getCommentsByCode);

module.exports = router;
