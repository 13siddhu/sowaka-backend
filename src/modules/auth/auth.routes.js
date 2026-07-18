const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { authenticate } = require('../../middleware/auth');

router.post('/login', authController.login);
router.post('/signup', authController.signup);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authenticate, authController.logout);
// Password Reset would go here, maybe omitted for brevity or simple implementation
// router.post('/reset-password', authController.resetPassword);

module.exports = router;
