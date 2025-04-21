const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Set storage engine for local uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate a unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

// Check file type
const fileFilter = (req, file, cb) => {
  // Log file information
  console.log('Processing file:', {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype
  });

  // Allowed file types
  const fileTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
  // Check extension
  const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime type
  const mimetype = fileTypes.test(file.mimetype);

  if (mimetype && extname) {
    console.log('File type validation passed');
    return cb(null, true);
  } else {
    console.log('File type validation failed');
    cb(new Error('Error: Only images, PDFs, and documents are allowed!'));
  }
};

// Initialize upload with error handling
const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB max size
    files: 1 // Maximum number of files
  },
  fileFilter: fileFilter
}).fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'file', maxCount: 1 }
]);

// Wrapper function to handle multer errors
const uploadMiddleware = (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error('Multer error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File too large',
          error: 'Maximum file size is 10MB'
        });
      }
      return res.status(400).json({
        success: false,
        message: 'File upload error',
        error: err.message
      });
    } else if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({
        success: false,
        message: 'Upload error',
        error: err.message
      });
    }
    next();
  });
};

module.exports = uploadMiddleware; 