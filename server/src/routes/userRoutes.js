// server/src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { updateSshKey } = require('../controllers/userController');

// POST /api/user/sshkey – updates the user's SSH public key
router.post('/sshkey', authMiddleware, updateSshKey);

module.exports = router;
