const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    doctorId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    clinicLocation: {
        type: String,
        required: [true, 'Please specify the clinic location'],
        enum: ['Janaklees Clinic', 'Mahatet al Raml Clinic']
    },
    date: {
        type: Date,
        required: [true, 'Please add an appointment date']
    },
    status: {
        type: String,
        enum: ['upcoming', 'completed', 'cancelled', 'no-show'],
        default: 'upcoming'
    },
    type: {
        type: String,
        required: [true, 'Please specify the type of appointment']
    },
    price: {
        type: Number,
        required: [true, 'A price must be set for the appointment.']
    },
    medicalRecord: {
        prescription: String,
        requiredDocs: [String],
        medicalAdvice: String
    },
    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true,
    strict: false // Optional: allows flexibility, but schema definition above is key
});

AppointmentSchema.add({ adminNote: String }); // Adding the missing administrative note field

module.exports = mongoose.model('Appointment', AppointmentSchema);