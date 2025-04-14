// server/src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { updateSshKey, getUserProfile, searchUsers } = require('../controllers/userController');

// All routes require authentication
router.use(authMiddleware);

// GET /api/user/profile – get current user's profile
router.get('/profile', getUserProfile);

// POST /api/user/sshkey – updates the user's SSH public key
router.post('/sshkey', updateSshKey);

// GET /api/user/search – search users by username
router.get('/search', searchUsers);

module.exports = router;