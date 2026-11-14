const { sendError } = require('../utils/apiResponse');

/**
 * Role-Based Access Control (RBAC) Middleware
 * Restricts endpoint access to specific user roles
 * Usage: authorize('admin'), authorize('admin', 'faculty')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'User session not initialized. Please authenticate first', 401);
    }

    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        `Forbidden: Role '${req.user.role}' is not authorized to access this resource. Required role(s): [${roles.join(', ')}]`,
        403
      );
    }

    next();
  };
};

module.exports = {
  authorize,
};

