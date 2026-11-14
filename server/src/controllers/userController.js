const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { createNotification } = require('../utils/notificationHelper');

/**
 * @desc    Get all users with filtering and search
 * @route   GET /api/users
 * @access  Private (Admin only)
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { role, approvalStatus, search, department, page = 1, limit = 20 } = req.query;

    const query = {};

    if (role && ['student', 'faculty', 'admin'].includes(role)) {
      query.role = role;
    }

    if (approvalStatus && ['Pending', 'Approved', 'Rejected', 'Suspended'].includes(approvalStatus)) {
      query.approvalStatus = approvalStatus;
    }

    if (department) {
      query.department = new RegExp(department, 'i');
    }

    if (search) {
      query.$or = [
        { fullName: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { registrationNumber: new RegExp(search, 'i') },
        { employeeId: new RegExp(search, 'i') },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const totalUsers = await User.countDocuments(query);

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    return sendSuccess(res, 'Users retrieved successfully', {
      total: totalUsers,
      page: parseInt(page, 10),
      pages: Math.ceil(totalUsers / parseInt(limit, 10)),
      users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all pending student registrations awaiting admin approval
 * @route   GET /api/users/pending-students
 * @access  Private (Admin only)
 */
const getPendingStudents = async (req, res, next) => {
  try {
    const { search, department, page = 1, limit = 50 } = req.query;
    const query = {
      role: 'student',
      approvalStatus: 'Pending',
    };

    if (department) {
      query.department = new RegExp(department, 'i');
    }

    if (search) {
      query.$or = [
        { fullName: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { registrationNumber: new RegExp(search, 'i') },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const total = await User.countDocuments(query);

    const students = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    return sendSuccess(res, 'Pending student registrations retrieved successfully', {
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / parseInt(limit, 10)),
      students,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Approve a pending student registration
 * @route   PUT /api/users/:id/approve
 * @access  Private (Admin only)
 */
const approveStudent = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return sendError(res, 'Student record not found', 404);
    }

    if (user.role !== 'student') {
      return sendError(res, 'Only student accounts can be processed through student verification', 400);
    }

    user.approvalStatus = 'Approved';
    user.approvedBy = req.user._id;
    user.approvedAt = new Date();
    user.rejectionReason = '';
    user.isActive = true;

    await user.save();

    // Send in-app notification to student
    await createNotification({
      recipient: user._id,
      title: 'Registration Approved',
      message: `Your student registration (${user.registrationNumber || user.email}) has been verified and approved by the campus administration. You can now access all portal and mobile services.`,
      type: 'AccountApproval',
      relatedEntityId: user._id,
    });

    return sendSuccess(
      res,
      `Student account for ${user.fullName} (${user.registrationNumber}) approved successfully`,
      { user }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reject a pending student registration with reason
 * @route   PUT /api/users/:id/reject
 * @access  Private (Admin only)
 */
const rejectStudent = async (req, res, next) => {
  try {
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return sendError(res, 'A valid rejection reason is required to reject a registration', 400);
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return sendError(res, 'Student record not found', 404);
    }

    if (user.role !== 'student') {
      return sendError(res, 'Only student accounts can be rejected through student verification', 400);
    }

    user.approvalStatus = 'Rejected';
    user.rejectionReason = reason.trim();
    user.approvedBy = req.user._id;
    user.approvedAt = new Date();

    await user.save();

    // Send in-app notification to student
    await createNotification({
      recipient: user._id,
      title: 'Registration Rejected',
      message: `Your student registration was rejected by campus administration. Reason: ${reason.trim()}`,
      type: 'AccountApproval',
      relatedEntityId: user._id,
    });

    return sendSuccess(res, `Student account for ${user.fullName} has been rejected`, {
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Suspend a user account
 * @route   PUT /api/users/:id/suspend
 * @access  Private (Admin only)
 */
const suspendUser = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    if (user._id.toString() === req.user._id.toString()) {
      return sendError(res, 'Administrators cannot suspend their own account', 400);
    }

    user.approvalStatus = 'Suspended';
    if (reason) user.rejectionReason = reason.trim();
    await user.save();

    return sendSuccess(res, `Account for ${user.fullName} has been suspended`, {
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user by ID
 * @route   GET /api/users/:id
 * @access  Private (Admin only)
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    return sendSuccess(res, 'User retrieved successfully', { user });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user status (activate/deactivate) or update role
 * @route   PUT /api/users/:id/status
 * @access  Private (Admin only)
 */
const updateUserStatus = async (req, res, next) => {
  try {
    const { isActive, role } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Prevent admin from deactivating themselves
    if (user._id.toString() === req.user._id.toString() && isActive === false) {
      return sendError(res, 'Administrators cannot deactivate their own account', 400);
    }

    if (isActive !== undefined) user.isActive = isActive;
    if (role && ['student', 'faculty', 'admin'].includes(role)) user.role = role;

    const updatedUser = await user.save();

    return sendSuccess(res, 'User status updated successfully', { user: updatedUser });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUserStatus,
  getPendingStudents,
  approveStudent,
  rejectStudent,
  suspendUser,
};

