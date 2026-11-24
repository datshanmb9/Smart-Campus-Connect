const Complaint = require('../models/Complaint');
const ComplaintHistory = require('../models/ComplaintHistory');
const Location = require('../models/Location');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { createNotification } = require('../utils/notificationHelper');

/**
 * Helper to generate sequential/unique ticket number
 */
const generateTicketNumber = async () => {
  const count = await Complaint.countDocuments();
  const year = new Date().getFullYear();
  const sequence = String(count + 1).padStart(4, '0');
  return `CMP-${year}-${sequence}`;
};

/**
 * @desc    Submit a new campus issue / complaint (QR-based or manual)
 * @route   POST /api/complaints
 * @access  Private (Student, Authenticated)
 */
const createComplaint = async (req, res, next) => {
  try {
    const {
      locationId,
      manualLocation,
      category,
      title,
      description,
      priority = 'Medium',
    } = req.body;

    if (!category || !title || !description) {
      return sendError(
        res,
        'Please provide all required fields: category, title, and description',
        400
      );
    }

    // Verify location: either valid locationId OR manual location details
    let resolvedLocationId = null;
    let parsedManualLocation = { buildingName: '', roomNumber: '', landmark: '' };

    if (locationId) {
      const loc = await Location.findById(locationId);
      if (loc) {
        resolvedLocationId = loc._id;
      }
    }

    if (!resolvedLocationId && manualLocation) {
      const parsed = typeof manualLocation === 'string' ? JSON.parse(manualLocation) : manualLocation;
      parsedManualLocation = {
        buildingName: parsed.buildingName || '',
        roomNumber: parsed.roomNumber || '',
        landmark: parsed.landmark || '',
      };
    }

    // Handle image file or image URL
    // After Cloudinary migration: req.file.path contains the full HTTPS Cloudinary URL
    let imageUrl = req.body.imageUrl || '';
    if (req.file) {
      imageUrl = req.file.path || req.file.secure_url || '';
    }

    const ticketNumber = await generateTicketNumber();

    // Create Complaint
    const complaint = await Complaint.create({
      ticketNumber,
      studentId: req.user._id,
      locationId: resolvedLocationId,
      manualLocation: parsedManualLocation,
      category,
      title: title.trim(),
      description: description.trim(),
      imageUrl,
      priority,
      status: 'Pending',
    });

    // Create Initial Audit History Entry
    await ComplaintHistory.create({
      complaintId: complaint._id,
      changedBy: req.user._id,
      previousStatus: '',
      newStatus: 'Pending',
      actionNotes: 'Complaint logged by student',
    });

    // Dispatch In-App Notification to Student
    await createNotification({
      recipient: req.user._id,
      title: 'Complaint Registered',
      message: `Your issue ticket ${ticketNumber} (${title}) has been submitted and is pending review.`,
      type: 'ComplaintUpdate',
      relatedEntityId: complaint._id,
    });

    const populatedComplaint = await Complaint.findById(complaint._id)
      .populate('studentId', 'fullName email registrationNumber department')
      .populate('locationId');

    return sendSuccess(
      res,
      'Complaint submitted successfully. Your ticket has been logged.',
      { complaint: populatedComplaint },
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all complaints with filtering, search, and pagination
 * @route   GET /api/complaints
 * @access  Private (Admin, Faculty)
 */
const getAllComplaints = async (req, res, next) => {
  try {
    const { status, category, priority, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;

    if (search) {
      query.$or = [
        { ticketNumber: new RegExp(search, 'i') },
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await Complaint.countDocuments(query);

    const complaints = await Complaint.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .populate('studentId', 'fullName email registrationNumber department phone')
      .populate('locationId');

    return sendSuccess(res, 'Complaints retrieved successfully', {
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / parseInt(limit, 10)),
      complaints,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get complaints submitted by the currently logged-in student
 * @route   GET /api/complaints/my
 * @access  Private (Student)
 */
const getMyComplaints = async (req, res, next) => {
  try {
    const complaints = await Complaint.find({ studentId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('locationId');

    return sendSuccess(res, 'Your complaints retrieved successfully', {
      total: complaints.length,
      complaints,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single complaint details with audit history
 * @route   GET /api/complaints/:id
 * @access  Private (Authenticated)
 */
const getComplaintById = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('studentId', 'fullName email registrationNumber department phone')
      .populate('locationId');

    if (!complaint) {
      return sendError(res, 'Complaint record not found', 404);
    }

    // Role-based visibility check: students can only view their own complaints
    if (
      req.user.role === 'student' &&
      complaint.studentId._id.toString() !== req.user._id.toString()
    ) {
      return sendError(res, 'Forbidden: You cannot view complaints filed by other students', 403);
    }

    // Fetch audit history
    const history = await ComplaintHistory.find({ complaintId: complaint._id })
      .sort({ timestamp: 1 })
      .populate('changedBy', 'fullName role department');

    return sendSuccess(res, 'Complaint details retrieved successfully', {
      complaint,
      history,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update complaint status (Pending -> Assigned -> In Progress -> Resolved/Rejected)
 * @route   PUT /api/complaints/:id/status
 * @access  Private (Admin only)
 */
const updateComplaintStatus = async (req, res, next) => {
  try {
    const { status, actionNotes = '', rejectionReason = '', resolutionNotes = '' } = req.body;

    if (!status || !['Pending', 'Assigned', 'In Progress', 'Resolved', 'Rejected'].includes(status)) {
      return sendError(res, 'Please provide a valid status', 400);
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return sendError(res, 'Complaint record not found', 404);
    }

    const previousStatus = complaint.status;

    if (status === 'Rejected' && !rejectionReason) {
      return sendError(res, 'A rejection reason is required when rejecting a complaint', 400);
    }

    complaint.status = status;

    if (status === 'Rejected') {
      complaint.rejectionReason = rejectionReason;
    }

    if (status === 'Resolved') {
      complaint.resolutionNotes = resolutionNotes || actionNotes || 'Resolved by campus facilities team';
      complaint.resolvedAt = new Date();
    }

    await complaint.save();

    // Log in ComplaintHistory
    await ComplaintHistory.create({
      complaintId: complaint._id,
      changedBy: req.user._id,
      previousStatus,
      newStatus: status,
      actionNotes: actionNotes || `Status updated from ${previousStatus} to ${status}`,
    });

    // Notify the student
    await createNotification({
      recipient: complaint.studentId,
      title: `Complaint Status: ${status}`,
      message: `Your complaint ${complaint.ticketNumber} (${complaint.title}) has been updated to "${status}".`,
      type: 'ComplaintUpdate',
      relatedEntityId: complaint._id,
    });

    return sendSuccess(res, `Complaint status updated to ${status}`, { complaint });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Assign complaint to maintenance technician or staff
 * @route   PUT /api/complaints/:id/assign
 * @access  Private (Admin only)
 */
const assignComplaint = async (req, res, next) => {
  try {
    const { staffName, staffPhone, department = 'Maintenance' } = req.body;

    if (!staffName) {
      return sendError(res, 'Please provide the name of the assigned staff/technician', 400);
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return sendError(res, 'Complaint record not found', 404);
    }

    const previousStatus = complaint.status;

    complaint.assignedTo = {
      staffName: staffName.trim(),
      staffPhone: staffPhone ? staffPhone.trim() : '',
      department: department.trim(),
      assignedDate: new Date(),
    };

    // Auto-advance to Assigned if it was Pending
    if (complaint.status === 'Pending') {
      complaint.status = 'Assigned';
    }

    await complaint.save();

    // Log history
    await ComplaintHistory.create({
      complaintId: complaint._id,
      changedBy: req.user._id,
      previousStatus,
      newStatus: complaint.status,
      actionNotes: `Assigned to ${staffName} (${department})`,
    });

    // Notify student
    await createNotification({
      recipient: complaint.studentId,
      title: 'Complaint Assigned',
      message: `Your complaint ${complaint.ticketNumber} has been assigned to ${staffName}.`,
      type: 'ComplaintUpdate',
      relatedEntityId: complaint._id,
    });

    return sendSuccess(res, `Complaint assigned to ${staffName} successfully`, { complaint });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createComplaint,
  getAllComplaints,
  getMyComplaints,
  getComplaintById,
  updateComplaintStatus,
  assignComplaint,
};

