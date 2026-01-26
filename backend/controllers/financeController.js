const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');

// @desc    Get financial stats for doctors
// @route   GET /api/enterprise/finance-stats
// @access  Private (Doctor, Management)
exports.getDoctorStats = async (req, res, next) => {
    try {
        const matchStage = {};
        const { role, id } = req.user;
        const { doctorId } = req.query; // Management can query by doctorId

        if (role === 'doctor') {
            // Doctors can only see their own stats
            matchStage.doctorId = new mongoose.Types.ObjectId(id);
        } else if (role === 'management' && doctorId) {
            // Management can filter by a specific doctor
            matchStage.doctorId = new mongoose.Types.ObjectId(doctorId);
        }
        // If management and no doctorId is provided, it aggregates for all doctors

        const stats = await Appointment.aggregate([
            {
                $match: matchStage
            },
            {
                $facet: {
                    totalRevenue: [
                        { $match: { status: 'completed' } },
                        { $group: { _id: null, total: { $sum: '$price' } } }
                    ],
                    appointmentCount: [
                        { $group: { _id: '$status', count: { $sum: 1 } } }
                    ],
                    monthlyBreakdown: [
                        { $match: { status: 'completed' } },
                        {
                            $group: {
                                _id: { year: { $year: '$date' }, month: { $month: '$date' } },
                                monthlyTotal: { $sum: '$price' },
                                count: { $sum: 1 }
                            }
                        },
                        { $sort: { '_id.year': 1, '_id.month': 1 } }
                    ]
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalRevenue: stats[0].totalRevenue[0] ? stats[0].totalRevenue[0].total : 0,
                appointmentCount: stats[0].appointmentCount,
                monthlyBreakdown: stats[0].monthlyBreakdown
            }
        });
    } catch (err) {
        next(err);
    }
};
