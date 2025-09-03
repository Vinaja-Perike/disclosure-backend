const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password/send-otp', authController.sendOTP);
router.post('/send-otp-registration', authController.sendOTPRegistration);
router.post('/verify-otp-registration', authController.verifyOTPForRegistration);
router.post('/forgot-password/verify-otp', authController.verifyOTP);
router.post('/forgot-password/reset', authController.resetPassword);
router.post('/check-mobile', authController.checkMobile);

module.exports = router;
