const User = require('../models/User');
const Appointment = require('../models/Appointment');
const AppError = require('../utils/appError');

// @desc    Helper to filter allowed fields for updates
const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
};

// @desc    Get current logged-in user details
// @route   GET /api/patient/me
// @access  Private (Patient)
exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
};

// @desc    Update current logged-in user details
// @route   PATCH /api/patient/updateMe
// @access  Private (Patient)
exports.updateMe = async (req, res, next) => {
    try {
        // 1) Create error if user POSTs password data
        if (req.body.password || req.body.passwordConfirm) {
            return next(
                new AppError(
                    'This route is not for password updates. Please use /updateMyPassword.',
                    400
                )
            );
        }

        // 2) Filter out unwanted fields names that are not allowed to be updated
        const filteredBody = filterObj(req.body, 'username', 'email', 'phone', 'language');

        // 3) Update user document
        const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            status: 'success',
            data: {
                user: updatedUser
            }
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get all appointments for the current patient
// @route   GET /api/patient/my-appointments
// @access  Private (Patient)
exports.getMyAppointments = async (req, res, next) => {
    try {
        const appointments = await Appointment.find({ patientId: req.user.id })
            .populate({ path: 'doctorId', select: 'username' })
            .sort('-date');

        res.status(200).json({
            success: true,
            count: appointments.length,
            data: appointments
        });
    } catch (err) {
        next(err);
    }
};


// @desc    Create a new patient (by Management)
// @route   POST /api/enterprise/patients
// @access  Private (Management)
exports.createPatient = async (req, res) => {
    try {
        // 1. Force the role to 'patient' (Security)
        const { username, phone, password, language, email } = req.body;
        
        const newPatientData = {
            username,
            phone,
            email,
            password: password || '123456',
            language: language || 'en',
            role: 'patient'
        };

        // 2. Check if email/phone already exists
        // (Optional: Add a check here if your DB doesn't auto-throw)

        // 3. Create
        const newPatient = await User.create(newPatientData);

        // 4. Send Success
        res.status(201).json({
            status: 'success',
            data: { user: newPatient }
        });
    } catch (err) {
        console.error("Create Patient Error:", err); // Log the real error to console
        res.status(400).json({ // Return 400 (Bad Request) instead of 500 (Crash)
            status: 'fail',
            message: err.message || "Could not create patient. Check fields."
        });
    }
};

// @desc    Get a specific patient's history (by Doctor/Management)
// @route   GET /api/enterprise/patients/:id
// @access  Private (Doctor, Management)
exports.getPatientHistory = async (req, res, next) => {
    try {
        const patientId = req.params.id;

        const patient = await User.findById(patientId).select('-password');
        if (!patient || patient.role !== 'patient') {
            return next(new AppError('No patient found with that ID', 404));
        }

        const appointments = await Appointment.find({ patientId })
            .populate({ path: 'doctorId', select: 'username' })
            .sort('-date');
        
        res.status(200).json({
            success: true,
            data: {
                patient,
                history: appointments
            }
        });

    } catch (err) {
        next(err);
    }
};

// @desc    Search for patients by name or phone (by Doctor/Management)
// @route   GET /api/enterprise/patients/search
// @access  Private (Doctor, Management)
exports.searchPatients = async (req, res, next) => {
    try {
        const { query } = req.query;
        let filter = { role: 'patient' };

        // If a query is provided, add search conditions to the filter
        if (query && query.trim() !== '') {
            filter.$or = [
                { username: { $regex: query, $options: 'i' } },
                { phone: { $regex: query, $options: 'i' } }
            ];
        }

        const users = await User.find(filter).select('username phone _id email createdAt');

        res.status(200).json({
            success: true,
            count: users.length,
            // The frontend expects the array inside a 'users' property (or 'data' based on your generic handler)
            users: users,
            data: users // Sending both for compatibility
        });

    } catch (err) {
        next(err);
    }
};

// @desc    Get all doctors
// @route   GET /api/users/doctors
// @access  Private (Patient)
exports.getAllDoctors = async (req, res, next) => {
    try {
        const doctors = await User.find({ role: 'doctor' }).select('_id username clinicLocation');
        
        if (!doctors || doctors.length === 0) {
            return next(new AppError('No doctors found.', 404));
        }

        res.status(200).json({ 
            success: true,
            count: doctors.length,
            data: doctors 
        });
    } catch (err) {
        next(new AppError('Failed to fetch doctors.', 500));
    }
};

// ==========================================
// ✅ NEW FUNCTION: Get ALL Patients (Direct DB Fetch)
// ==========================================
// @desc    Get every user with role 'patient'
// @route   GET /api/enterprise/patients/all
// @access  Private (Doctor, Management)
exports.getAllPatients = async (req, res, next) => {
    try {
        // Fetch ALL users with role 'patient', sorted by newest first
        const patients = await User.find({ role: 'patient' })
            .select('username name phone email gender dob createdAt') // Select common fields
            .sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            count: patients.length,
            data: patients // Frontend will read this array
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Add medical history for a patient
// @route   POST /api/enterprise/patients/:id/history
// @access  Private (Doctor)
exports.addMedicalHistory = async (req, res, next) => {
    try {
        const patientId = req.params.id;
        const { medicalAdvice, prescription, requiredDocuments } = req.body;
        const doctorName = req.user.username || 'Doctor';

        const newHistoryItem = {
            date: new Date(),
            medicalAdvice,
            prescription,
            requiredDocuments,
            doctorId: req.user.id,
            doctorName
        };

        const updatedUser = await User.findByIdAndUpdate(
            patientId,
            { $push: { history: newHistoryItem } },
            { new: true, runValidators: true }
        ).select('+history');

        if (!updatedUser) {
            return next(new AppError('No patient found with that ID', 404));
        }

        res.status(200).json({
            status: 'success',
            data: {
                history: updatedUser.history
            }
        });
    } catch (err) {
        next(err);
    }
};