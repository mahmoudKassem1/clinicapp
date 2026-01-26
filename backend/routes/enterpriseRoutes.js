const express = require('express');
const router = express.Router();
const { enterpriseSignup, login, protect, restrictTo } = require('../controllers/authController');
const { getDoctorStats } = require('../controllers/financeController');

// ✅ UPDATE: Import addMedicalHistory here
const { 
  createPatient, 
  getPatientHistory, 
  searchPatients, 
  getAllPatients,
  addMedicalHistory // <--- NEW IMPORT
} = require('../controllers/userController');

// --- Auth Routes ---
router.post('/signup', enterpriseSignup);
router.post('/login', login);

// --- Finance Routes ---
router.get('/finance-stats', protect, restrictTo('doctor', 'management'), getDoctorStats);

// --- Patient Management Routes ---

// 1. STATIC ROUTES
router.get('/patients/all', protect, restrictTo('doctor', 'management'), getAllPatients);
router.get('/patients/search', protect, restrictTo('doctor', 'management'), searchPatients);

// 2. CREATE ROUTE
router.post('/patients', protect, restrictTo('management', 'doctor'), createPatient);

// 3. ✅ NEW ROUTE: Add Medical History (Consultation)
// This must be a POST request to save data
router.post(
  '/patients/:id/history', 
  protect, 
  restrictTo('doctor'), 
  addMedicalHistory
);

// 4. DYNAMIC ROUTES LAST
router.get('/patients/:id', protect, restrictTo('doctor', 'management'), getPatientHistory);

module.exports = router;