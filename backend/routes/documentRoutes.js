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

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
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

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid file type'));
    }
    cb(null, true);
  }
});

// @route   POST api/documents/upload
// @desc    Upload document
// @access  Private
router.post('/upload', [
  auth,
  upload.single('file'),
  check('type', 'Document type is required').not().isEmpty(),
  check('description', 'Description is required').not().isEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: 'auto',
      folder: 'vehicle_documents'
    });

    // Delete local file
    fs.unlinkSync(req.file.path);

    const document = {
      type: req.body.type,
      url: result.secure_url,
      description: req.body.description,
      uploadedBy: req.user.id,
      publicId: result.public_id
    };

    res.status(201).json(document);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/documents
// @desc    Get all documents
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const documents = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'vehicle_documents/'
    });
    res.json(documents.resources);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE api/documents/:id
// @desc    Delete document
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    await cloudinary.uploader.destroy(req.params.id);
    res.json({ message: 'Document deleted' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/documents/search
// @desc    Search documents
// @access  Private
router.get('/search', auth, async (req, res) => {
  try {
    const { query } = req.query;
    const documents = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'vehicle_documents/',
      tags: query
    });
    res.json(documents.resources);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Protected routes - all authenticated users
router.get('/', protect, getDocuments);
router.get('/search', protect, searchDocuments);
router.get('/vehicle/:vehicleId', protect, getDocumentsByVehicle);
router.get('/type/:type', protect, getDocumentsByType);
router.get('/expiring', protect, getExpiringDocuments);
router.get('/:id', protect, getDocumentById);
router.get('/:id/versions', protect, getDocumentVersions);
router.post('/:id/access-log', protect, logDocumentAccess);

// Protected routes - officers, investigators, and admin
router.post('/', protect, authorize('officer', 'admin', 'investigator'), upload.single('document'), uploadDocument);
router.put('/:id', protect, authorize('officer', 'admin', 'investigator'), updateDocument);
router.delete('/:id', protect, authorize('admin'), deleteDocument);
router.post('/:id/replace', protect, authorize('officer', 'admin', 'investigator'), upload.single('document'), replaceDocument);
router.post('/:id/notes', protect, authorize('officer', 'admin', 'investigator'), addDocumentNote);

// Protected routes - specific roles only
router.put('/:id/verify', protect, authorize('admin', 'investigator'), verifyDocument);
router.post('/:id/watermark', protect, authorize('admin'), watermarkDocument);
router.post('/:id/sign', protect, authorize('admin'), signDocument);

module.exports = router; 