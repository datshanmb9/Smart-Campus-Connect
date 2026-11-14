const jwt = require('jsonwebtoken');

/**
 * Generate Signed JSON Web Token (JWT)
 * Payload contains user ID, role and email
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    },
    process.env.JWT_SECRET || 'smart_campus_connect_fallback_secret_2026',
    {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    }
  );
};

module.exports = generateToken;

