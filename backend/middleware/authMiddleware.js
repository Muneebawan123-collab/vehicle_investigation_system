const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

// Protect routes
const protect = async (req, res, next) => {
  let token;

  try {
    console.log('Auth middleware - Headers:', {
      authorization: req.headers.authorization ? 'Present' : 'Not present',
      contentType: req.headers['content-type']
    });

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      console.log('Token extracted:', token ? 'Present' : 'Not present');

      try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token verification result:', {
          userId: decoded.id,
          role: decoded.role,
          exp: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'Not present'
        });

        // Get user from token
        const user = await User.findById(decoded.id).select('-password');

        // If user not found
        if (!user) {
          logger.warn(`User not found with ID: ${decoded.id}`);
          return res.status(401).json({ message: 'Not authorized, user not found' });
        }

        // Add user to request object
        req.user = user;
        console.log('User authorized:', {
          id: user._id,
          role: user.role,
          name: user.name
        });
        next();
      } catch (error) {
        console.error('Token verification error:', error);
        if (error.name === 'JsonWebTokenError') {
          return res.status(401).json({ message: 'Not authorized, invalid token' });
        }
        if (error.name === 'TokenExpiredError') {
          return res.status(401).json({ message: 'Not authorized, token expired' });
        }
        throw error;
      }
    } else {
      logger.warn('No authentication token provided');
      return res.status(401).json({ message: 'Not authorized, no token' });
    }
  } catch (error) {
    logger.error(`Authentication error: ${error.message}`);
    return res.status(401).json({ message: 'Not authorized, token failed' });
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