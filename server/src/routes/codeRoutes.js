const express = require('express');
const router = express.Router();
const { createCode, getCodes } = require('../controllers/codeController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, createCode);
router.get('/', authMiddleware, getCodes);

module.exports = router;
