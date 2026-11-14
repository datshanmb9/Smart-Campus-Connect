/**
 * Standardized API Response Utilities
 * Provides consistent JSON structure across all endpoints:
 * Success: { success: true, message: string, data: object/array }
 * Error:   { success: false, message: string, errors: array/object }
 */

const sendSuccess = (res, message = 'Success', data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const sendError = (res, message = 'An error occurred', statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

module.exports = {
  sendSuccess,
  sendError,
};

