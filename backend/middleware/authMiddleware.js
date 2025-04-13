const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

// Protect routes
const protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      // If user not found
      if (!req.user) {
        logger.warn(`User not found with ID: ${decoded.id}`);
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      next();
    } catch (error) {
      logger.error(`Authentication error: ${error.message}`);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    logger.warn('No authentication token provided');
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Check user roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      logger.warn(`User ${req.user._id} with role ${req.user.role} attempted to access restricted resource`);
      return res.status(403).json({ message: `User role ${req.user.role} is not authorized to access this resource` });
    }
    next();
  };
};

module.exports = { protect, authorize }; 