const Booking = require('../models/Booking');
const Location = require('../models/Location');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { createNotification } = require('../utils/notificationHelper');

/**
 * In-memory concurrency lock per academic section to prevent simultaneous requests from breaching limit
 */
const sectionLocks = new Map();

const acquireSectionLock = async (key) => {
  while (sectionLocks.get(key)) {
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  sectionLocks.set(key, true);
};

const releaseSectionLock = (key) => {
  sectionLocks.delete(key);
};

/**
 * Check if two HH:mm intervals overlap
 */
const isTimeOverlapping = (startA, endA, startB, endB) => {
  return startA < endB && endA > startB;
};

/**
 * @desc    Submit a room or facility booking request
 * @route   POST /api/bookings
 * @access  Private (Student, Faculty)
 */
const createBooking = async (req, res, next) => {
  let sectionKey = null;
  let acquiredLock = false;

  try {
    const {
      locationId,
      resourceName,
      purpose,
      bookingDate,
      startTime,
      endTime,
      attendeesEstimate = 20,
    } = req.body;

    // 1. Required fields validation
    if (!locationId || !purpose || !bookingDate || !startTime || !endTime) {
      return sendError(res, 'Please provide all required booking fields: locationId, purpose, bookingDate, startTime, endTime', 400);
    }

    // 2. Time interval validation
    if (startTime >= endTime) {
      return sendError(res, 'Invalid time range: End time must be later than start time', 400);
    }

    // 3. Date validation (no past dates, within next 30 days)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(bookingDate);
    targetDate.setHours(0, 0, 0, 0);

    if (isNaN(targetDate.getTime())) {
      return sendError(res, 'Invalid booking date format', 400);
    }

    if (targetDate < today) {
      return sendError(res, 'Invalid date: Booking date cannot be in the past', 400);
    }

    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 30);
    if (targetDate > maxDate) {
      return sendError(res, 'Booking date exceeds limit: Reservations are allowed only within the next 30 days', 400);
    }

    const location = await Location.findById(locationId);
    if (!location) {
      return sendError(res, 'Selected campus facility not found', 404);
    }

    if (!location.isActive) {
      return sendError(res, 'Selected facility is currently inactive for reservations', 400);
    }

    // 4. Student restriction: Maximum 2 active pending requests
    if (req.user.role === 'student') {
      const activePendingCount = await Booking.countDocuments({
        requestedBy: req.user._id,
        status: 'Pending',
      });

      if (activePendingCount >= 2) {
        return sendError(
          res,
          'Active pending request limit reached. You can have at most 2 pending booking requests at a time. Please wait for an existing request to be reviewed or cancel one.',
          400
        );
      }

      // 4b. SECTION-WISE ROOM BOOKING LIMIT (MODULE 1):
      // Only TWO students/requests from each academic section can have active (Pending or Approved) requests at a time.
      const student = await User.findById(req.user._id);
      const academicYear = student?.academicYear || '1st Year';
      const section = student?.section || 'A';
      sectionKey = `${student?.department || 'General'}_${academicYear}_${section}`;

      // Acquire concurrency lock for this section
      await acquireSectionLock(sectionKey);
      acquiredLock = true;

      // Find all students in this section
      const sectionStudents = await User.find({
        role: 'student',
        academicYear,
        section,
      }).select('_id');

      const sectionStudentIds = sectionStudents.map((s) => s._id);

      // Count active (Pending and Approved) booking requests for this section across all facilities and dates
      const activeSectionBookingsCount = await Booking.countDocuments({
        requestedBy: { $in: sectionStudentIds },
        status: { $in: ['Pending', 'Approved'] },
      });

      if (activeSectionBookingsCount >= 2) {
        releaseSectionLock(sectionKey);
        acquiredLock = false;
        return sendError(
          res,
          'Your section has reached its maximum of 2 active room booking requests. Please try again later.',
          400
        );
      }
    }

    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // 5. Prevent duplicate booking requests by same user for same location and time
    const duplicateRequest = await Booking.findOne({
      requestedBy: req.user._id,
      locationId: location._id,
      bookingDate: { $gte: targetDate, $lt: nextDay },
      startTime,
      endTime,
      status: { $in: ['Pending', 'Approved'] },
    });

    if (duplicateRequest) {
      if (acquiredLock && sectionKey) {
        releaseSectionLock(sectionKey);
        acquiredLock = false;
      }
      return sendError(
        res,
        'Duplicate booking request: You already have an active request for this facility at this date and time',
        400
      );
    }

    // 6. Hard Conflict Check: Ensure no existing APPROVED bookings overlap
    const existingApprovedBookings = await Booking.find({
      locationId: location._id,
      status: 'Approved',
      bookingDate: { $gte: targetDate, $lt: nextDay },
    });

    const hasApprovedClash = existingApprovedBookings.some((existing) =>
      isTimeOverlapping(startTime, endTime, existing.startTime, existing.endTime)
    );

    if (hasApprovedClash) {
      if (acquiredLock && sectionKey) {
        releaseSectionLock(sectionKey);
        acquiredLock = false;
      }
      return sendError(
        res,
        `Booking Conflict: ${location.buildingName} - ${location.roomNumber} is already reserved by an approved booking during ${startTime} - ${endTime} on this date`,
        409
      );
    }

    // 7. Soft Conflict Check: Check if other students have submitted pending requests for overlapping slots
    const existingPendingBookings = await Booking.find({
      locationId: location._id,
      status: 'Pending',
      bookingDate: { $gte: targetDate, $lt: nextDay },
    });

    const hasPendingClash = existingPendingBookings.some((existing) =>
      isTimeOverlapping(startTime, endTime, existing.startTime, existing.endTime)
    );

    const warning = hasPendingClash
      ? 'Notice: There is another pending request for an overlapping time slot. Approval will be decided by the reviewing authority.'
      : null;

    // Create the booking
    const booking = await Booking.create({
      resourceName: resourceName || `${location.buildingName} - ${location.roomNumber}`,
      locationId: location._id,
      requestedBy: req.user._id,
      purpose: purpose.trim(),
      bookingDate: targetDate,
      startTime,
      endTime,
      attendeesEstimate: Number(attendeesEstimate) || 20,
      status: 'Pending',
    });

    // Release concurrency lock after successful insertion
    if (acquiredLock && sectionKey) {
      releaseSectionLock(sectionKey);
      acquiredLock = false;
    }

    const populated = await Booking.findById(booking._id)
      .populate('requestedBy', 'fullName email department phone registrationNumber role academicYear section')
      .populate('locationId');

    return sendSuccess(
      res,
      warning
        ? `Booking request submitted. ${warning}`
        : 'Facility booking request submitted successfully. Awaiting administrative approval.',
      {
        booking: populated,
        warning,
      },
      201
    );
  } catch (error) {
    if (acquiredLock && sectionKey) {
      releaseSectionLock(sectionKey);
    }
    next(error);
  }
};

