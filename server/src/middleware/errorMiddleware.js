const { sendError } = require('../utils/apiResponse');

/**
 * 404 Route Not Found Middleware
 */
const notFound = (req, res, next) => {
  const error = new Error(`Resource Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Centralized Global Error Handler Middleware
 * Normalizes Mongoose errors, CastErrors, and syntax issues
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';
  let errors = null;

  // Handle Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    message = `Invalid format for resource identifier: ${err.value}`;
    statusCode = 400;
  }

  // Handle Mongoose Duplicate Key Error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    message = `A record with this ${field} already exists: '${err.keyValue[field]}'`;
    statusCode = 400;
  }

  // Handle Mongoose Validation Errors
  if (err.name === 'ValidationError') {
    message = 'Validation Error';
    statusCode = 400;
    errors = Object.values(err.errors).map((val) => val.message);
  }

  // Handle JSON Web Token Malformed / Signature Errors
  if (err.name === 'JsonWebTokenError') {
    message = 'Invalid authentication token';
    statusCode = 401;
  }

  console.error(`[API Error] ${req.method} ${req.originalUrl}:`, err.stack || err.message);

  return sendError(res, message, statusCode, errors);
};

module.exports = {
  notFound,
  errorHandler,
};

