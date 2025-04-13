const logger = require('../utils/logger');

// Error handler for 404 - Not Found
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  logger.warn(`404 Not Found: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Custom error handler
const errorHandler = (err, req, res, next) => {
  // Set status code (use 500 if somehow the status is 200 OK)
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  // Log the error
  if (statusCode >= 500) {
    logger.error(`Server Error: ${err.message}\n${err.stack}`);
  } else {
    logger.warn(`Client Error: ${err.message}`);
  }
  
  // Send error response
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    errors: err.errors || null
  });
};

// Mongoose validation error handler
const mongooseValidationError = (err, req, res, next) => {
  if (err.name === 'ValidationError') {
    const errors = {};
    
    // Extract all validation errors
    Object.keys(err.errors).forEach(key => {
      errors[key] = err.errors[key].message;
    });
    
    logger.warn(`Validation Error: ${JSON.stringify(errors)}`);
    
    return res.status(400).json({
      message: 'Validation failed',
      errors
    });
  }
  
  // Pass to the next error handler if not a validation error
  next(err);
};

// Handle duplicate key errors
const duplicateKeyError = (err, req, res, next) => {
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    
    logger.warn(`Duplicate Key Error: ${field}=${value}`);
    
    return res.status(409).json({
      message: `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' already exists`,
      errors: {
        [field]: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
      }
    });
  }
  
  // Pass to the next error handler
  next(err);
};

module.exports = {
  notFound,
  errorHandler,
  mongooseValidationError,
  duplicateKeyError
}; 