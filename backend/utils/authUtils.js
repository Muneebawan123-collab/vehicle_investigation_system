const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Generate random token for password reset
const generateResetToken = () => {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // Token expires in 10 minutes
  const resetExpires = Date.now() + 10 * 60 * 1000;
  
  return { resetToken, hashedToken, resetExpires };
};

// Hash a string (for tokens)
const hashString = (string) => {
  return crypto
    .createHash('sha256')
    .update(string)
    .digest('hex');
};

module.exports = {
  generateToken,
  generateResetToken,
  hashString
}; 