const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

// Public routes
router.post('/signup', authController.signup);
router.post('/verify-signup', authController.verifySignupOTP);
router.post('/login', authController.login);
router.post('/forget-password', authController.forgetPassword);
router.post('/reset-password', authController.resetPassword);

// Protected routes (requires authentication middleware)
router.get('/me', authMiddleware, authController.getCurrentUser);
router.put('/update-profile', authMiddleware, authController.updateProfile);

module.exports = router;
