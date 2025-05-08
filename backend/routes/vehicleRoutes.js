const express = require('express');
const router = express.Router();
const { 
  registerVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  uploadVehicleImages,
  setMainVehicleImage,
  removeVehicleImage,
  searchVehicles,
  updateVehicleLocation,
  addVehicleNote,
  getVehicleNotes,
  addVehicleFlag,
  resolveVehicleFlag,
  getVehicleFlags,
  checkDuplicateVIN,
  checkVehicleCompliance,
  getVehiclesByOwner,
  getVehiclesByStatus,
  updateComplianceDetails,
  generateQRCode,
  getQRCodeImage,
  getVehicleDetailsFromQR
} = require('../controllers/vehicleController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');
const { check, validationResult } = require('express-validator');
const Vehicle = require('../models/Vehicle');

// Public QR code scan endpoint (no auth required)
router.get('/scan/:id', getVehicleDetailsFromQR);

// Search and filter routes - must come before :id routes to avoid conflicts
router.get('/search', protect, searchVehicles);
router.get('/owner/:name', protect, getVehiclesByOwner);
router.get('/status/:status', protect, getVehiclesByStatus);
router.post('/check-vin', protect, checkDuplicateVIN);

// Base routes
router.get('/', protect, getVehicles);
router.post('/', protect, authorize('officer', 'admin', 'investigator'), registerVehicle);
router.post('/register', protect, authorize('officer', 'admin', 'investigator'), registerVehicle);

// ID specific routes
router.get('/:id', protect, getVehicleById);
router.put('/:id', protect, authorize('officer', 'admin', 'investigator'), updateVehicle);
router.delete('/:id', protect, authorize('admin'), deleteVehicle);

// Additional features
router.get('/notes/:id', protect, getVehicleNotes);
router.post('/notes/:id', protect, authorize('officer', 'admin', 'investigator'), addVehicleNote);
router.get('/flags/:id', protect, getVehicleFlags);
router.post('/flags/:id', protect, authorize('officer', 'admin', 'investigator'), addVehicleFlag);
router.put('/flags/:id/:flagId', protect, authorize('officer', 'admin', 'investigator'), resolveVehicleFlag);
router.get('/compliance-check/:id', protect, checkVehicleCompliance);
router.put('/compliance/:id', protect, authorize('officer', 'admin', 'investigator'), updateComplianceDetails);
router.put('/location/:id', protect, authorize('officer', 'admin', 'investigator'), updateVehicleLocation);

// Image routes
router.post('/images/:id', protect, authorize('officer', 'admin', 'investigator'), upload.array('images', 5), async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Add new images to the vehicle
    const newImages = req.files.map(file => ({
      url: file.path,
      publicId: file.filename
    }));

    vehicle.images = [...vehicle.images, ...newImages];
    await vehicle.save();

    res.json({
      success: true,
      data: vehicle.images,
      message: 'Images uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading images',
      error: error.message
    });
  }
});
router.put('/main-image/:id', protect, authorize('officer', 'admin', 'investigator'), setMainVehicleImage);
router.delete('/images/:id/:imageId', protect, authorize('officer', 'admin', 'investigator'), removeVehicleImage);

// QR code routes
router.get('/qrcode/:id', protect, generateQRCode);
router.get('/qrcode-image/:id', protect, getQRCodeImage);

module.exports = router; 