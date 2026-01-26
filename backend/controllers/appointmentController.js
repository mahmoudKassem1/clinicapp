const Appointment = require('../models/Appointment');
const User = require('../models/User');
const AppError = require('../utils/appError');

// @desc    Get Available Slots for a given date and clinic
// @route   GET /api/appointments/available-slots
// @access  Public
exports.getAvailableSlots = async (req, res, next) => {
    try {
        const { date, clinicName } = req.query;
        if (!date || !clinicName) {
            throw new Error("Missing date or clinicName from query parameters.");
        }
        
        const targetDate = new Date(date);
        if (isNaN(targetDate)) {
            throw new Error(`Invalid date format received: ${date}`);
        }

        const dayOfWeek = targetDate.getDay(); // Sunday is 0, Saturday is 6

        const clinicSchedules = {
            "Janaklees Clinic": { days: [6, 1, 3], startTime: 18, endTime: 22 },
            "Mahatet al Raml Clinic": { days: [6, 2], startTime: 13, endTime: 14 }
        };
        
        const decodedClinicName = decodeURIComponent(clinicName);
        const schedule = clinicSchedules[decodedClinicName];

        if (!schedule) {
            return res.status(200).json({ success: true, message: 'No schedule found for this clinic.', data: [] });
        }

        if (!schedule.days.includes(dayOfWeek)) {
            return res.status(200).json({ success: true, message: 'The clinic is closed on this day.', data: [] });
        }

        const slots = [];
        for (let hour = schedule.startTime; hour < schedule.endTime; hour++) {
            slots.push({ time: `${String(hour).padStart(2, '0')}:00`, available: true });
            slots.push({ time: `${String(hour).padStart(2, '0')}:30`, available: true });
        }

        const startOfDay = new Date(date);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setUTCHours(23, 59, 59, 999);

        const existingAppointments = await Appointment.find({
            clinicLocation: decodedClinicName,
            date: { $gte: startOfDay, $lt: endOfDay }
        });

        const bookedTimes = new Set(existingAppointments.map(apt => {
            const aptDate = new Date(apt.date);
            return `${String(aptDate.getHours()).padStart(2, '0')}:${String(aptDate.getMinutes()).padStart(2, '0')}`;
        }));
        
        const availableSlots = slots.map(slot => ({
            ...slot,
            available: !bookedTimes.has(slot.time)
        }));

        res.status(200).json({ success: true, data: availableSlots });

    } catch (error) {
        console.error("SLOT ERROR:", error);
        res.status(500).json({ 
            success: false, 
            message: "An internal server error occurred.",
            error: error.message
        });
    }
};

// @desc    Create a new appointment
// @route   POST /api/appointments
// @access  Private (Patient)
exports.createAppointment = async (req, res, next) => {
    try {
        const { doctorId, date, type, clinicLocation } = req.body;

        if (!doctorId || !date || !type || !clinicLocation) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide a doctor, appointment date, appointment type, and clinic location.' 
            });
        }
        
        const patientId = req.user.id;
        const appointmentDate = new Date(date);
        
        if (isNaN(appointmentDate.getTime())) {
            return res.status(400).json({ success: false, message: 'Invalid date format.' });
        }
        
        if (appointmentDate < new Date()) {
            return res.status(400).json({ success: false, message: 'Cannot book an appointment in the past.' });
        }

        const existingAppointment = await Appointment.findOne({ doctorId, date: appointmentDate, clinicLocation });
        if (existingAppointment) {
            return res.status(400).json({
                success: false,
                message: 'The selected doctor is already booked at this time.'
            });
        }

        const price = 500; 

        const newAppointment = await Appointment.create({
            patientId,
            doctorId,
            date: appointmentDate,
            type,
            price,
            clinicLocation,
            createdBy: req.user.id,
            status: 'upcoming'
        });

        res.status(201).json({ success: true, data: newAppointment });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message || 'Server Error' });
    }
};

// @desc    Update an appointment's status, price, or medical record
// @route   PATCH /api/appointments/:id
// @access  Private (Doctor, Management)
exports.updateAppointment = async (req, res, next) => {
    try {
        const { status, price, medicalRecord, adminNote } = req.body;
        
        let appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return next(new AppError('No appointment found with that ID', 404));
        }

        if (req.user.role === 'doctor' && appointment.doctorId.toString() !== req.user.id) {
            return next(new AppError('You are not authorized to update this appointment', 403));
        }

        const updates = {};
        if (status) updates.status = status;
        if (medicalRecord) updates.medicalRecord = medicalRecord;
        if (adminNote) updates.adminNote = adminNote;

        if (price !== undefined) {
            if (req.user.role === 'doctor' || req.user.role === 'management') {
                updates.price = price;
            } else {
                return next(new AppError('You are not authorized to update the price', 403));
            }
        }

        const updatedAppointment = await Appointment.findByIdAndUpdate(req.params.id, updates, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: updatedAppointment });
    } catch (err) {
        next(err);
    }
};

