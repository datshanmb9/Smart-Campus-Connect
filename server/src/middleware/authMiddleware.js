const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendError } = require('../utils/apiResponse');

/**
 * Protect Routes Middleware
 * Validates the Bearer JWT token from the Authorization header
 * Attaches the authenticated user document to req.user
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'smart_campus_connect_fallback_secret_2026'
      );

      // Fetch user from database excluding password
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return sendError(res, 'User belonging to this token no longer exists', 401);
      }

      if (!user.isActive) {
        return sendError(res, 'User account has been deactivated. Please contact campus admin', 403);
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('JWT Authentication Error:', error.message);
      if (error.name === 'TokenExpiredError') {
        return sendError(res, 'Authentication token has expired. Please log in again', 401);
      }
      return sendError(res, 'Invalid authentication token', 401);
    }
  }

  if (!token) {
    return sendError(res, 'Not authorized. No Bearer token provided in header', 401);
  }
};

module.exports = {
  protect,
};

