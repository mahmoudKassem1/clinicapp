const express = require('express');
const {
    getAvailableSlots,
    createAppointment,
    getAllAppointments,
    getDoctorAppointments, // This is for Daily (Dashboard)
    getDoctorSchedule,     // ✅ NEW IMPORT: This is for All Appointments (Tab)
    getMyAppointments,
    updateAppointment,
    getAppointment
} = require('../controllers/appointmentController');

const router = express.Router();

const { protect, restrictTo } = require('../controllers/authController');

// 1. Public/Open Routes
router.get('/available-slots', getAvailableSlots);

// 2. Protected Routes
router
    .route('/')
    .post(protect, restrictTo('patient', 'management'), createAppointment);

router
    .route('/all')
    .get(protect, restrictTo('management', 'doctor'), getAllAppointments);

// --- DOCTOR ROUTES ---

// Route 1: Dashboard (Today's appointments)
router
    .route('/doctor-daily')
    .get(protect, restrictTo('doctor'), getDoctorAppointments);

// Route 2: ✅ NEW ROUTE (Fixes the 500 Error)
// MUST be placed BEFORE '/:id'
router
    .route('/doctor-schedule')
    .get(protect, restrictTo('doctor'), getDoctorSchedule);

// --- PATIENT ROUTES ---
router
    .route('/my-appointments')
    .get(protect, restrictTo('patient'), getMyAppointments);

// --- DYNAMIC ID ROUTES (Always Last) ---
router
    .route('/:id')
    .get(protect, getAppointment)
    .patch(protect, restrictTo('doctor', 'management'), updateAppointment);

module.exports = router;