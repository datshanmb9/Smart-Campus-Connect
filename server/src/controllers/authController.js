const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * @desc    Register a new Student or Faculty user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      password,
      role = 'student',
      phone,
      registrationNumber,
      employeeId,
      department,
      academicYear = '1st Year',
      section = 'A',
    } = req.body;

    // 1. Basic validation
    if (!fullName || !email || !password || !department) {
      return sendError(
        res,
        'Please provide all required fields: fullName, email, password, and department',
        400
      );
    }

    if (password.length < 6) {
      return sendError(res, 'Password must be at least 6 characters in length', 400);
    }

    // Restrict public self-registration from creating admin accounts
    if (role === 'admin') {
      return sendError(
        res,
        'Administrator accounts cannot be self-registered. Contact system administrator',
        403
      );
    }

    // Role-specific identifier validation
    if (role === 'student' && !registrationNumber) {
      return sendError(res, 'Registration number is required for student registration', 400);
    }

    if (role === 'faculty' && !employeeId) {
      return sendError(res, 'Employee ID is required for faculty registration', 400);
    }

    // 2. Check if user already exists with this email
    const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) {
      return sendError(res, 'An account with this email address already exists', 400);
    }

    // Check for duplicate registrationNumber or employeeId
    if (role === 'student' && registrationNumber) {
      const existingReg = await User.findOne({
        registrationNumber: registrationNumber.toUpperCase().trim(),
      });
      if (existingReg) {
        return sendError(res, 'A student with this registration number is already registered', 400);
      }
    }

    if (role === 'faculty' && employeeId) {
      const existingEmp = await User.findOne({
        employeeId: employeeId.toUpperCase().trim(),
      });
      if (existingEmp) {
        return sendError(res, 'A faculty member with this employee ID is already registered', 400);
      }
    }

    // 3. Create the user
    // Newly registered student accounts must have status Pending and NO JWT token issued
    const initialApprovalStatus = role === 'student' ? 'Pending' : 'Approved';

    const user = await User.create({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
      phone: phone ? phone.trim() : '',
      registrationNumber: role === 'student' ? registrationNumber.toUpperCase().trim() : undefined,
      employeeId: role === 'faculty' ? employeeId.toUpperCase().trim() : undefined,
      department: department.trim(),
      academicYear: role === 'student' ? (academicYear || '1st Year').trim() : undefined,
      section: role === 'student' ? (section || 'A').trim().toUpperCase() : undefined,
      approvalStatus: initialApprovalStatus,
      isActive: true,
    });

    // Student accounts require administrative approval before JWT issuance
    if (role === 'student') {
      return sendSuccess(
        res,
        'Registration submitted successfully. Your account is awaiting admin verification.',
        {
          user: {
            id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            department: user.department,
            registrationNumber: user.registrationNumber,
            academicYear: user.academicYear,
            section: user.section,
            approvalStatus: user.approvalStatus,
            createdAt: user.createdAt,
          },
          requiresApproval: true,
        },
        201
      );
    }

    // 4. Generate JWT for approved accounts
    const token = generateToken(user);

    return sendSuccess(
      res,
      'Registration successful. Welcome to Smart Campus Connect!',
      {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          department: user.department,
          registrationNumber: user.registrationNumber,
          employeeId: user.employeeId,
          academicYear: user.academicYear,
          section: user.section,
          phone: user.phone,
          avatarUrl: user.avatarUrl,
          approvalStatus: user.approvalStatus,
        },
        token,
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & get JWT token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email and password presence
    if (!email || !password) {
      return sendError(res, 'Please provide both email address and password', 400);
    }

    // Check for user and explicitly include password field
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      return sendError(res, 'Invalid credentials. User not found', 401);
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return sendError(res, 'Invalid credentials. Incorrect password', 401);
    }

    if (!user.isActive) {
      return sendError(res, 'Your account has been deactivated. Please contact campus admin', 403);
    }

    // Role and Approval Status Enforcement
    if (user.approvalStatus === 'Pending') {
      return sendError(res, 'Your account is awaiting admin verification.', 403);
    }

    if (user.approvalStatus === 'Rejected') {
      const reasonMsg = user.rejectionReason
        ? `Your account registration was rejected. Reason: ${user.rejectionReason}`
        : 'Your account registration has been rejected. Please contact campus administrator.';
      return sendError(res, reasonMsg, 403);
    }

    if (user.approvalStatus === 'Suspended') {
      return sendError(res, 'Your account has been suspended. Contact the administrator.', 403);
    }

    // Generate JWT
    const token = generateToken(user);

    return sendSuccess(res, 'Login successful', {
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        department: user.department,
        registrationNumber: user.registrationNumber,
        employeeId: user.employeeId,
        phone: user.phone,
        academicYear: user.academicYear || (user.role === 'student' ? '1st Year' : undefined),
        section: user.section || (user.role === 'student' ? 'A' : undefined),
        avatarUrl: user.avatarUrl,
        approvalStatus: user.approvalStatus,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current authenticated user profile
 * @route   GET /api/auth/me
 * @access  Private (Authenticated)
 */
const getMe = async (req, res) => {
  return sendSuccess(res, 'Profile retrieved successfully', {
    user: req.user,
  });
};

/**
 * @desc    Update current user profile
 * @route   PUT /api/auth/update-profile
 * @access  Private (Authenticated)
 */
const updateProfile = async (req, res, next) => {
  try {
    const { fullName, phone, department, academicYear, section, avatarUrl } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    if (fullName) user.fullName = fullName.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (department) user.department = department.trim();
    if (academicYear) user.academicYear = academicYear.trim();
    if (section) user.section = section.trim().toUpperCase();
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

    const updatedUser = await user.save();

    return sendSuccess(res, 'Profile updated successfully', {
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload student profile photo
 * @route   POST /api/auth/upload-avatar
 * @access  Private (Authenticated)
 */
const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 'Please provide an image file to upload as your profile photo', 400);
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return sendError(res, 'User record not found', 404);
    }

    // Set relative path to file served by Express static /uploads
    const relativeUrl = `/uploads/${req.file.filename}`;
    user.avatarUrl = relativeUrl;
    await user.save();

    return sendSuccess(res, 'Profile photo uploaded successfully', {
      user,
      avatarUrl: relativeUrl,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove student profile photo (revert to default)
 * @route   DELETE /api/auth/remove-avatar
 * @access  Private (Authenticated)
 */
const removeAvatar = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return sendError(res, 'User record not found', 404);
    }

    user.avatarUrl = '';
    await user.save();

    return sendSuccess(res, 'Profile photo removed successfully', {
      user,
      avatarUrl: '',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Change user password
 * @route   PUT /api/auth/change-password
 * @access  Private (Authenticated)
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return sendError(res, 'Please provide both current and new password', 400);
    }

    if (newPassword.length < 6) {
      return sendError(res, 'New password must be at least 6 characters in length', 400);
    }

    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return sendError(res, 'Current password verification failed', 400);
    }

    user.password = newPassword;
    await user.save();

    const token = generateToken(user);

    return sendSuccess(res, 'Password changed successfully', {
      token,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  uploadAvatar,
  removeAvatar,
  changePassword,
};

