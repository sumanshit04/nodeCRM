'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { loginValidators } = require('../validators/authValidators');
const { handleValidation } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Try again later.' },
});

router.get('/csrf', authController.csrf);
router.post('/login', loginLimiter, loginValidators, handleValidation, authController.login);
router.post('/logout', requireAuth, authController.logout);
router.get('/me', requireAuth, authController.me);

module.exports = router;