// @desc    Get a single appointment
// @route   GET /api/appointments/:id
// @access  Private
exports.getAppointment = async (req, res, next) => {
    try {
        const appointment = await Appointment.findById(req.params.id)
            .populate('doctorId', 'username')
            .populate('patientId', 'username dateOfBirth');

        if (!appointment) {
            return next(new AppError('No appointment found with that ID', 404));
        }
        
        const responseData = {
            ...appointment.toObject(),
            clinicLocation: "Smouha, Alexandria, Egypt",
            clinicPhone: "+20 123 456 7890"
        };

        res.status(200).json({ success: true, data: responseData });

    } catch (err) {
        next(new AppError('Error fetching appointment details', 500));
    }
};

// @desc    Get all appointments (Management)
// @route   GET /api/appointments/all
// @access  Private (Management)
exports.getAllAppointments = async (req, res, next) => {
    try {
        const appointments = await Appointment.find()
            .populate('patientId', 'username phone')
            .populate('doctorId', 'username');
        res.status(200).json({ success: true, count: appointments.length, data: appointments });
    } catch (err) {
        next(err);
    }
};

// @desc    Get a doctor's DAILY appointments (Filtered by Date)
// @route   GET /api/appointments/doctor-daily
// @access  Private (Doctor)
exports.getDoctorAppointments = async (req, res, next) => {
    try {
        const { date, status } = req.query;
        const query = { doctorId: req.user.id };

        let targetDate = new Date();
        if (date) {
            const parsedDate = new Date(date);
            if (!isNaN(parsedDate.getTime())) targetDate = parsedDate;
        }

        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);
        query.date = { $gte: startOfDay, $lt: endOfDay };

        if (status && status !== 'all') {
            query.status = status;
        }

        const appointments = await Appointment.find(query).populate('patientId', 'username phone');
        
        res.status(200).json({ success: true, data: appointments });
    } catch (err) {
        next(err);
    }
};

// ==========================================
// ✅ NEW FUNCTION ADDED (Fixes the 500 Error)
// ==========================================
// @desc    Get ALL appointments for a doctor (For Appointments Tab)
// @route   GET /api/appointments/doctor-schedule
// @access  Private (Doctor)
exports.getDoctorSchedule = async (req, res, next) => {
    try {
        // Fetch ALL appointments for this doctor (Sorted by date)
        const appointments = await Appointment.find({ doctorId: req.user.id })
            .populate('patientId', 'username name phone email') // Get patient details
            .sort({ date: 1 }); // Oldest to newest

        res.status(200).json({
            success: true,
            results: appointments.length,
            data: appointments
        });
    } catch (err) {
        console.error("Doctor Schedule Error:", err);
        res.status(500).json({ success: false, message: 'Failed to fetch doctor schedule' });
    }
};

// @desc    Get a patient's own appointments
// @route   GET /api/appointments/my-appointments
// @access  Private (Patient)
exports.getMyAppointments = async (req, res, next) => {
    try {
        const appointments = await Appointment.find({ patientId: req.user.id })
            .populate('doctorId', 'username');
        res.status(200).json({ success: true, data: appointments });
    } catch (err) {
        next(err);
    }
};

// @desc    Patient cancels their own appointment
// @route   PATCH /api/patient/appointments/:id/cancel
// @access  Private (Patient)
exports.cancelMyAppointment = async (req, res, next) => {
    try {
        const appointmentId = req.params.id;
        const userId = req.user.id;

        const updatedAppointment = await Appointment.findOneAndUpdate(
            { _id: appointmentId, patientId: userId },
            { 
                $set: {
                    status: 'cancelled',
                    cancellationReason: 'Cancelled by patient'
                },
                $push: { 
                    statusHistory: { 
                        status: 'cancelled', 
                        updatedBy: userId,
                        updatedAt: new Date()
                    }
                }
            },
            { new: true }
        );

        if (!updatedAppointment) {
            return next(new AppError('Appointment not found or unauthorized.', 404));
        }

        res.status(200).json({ success: true, data: updatedAppointment });

    } catch (err) {
        next(err);
    }
};