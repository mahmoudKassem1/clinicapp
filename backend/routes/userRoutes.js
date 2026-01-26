const express = require('express');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');

const router = express.Router();

// Existing auth routes
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// New route to get all doctors
router.get(
    '/doctors', 
    authController.protect, // Ensure user is logged in
    userController.getAllDoctors
);

module.exports = router;
