const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/email');

// @desc    Helper to sign JWT
const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

// @desc    Send Token Response (Standardized)
const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);

    // 🛡️ SECURITY: Remove password from output before sending
    user.password = undefined;

    // Remove passwordResetToken fields from output if they exist
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    // Parse cookie expiration from env or default to 1 day
    const cookieExpires = parseInt(process.env.JWT_COOKIE_EXPIRES_IN, 10) || 1;

    const cookieOptions = {
        expires: new Date(Date.now() + cookieExpires * 24 * 60 * 60 * 1000),
        httpOnly: true
    };
    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

    res.cookie('jwt', token, cookieOptions);

    res.status(statusCode).json({
        success: true,
        token,
        data: {
            user // This sends _id, username, role, phone, etc.
        }
    });
};

// @desc    Register a patient
// @route   POST /api/patient/signup
// @access  Public
exports.patientSignup = async (req, res, next) => {
    try {
        const { username, email, password, phone, language } = req.body;

        // Create user but force the role to 'patient'
        const user = await User.create({
            username,
            email,
            password,
            phone,
            language,
            role: 'patient'
        });

        createSendToken(user, 201, res);
    } catch (err) {
        // Fallback for signup errors
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

// @desc    Register a doctor or management staff
// @route   POST /api/enterprise/signup
// @access  Public (for setup)
exports.enterpriseSignup = async (req, res, next) => {
    try {
        const { username, email, password, phone, role, language } = req.body;

        if (!['doctor', 'management'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role specified for enterprise signup' });
        }

        // Logic to restrict number of doctors (Max 1)
        if (role === 'doctor') {
            const doctorCount = await User.countDocuments({ role: 'doctor' });
            if (doctorCount >= 1) {
                return res.status(400).json({ success: false, message: 'Cannot register more than one doctor' });
            }
        }

        // Logic to restrict number of management (Max 3)
        if (role === 'management') {
            const managementCount = await User.countDocuments({ role: 'management' });
            if (managementCount >= 3) {
                return res.status(400).json({ success: false, message: 'Cannot register more than three management users' });
            }
        }

        const user = await User.create({
            username,
            email,
            password,
            phone,
            role,
            language
        });

        createSendToken(user, 201, res);
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

// @desc    Login user (Supports Email OR Phone)
// @route   POST /api/patient/login
// @route   POST /api/enterprise/login
// @access  Public
exports.login = async (req, res, next) => {
    try {
        // 1) Get email OR phone and password from body
        const { email, phone, password } = req.body;

        // 2) Check if either (email OR phone) AND password exist
        if (!(email || phone) || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email (or phone) and password!' });
        }

        // 3) Find user based on which field was provided
        const query = email ? { email } : { phone };
        
        // We must explicitly select '+password' because it's usually hidden
        const user = await User.findOne(query).select('+password');

        // 4) Check if user exists & password is correct
        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ success: false, message: 'Incorrect credentials' });
        }

        // 5) If everything ok, send token
        createSendToken(user, 200, res);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Forgot Password
// @route   POST /api/users/forgotPassword
// @access  Public
exports.forgotPassword = async (req, res) => { // Removed 'next' to prevent errors
    try {
        // 1) Get user based on POSTed email
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'There is no user with that email address.'
            });
        }

        // 2) Generate the random reset token
        const resetToken = user.createPasswordResetToken();
        await user.save({ validateBeforeSave: false });

        // 3) Send it to user's email
        const resetURL = `http://localhost:5173/reset-password/${resetToken}`;
        
        // --- HTML EMAIL TEMPLATE ---
        const message = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="color: #4CAF50; text-align: center;">Dr. Ellakany App</h2>
            <h3 style="color: #333;">Password Reset Request</h3>
            <p>Hello,</p>
            <p>We received a request to reset your password. If this was you, please use the token below or click the button:</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetURL}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
            </div>

            <p style="background-color: #f4f4f4; padding: 10px; border-radius: 5px; font-family: monospace; word-break: break-all;">${resetURL}</p>

            <p>If you didn't forget your password, please ignore this email!</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #888; text-align: center;">This token is valid for 10 minutes.</p>
        </div>
        `;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Your password reset token (valid for 10 min)',
                message // handled as HTML in utils/email.js
            });

            res.status(200).json({
                status: 'success',
                message: 'Token sent to email!'
            });
        } catch (err) {
            // FIX: Handle email error locally
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save({ validateBeforeSave: false });

            console.error("❌ EMAIL ERROR:", err);
            
            return res.status(500).json({
                success: false,
                message: 'There was an error sending the email. Try again later!'
            });
        }
    } catch (err) {
        console.error("❌ DB ERROR:", err);
        return res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// @desc    Reset Password
// @route   PATCH /api/users/resetPassword/:token
// @access  Public
exports.resetPassword = async (req, res) => { // Removed 'next' to prevent errors
    try {
        // 1) Get user based on the token
        const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        });

        // 2) If token has not expired, and there is user, set the new password
        if (!user) {
            return res.status(400).json({
                status: 'fail',
                message: 'Token is invalid or has expired'
            });
        }

        user.password = req.body.password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        // 3) Log the user in, send JWT
        createSendToken(user, 200, res);

    } catch (err) {
        console.error("❌ RESET PASS ERROR:", err);
        return res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

// @desc    Protect routes
exports.protect = async (req, res, next) => {
    let token;
    // 1) Getting token and check of it's there
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }

    try {
        // 2) Verification token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 3) Check if user still exists
        const currentUser = await User.findById(decoded.id);
        if (!currentUser) {
            return res.status(401).json({ success: false, message: 'The user belonging to this token no longer does exist.' });
        }

        // GRANT ACCESS TO PROTECTED ROUTE
        req.user = currentUser;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }
};

// @desc    Grant access to specific roles
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'You do not have permission to perform this action' });
        }
        next();
    };
};