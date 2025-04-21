const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const { 
  uploadDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  getDocumentsByVehicle,
  getDocumentsByType,
  searchDocuments,
  verifyDocument,
  addDocumentNote,
  watermarkDocument,
  signDocument,
  getExpiringDocuments,
  logDocumentAccess,
  getDocumentVersions,
  replaceDocument
} = require('../controllers/documentController');
const { protect, authorize } = require('../middleware/authMiddleware');
const Document = require('../models/document');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Log Cloudinary configuration (without exposing secrets)
console.log('Cloudinary configuration loaded:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Not set',
  api_key: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Not set',
  api_secret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Not set'
});

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// Add a middleware to validate the incoming multipart request
const validateMultipart = (req, res, next) => {
  console.log('Validating multipart request');
  const contentType = req.headers['content-type'] || '';
  
  if (!contentType.includes('multipart/form-data')) {
    console.error('Error: Content-Type is not multipart/form-data');
    return res.status(400).json({
      success: false,
      message: 'Invalid request format',
      details: 'Content-Type must be multipart/form-data'
    });
  }
  
  console.log('Content-Type validation passed');
  next();
};

// Enhanced file filter function with better error handling
const fileFilter = (req, file, cb) => {
  console.log('File filter called with file:', file ? {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  } : 'No file');
  
  // Check if file exists and has required properties
  if (!file || !file.mimetype) {
    console.error('File filter error: Invalid or missing file object');
    return cb(new Error('Missing or invalid file'), false);
  }
  
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  
  if (!allowedTypes.includes(file.mimetype)) {
    console.error(`File type not allowed: ${file.mimetype}`);
    return cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`), false);
  }
  
  console.log('File passed validation filters');
  cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter
});

// Handle multer errors
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('Multer error:', err);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large',
        details: 'Maximum file size is 5MB'
      });
    }
    return res.status(400).json({
      success: false,
      message: 'File upload error',
      details: err.message
    });
  } else if (err) {
    console.error('Upload error:', err);
    return res.status(400).json({
      success: false,
      message: 'Upload error',
      details: err.message
    });
  }
  next();
};

// ROUTES CONFIGURATION

// Add a test endpoint for debugging upload issues - must be defined BEFORE other routes to avoid conflicts
router.post('/test-upload', (req, res, next) => {
  console.log('Test upload request received');
  console.log('Headers:', req.headers);
  console.log('Content type:', req.headers['content-type']);
  
  next();
}, upload.single('file'), handleMulterError, (req, res) => {
  try {
    console.log('Test upload endpoint processing');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    
    if (!req.file) {
      console.error('Test upload: No file found in request');
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded',
        details: 'The file field is missing in the request'
      });
    }
    
    // Log successful file receipt
    console.log('Test upload: File received successfully:', {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    });
    
    // Success response with file details
    res.status(200).json({
      success: true,
      message: 'File received successfully',
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      }
    });
    
    // Delete the file after sending response
    setTimeout(() => {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
        console.log('Test file deleted after successful test');
      }
    }, 5000);
    
  } catch (error) {
    console.error('Test upload error:', error);
    
    // Clean up if file exists
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
      console.log('Test file deleted after error');
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Server error during test upload',
      error: error.message
    });
  }
});

// POST routes - Create documents and related operations
// Add proper validation and authentication with better error handling
router.post('/', validateMultipart, (req, res, next) => {
  console.log('Document upload request received');
  console.log('Headers:', req.headers);
  console.log('Content type:', req.headers['content-type']);
  
  // Continue with auth check
  next();
}, protect, (req, res, next) => {
  // Role authorization with better error handling
  const allowedRoles = ['officer', 'admin', 'investigator'];
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Permission denied',
      details: `Required role: ${allowedRoles.join(', ')}. Your role: ${req.user?.role || 'none'}`
    });
  }
  
  // Continue to file upload middleware
  next();
}, upload.single('file'), handleMulterError, uploadDocument);

// GET routes - Read operations
router.get('/', protect, getDocuments);
router.get('/vehicle/:vehicleId', protect, getDocumentsByVehicle);
router.get('/type/:type', protect, getDocumentsByType);
router.get('/search', protect, searchDocuments);
router.get('/expiring', protect, getExpiringDocuments);
router.get('/:id/versions', protect, getDocumentVersions);
router.get('/:id', protect, getDocumentById);

// PUT routes - Update operations (admin only)
router.put('/:id', protect, authorize('admin'), updateDocument);
router.put('/:id/verify', protect, authorize('admin'), verifyDocument);

// POST routes - Other operations
router.post('/:id/notes', protect, addDocumentNote);
router.post('/:id/access-log', protect, logDocumentAccess);

// POST routes - Special operations (admin only)
router.post('/:id/watermark', protect, authorize('admin'), watermarkDocument);
router.post('/:id/sign', protect, authorize('admin'), signDocument);
router.post('/:id/replace', protect, authorize('admin'), upload.single('file'), handleMulterError, replaceDocument);

// DELETE routes - Delete operations (admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const documentId = req.params.id;
    console.log('Delete request received for document:', documentId);
    
    // Find the document in MongoDB
    const document = await Document.findOne({
      $or: [
        { _id: documentId },
        { publicId: documentId },
        { publicId: `vehicle_documents/${documentId}` }
      ]
    });

    if (!document) {
      console.log('Document not found:', documentId);
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    console.log('Found document:', {
      id: document._id,
      publicId: document.publicId,
      name: document.name
    });

    // Delete from Cloudinary if publicId exists
    if (document.publicId) {
      try {
        console.log('Attempting to delete from Cloudinary:', document.publicId);
        await cloudinary.uploader.destroy(document.publicId);
        console.log('Successfully deleted from Cloudinary');
      } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
        // Continue with document deletion even if Cloudinary fails
      }
    }

    // Delete document from database
    await Document.findByIdAndDelete(document._id);
    console.log('Successfully deleted from MongoDB');

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting document',
      error: error.message
    });
  }
});

// Download route
router.get('/:id/download', protect, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    res.json({
      success: true,
      data: {
        url: document.url
      }
    });
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading document',
      error: error.message
    });
  }
});

module.exports = router; 