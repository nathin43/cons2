const jwt = require('jsonwebtoken');

/**
 * Generate JWT Token
 * @param {string} id - User or Admin ID
 * @param {string} role - Optional: User/Admin role (for admin tokens)
 * @returns {string} JWT token
 */
const generateToken = (id, role = null) => {
  const payload = { id };
  if (role) {
    payload.role = role;
  }
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

module.exports = generateToken;
