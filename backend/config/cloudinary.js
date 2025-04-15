const cloudinary = require('cloudinary').v2;
const logger = require('./logger');

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Log configuration
console.log('Cloudinary configuration loaded:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Not set',
  api_key: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Not set',
  api_secret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Not set'
});

// Test the Cloudinary connection
const testCloudinaryConnection = async () => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || 
      !process.env.CLOUDINARY_API_KEY || 
      !process.env.CLOUDINARY_API_SECRET) {
    logger.warn('Cloudinary environment variables not set. File upload functionality will be limited.');
    return;
  }
  
  try {
    const result = await cloudinary.api.ping();
    logger.info('Cloudinary connection test successful');
  } catch (error) {
    logger.error('Cloudinary connection test failed:', error);
  }
};

module.exports = { cloudinary, testCloudinaryConnection }; 