/**
 * @desc    Get all campus facility bookings (with authority filtering, search, pagination, stats)
 * @route   GET /api/bookings
 * @access  Private (Admin, Faculty)
 */
const getAllBookings = async (req, res, next) => {
  try {
    const { status, locationId, date, search, page = 1, limit = 20 } = req.query;
    const query = {};

    // Authority Scoping: Admin sees all bookings; Faculty only sees their permitted facilities
    if (req.user.role === 'faculty') {
      const facultyLocations = await Location.find({
        approvalAuthority: 'faculty',
        $or: [
          { assignedFaculty: null },
          { assignedFaculty: req.user._id },
        ],
      }).select('_id');

      const allowedLocationIds = facultyLocations.map((loc) => loc._id);
      query.locationId = { $in: allowedLocationIds };
    }

    if (locationId) {
      // If faculty specified a locationId, ensure it's within their permitted list
      if (req.user.role === 'faculty') {
        const isPermitted = query.locationId.$in.some((id) => id.toString() === locationId);
        if (!isPermitted) {
          return sendSuccess(res, 'Bookings retrieved successfully', {
            total: 0,
            page: 1,
            pages: 0,
            stats: { pending: 0, approved: 0, rejected: 0, cancelled: 0, total: 0 },
            bookings: [],
          });
        }
      }
      query.locationId = locationId;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (date) {
      const target = new Date(date);
      target.setHours(0, 0, 0, 0);
      const nextDay = new Date(target);
      nextDay.setDate(nextDay.getDate() + 1);
      query.bookingDate = { $gte: target, $lt: nextDay };
    }

    // Search filter across resourceName or purpose
    if (search) {
      query.$or = [
        { resourceName: new RegExp(search, 'i') },
        { purpose: new RegExp(search, 'i') },
      ];
    }

    // Booking Statistics for the scoped authority
    const baseScopeQuery = req.user.role === 'faculty' ? { locationId: query.locationId } : {};
    const [pendingCount, approvedCount, rejectedCount, cancelledCount, totalCount] = await Promise.all([
      Booking.countDocuments({ ...baseScopeQuery, status: 'Pending' }),
      Booking.countDocuments({ ...baseScopeQuery, status: 'Approved' }),
      Booking.countDocuments({ ...baseScopeQuery, status: 'Rejected' }),
      Booking.countDocuments({ ...baseScopeQuery, status: 'Cancelled' }),
      Booking.countDocuments(baseScopeQuery),
    ]);

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const totalMatching = await Booking.countDocuments(query);

    const bookings = await Booking.find(query)
      .sort({ bookingDate: -1, startTime: 1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .populate('requestedBy', 'fullName email department phone role registrationNumber')
      .populate('locationId')
      .populate('reviewedBy', 'fullName email role');

    return sendSuccess(res, 'Bookings retrieved successfully', {
      total: totalMatching,
      page: parseInt(page, 10),
      pages: Math.ceil(totalMatching / parseInt(limit, 10)),
      stats: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        cancelled: cancelledCount,
        total: totalCount,
      },
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get bookings submitted by current user
 * @route   GET /api/bookings/my
 * @access  Private (Authenticated)
 */
const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ requestedBy: req.user._id })
      .sort({ bookingDate: -1, createdAt: -1 })
      .populate('locationId')
      .populate('reviewedBy', 'fullName email role');

    return sendSuccess(res, 'Your booking requests retrieved successfully', {
      total: bookings.length,
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Approve or Reject a room booking request
 * @route   PUT /api/bookings/:id/status
 * @access  Private (Admin, Faculty)
 */
const updateBookingStatus = async (req, res, next) => {
  try {
    const { status, rejectionReason = '' } = req.body;

    if (!['Approved', 'Rejected', 'Cancelled'].includes(status)) {
      return sendError(res, 'Status must be Approved, Rejected, or Cancelled', 400);
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return sendError(res, 'Booking request not found', 404);
    }

    const location = await Location.findById(booking.locationId);
    if (!location) {
      return sendError(res, 'Associated facility not found', 404);
    }

    // Role-based booking approval authorization check
    if (req.user.role === 'faculty') {
      if (location.approvalAuthority !== 'faculty') {
        return sendError(res, 'Unauthorized: This facility requires administrator approval', 403);
      }
      if (location.assignedFaculty && location.assignedFaculty.toString() !== req.user._id.toString()) {
        return sendError(res, 'Unauthorized: You are not the assigned faculty reviewer for this facility', 403);
      }
    } else if (req.user.role !== 'admin') {
      return sendError(res, 'Unauthorized: Only administrators and designated faculty can review bookings', 403);
    }

    // If rejecting, rejection reason is strictly required
    if (status === 'Rejected') {
      if (!rejectionReason || !rejectionReason.trim()) {
        return sendError(res, 'A rejection reason is required when rejecting a booking request', 400);
      }
      booking.rejectionReason = rejectionReason.trim();
    }

    // If approving, re-verify conflict check to prevent race conditions
    if (status === 'Approved') {
      const targetDate = new Date(booking.bookingDate);
      targetDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      const conflicts = await Booking.find({
        _id: { $ne: booking._id },
        locationId: booking.locationId,
        status: 'Approved',
        bookingDate: { $gte: targetDate, $lt: nextDay },
      });

      const hasClash = conflicts.some((c) =>
        isTimeOverlapping(booking.startTime, booking.endTime, c.startTime, c.endTime)
      );

      if (hasClash) {
        return sendError(
          res,
          'Conflict detected: Another reservation has already been approved for this facility and overlapping time slot',
          409
        );
      }
    }

    booking.status = status;
    booking.reviewedBy = req.user._id;
    booking.reviewedAt = new Date();

    await booking.save();

    // Notification message
    const formattedDate = new Date(booking.bookingDate).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const notifMessage = status === 'Approved'
      ? `Your booking for ${booking.resourceName} on ${formattedDate} (${booking.startTime} - ${booking.endTime}) has been approved.`
      : `Your booking for ${booking.resourceName} on ${formattedDate} was rejected. Reason: ${booking.rejectionReason}`;

    // Dispatch notification to requester
    await createNotification({
      recipient: booking.requestedBy,
      title: `Facility Reservation ${status}`,
      message: notifMessage,
      type: 'BookingUpdate',
      relatedEntityId: booking._id,
    });

    const updated = await Booking.findById(booking._id)
      .populate('requestedBy', 'fullName email department registrationNumber')
      .populate('locationId')
      .populate('reviewedBy', 'fullName email role');

    return sendSuccess(res, `Booking request marked as ${status}`, { booking: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel a booking request (by student requester or admin)
 * @route   PUT /api/bookings/:id/cancel or DELETE /api/bookings/:id
 * @access  Private (Requester or Admin)
 */
const cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return sendError(res, 'Booking not found', 404);
    }

    const isRequester = booking.requestedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isRequester && !isAdmin) {
      return sendError(res, 'Unauthorized: You can only cancel your own booking requests', 403);
    }

    if (booking.status === 'Cancelled') {
      return sendError(res, 'This booking has already been cancelled', 400);
    }

    // Students can cancel their pending requests
    booking.status = 'Cancelled';
    booking.cancelledAt = new Date();
    await booking.save();

    return sendSuccess(res, 'Booking request cancelled successfully', { booking });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get booking counts grouped by academic year and section (Admin only)
 * @route   GET /api/bookings/section-summary
 * @access  Private (Admin only)
 */
const getSectionBookingSummary = async (req, res, next) => {
  try {
    // 1. Fetch all active bookings (Pending and Approved)
    const activeBookings = await Booking.find({
      status: { $in: ['Pending', 'Approved'] },
    }).populate('requestedBy', 'fullName email registrationNumber department academicYear section');

    // 2. Define standard academic sections to display
    const defaultSections = [
      { department: 'Master of Computer Applications', year: '1st Year', section: 'A' },
      { department: 'Master of Computer Applications', year: '1st Year', section: 'B' },
      { department: 'Master of Computer Applications', year: '2nd Year', section: 'A' },
      { department: 'Master of Computer Applications', year: '2nd Year', section: 'B' },
    ];

    const sectionMap = {};

    defaultSections.forEach((s) => {
      const key = `${s.year} - Section ${s.section}`;
      sectionMap[key] = {
        department: s.department,
        academicYear: s.year,
        section: s.section,
        pendingCount: 0,
        approvedCount: 0,
        activeCount: 0,
        limit: 2,
        isAtLimit: false,
        activeBookings: [],
      };
    });

    // 3. Aggregate active bookings into sectionMap
    activeBookings.forEach((b) => {
      if (b.requestedBy) {
        const year = b.requestedBy.academicYear || '1st Year';
        const sec = b.requestedBy.section || 'A';
        const dept = b.requestedBy.department || 'Master of Computer Applications';
        const key = `${year} - Section ${sec}`;

        if (!sectionMap[key]) {
          sectionMap[key] = {
            department: dept,
            academicYear: year,
            section: sec,
            pendingCount: 0,
            approvedCount: 0,
            activeCount: 0,
            limit: 2,
            isAtLimit: false,
            activeBookings: [],
          };
        }

        if (b.status === 'Pending') sectionMap[key].pendingCount++;
        if (b.status === 'Approved') sectionMap[key].approvedCount++;
        sectionMap[key].activeCount++;
        sectionMap[key].activeBookings.push({
          bookingId: b._id,
          resourceName: b.resourceName,
          status: b.status,
          bookingDate: b.bookingDate,
          timeSlot: `${b.startTime} - ${b.endTime}`,
          studentName: b.requestedBy.fullName,
          registrationNumber: b.requestedBy.registrationNumber,
        });
      }
    });

    const summary = Object.values(sectionMap).map((sec) => ({
      ...sec,
      isAtLimit: sec.activeCount >= sec.limit,
      remainingSlots: Math.max(0, sec.limit - sec.activeCount),
    }));

    return sendSuccess(res, 'Section-wise room booking summary retrieved successfully', {
      totalSections: summary.length,
      sections: summary,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getAllBookings,
  getMyBookings,
  updateBookingStatus,
  cancelBooking,
  getSectionBookingSummary,
};
