const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const logger = require('./logger');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'Set',
  api_key: process.env.CLOUDINARY_API_KEY || 'Set',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'Set'
});

// Configure storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'vehicle_investigation',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
  }
});

// Create multer upload middleware
const upload = multer({ storage: storage });

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

// Get secure download URL from Cloudinary
const getSecureDownloadUrl = async (publicId) => {
  try {
    // Generate a signed URL with short expiration
    const options = {
      resource_type: 'raw',
      type: 'private',
      expires_at: Math.floor(Date.now() / 1000) + 300, // 5 minutes expiration
      attachment: true // Force download
    };

    const url = cloudinary.utils.private_download_url(publicId, '', options);
    return url;
  } catch (error) {
    console.error('Error generating secure download URL:', error);
    throw error;
  }
};

module.exports = {
  cloudinary,
  upload,
  testCloudinaryConnection,
  getSecureDownloadUrl
}; 