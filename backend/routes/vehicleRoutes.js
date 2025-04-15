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
  updateComplianceDetails
} = require('../controllers/vehicleController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../utils/multerConfig');
const { check, validationResult } = require('express-validator');

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
router.get('/:id/notes', protect, getVehicleNotes);
router.post('/:id/notes', protect, authorize('officer', 'admin', 'investigator'), addVehicleNote);
router.get('/:id/flags', protect, getVehicleFlags);
router.post('/:id/flags', protect, authorize('officer', 'admin', 'investigator'), addVehicleFlag);
router.put('/:id/flags/:flagId/resolve', protect, authorize('officer', 'admin', 'investigator'), resolveVehicleFlag);
router.get('/:id/compliance-check', protect, checkVehicleCompliance);
router.put('/:id/compliance', protect, authorize('officer', 'admin', 'investigator'), updateComplianceDetails);
router.put('/:id/location', protect, authorize('officer', 'admin', 'investigator'), updateVehicleLocation);

// Image routes
router.post('/:id/images', protect, authorize('officer', 'admin', 'investigator'), upload.array('images'), uploadVehicleImages);
router.put('/:id/main-image', protect, authorize('officer', 'admin', 'investigator'), setMainVehicleImage);
router.delete('/:id/images/:imageId', protect, authorize('officer', 'admin', 'investigator'), removeVehicleImage);

module.exports = router; 