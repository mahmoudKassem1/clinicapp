const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Please provide a username'],
        unique: true
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 6,
        select: false
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    phone: {
        type: String,
        required: [true, 'Please provide a phone number'],
        unique: true
    },
    role: {
        type: String,
        enum: ['patient', 'doctor', 'management'],
        default: 'patient'
    },
    language: {
        type: String,
        default: 'en'
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    history: [{
        date: { type: Date, default: Date.now },
        medicalAdvice: { type: String },
        prescription: { type: String },
        requiredDocuments: { type: String },
        doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        doctorName: { type: String }
    }]
});

// Encrypt password using bcrypt
userSchema.pre('save', async function() { // 1. REMOVED 'next' argument
    // If password is not modified, just return (exit the function)
    if (!this.isModified('password')) {
        return; 
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    
    // 2. REMOVED 'next()' call at the end
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password reset token
userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    return resetToken;
};

module.exports = mongoose.model('User', userSchema);
