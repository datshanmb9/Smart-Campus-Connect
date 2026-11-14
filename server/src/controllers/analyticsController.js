const User = require('../models/User');
const Complaint = require('../models/Complaint');
const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const Booking = require('../models/Booking');
const LostFoundItem = require('../models/LostFoundItem');
const Location = require('../models/Location');
const Announcement = require('../models/Announcement');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * @desc    Get real-time summary statistics for Admin Dashboard
 * @route   GET /api/analytics/admin-stats
 * @access  Private (Admin only)
 */
const getAdminStats = async (req, res, next) => {
  try {
    const [
      totalStudents,
      pendingStudents,
      totalFaculty,
      totalAdmins,
      totalComplaints,
      pendingComplaints,
      assignedComplaints,
      inProgressComplaints,
      resolvedComplaints,
      rejectedComplaints,
      upcomingEvents,
      totalEventRegistrations,
      pendingBookings,
      approvedBookings,
      activeLostFound,
      totalLocations,
      totalAnnouncements,
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'student', approvalStatus: 'Pending' }),
      User.countDocuments({ role: 'faculty' }),
      User.countDocuments({ role: 'admin' }),
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: 'Pending' }),
      Complaint.countDocuments({ status: 'Assigned' }),
      Complaint.countDocuments({ status: 'In Progress' }),
      Complaint.countDocuments({ status: 'Resolved' }),
      Complaint.countDocuments({ status: 'Rejected' }),
      Event.countDocuments({ status: 'Upcoming' }),
      EventRegistration.countDocuments(),
      Booking.countDocuments({ status: 'Pending' }),
      Booking.countDocuments({ status: 'Approved' }),
      LostFoundItem.countDocuments({ status: 'Active' }),
      Location.countDocuments({ isActive: true }),
      Announcement.countDocuments(),
    ]);

    const resolutionRate =
      totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 0;

    return sendSuccess(res, 'Admin analytics retrieved successfully', {
      users: {
        totalStudents,
        pendingStudents,
        totalFaculty,
        totalAdmins,
        totalUsers: totalStudents + totalFaculty + totalAdmins,
      },
      complaints: {
        total: totalComplaints,
        pending: pendingComplaints,
        assigned: assignedComplaints,
        inProgress: inProgressComplaints,
        resolved: resolvedComplaints,
        rejected: rejectedComplaints,
        resolutionRate: `${resolutionRate}%`,
      },
      events: {
        upcoming: upcomingEvents,
        totalRegistrations: totalEventRegistrations,
      },
      bookings: {
        pending: pendingBookings,
        approved: approvedBookings,
      },
      lostFound: {
        active: activeLostFound,
      },
      locations: {
        totalActive: totalLocations,
      },
      announcements: {
        total: totalAnnouncements,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get detailed complaint metrics grouped by category and priority
 * @route   GET /api/analytics/complaint-metrics
 * @access  Private (Admin, Faculty)
 */
const getComplaintMetrics = async (req, res, next) => {
  try {
    const [byCategory, byPriority, byStatus] = await Promise.all([
      Complaint.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Complaint.aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Complaint.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    return sendSuccess(res, 'Complaint metrics retrieved successfully', {
      byCategory,
      byPriority,
      byStatus,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get faculty dashboard statistics
 * @route   GET /api/analytics/faculty-summary
 * @access  Private (Faculty only)
 */
const getFacultySummary = async (req, res, next) => {
  try {
    const [myEvents, myBookings, totalAnnouncements, pendingBookings] = await Promise.all([
      Event.countDocuments({ organizer: req.user._id }),
      Booking.countDocuments({ requestedBy: req.user._id }),
      Announcement.countDocuments(),
      Booking.countDocuments({ requestedBy: req.user._id, status: 'Pending' }),
    ]);

    return sendSuccess(res, 'Faculty summary statistics retrieved successfully', {
      myEvents,
      myBookings,
      totalAnnouncements,
      pendingBookings,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminStats,
  getComplaintMetrics,
  getFacultySummary,
};

