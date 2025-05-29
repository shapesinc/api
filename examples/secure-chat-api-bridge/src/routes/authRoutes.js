/**
 * Authentication Routes
 * 
 * This module defines routes for user authentication
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

// Public routes (no authentication required)
router.post('/register', authController.register);
router.post('/login', authController.login);

// MFA verification during login
router.post('/mfa/verify', authMiddleware.authenticate, authController.verifyMFA);

// Protected routes (authentication required)
router.post('/mfa/setup', authMiddleware.authenticate, authController.setupMFA);
router.post('/mfa/setup/verify', authMiddleware.authenticate, authController.verifyMFASetup);
router.post('/mfa/disable', authMiddleware.authenticate, authController.disableMFA);

// Test route to verify authentication
router.get('/me', authMiddleware.authenticate, (req, res) => {
  res.status(200).json({
    message: 'Authentication successful',
    user: req.user
  });
});

module.exports = router; 