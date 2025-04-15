const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const auth = require('../middleware/auth');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getAllIncidents,
  getIncidentById,
  createIncident,
  updateIncident,
  deleteIncident,
  getIncidentsByVehicle,
  getIncidentsByUser
} = require('../controllers/incidentController');

// Validation middleware
const incidentValidation = [
  check('title', 'Title is required').not().isEmpty(),
  check('description', 'Description is required').not().isEmpty(),
  check('incidentType', 'Valid incident type is required').isIn(['accident', 'theft', 'vandalism', 'other']),
  check('severity', 'Valid severity is required').isIn(['low', 'medium', 'high', 'critical']),
  check('location', 'Location is required').not().isEmpty(),
  check('vehicle', 'Vehicle ID is required').isMongoId()
];

// Less strict validation for updates
const updateIncidentValidation = [
  check('title', 'Title is required if provided').optional().not().isEmpty(),
  check('description', 'Description is required if provided').optional().not().isEmpty(),
  check('incidentType', 'Valid incident type is required if provided')
    .optional()
    .isIn(['accident', 'theft', 'vandalism', 'other']),
  check('severity', 'Valid severity is required if provided')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical']),
  check('vehicle', 'Valid Vehicle ID is required if provided')
    .optional()
    .isMongoId(),
  check('status', 'Valid status is required if provided')
    .optional()
    .isIn(['Open', 'In Progress', 'Resolved', 'Closed'])
];

// @route   GET api/incidents
// @desc    Get all incidents
// @access  Private (All authenticated users)
router.get('/', protect, getAllIncidents);

// Special routes - must come before :id route to avoid conflicts
// @route   GET api/incidents/vehicle/:vehicleId
// @desc    Get incidents by vehicle ID
// @access  Private (All authenticated users)
router.get('/vehicle/:vehicleId', protect, getIncidentsByVehicle);

// @route   GET api/incidents/user/:userId
// @desc    Get incidents by user ID
// @access  Private (All authenticated users)
router.get('/user/:userId', protect, getIncidentsByUser);

// @route   POST api/incidents
// @desc    Create new incident
// @access  Private (All authenticated users can create)
router.post('/', [protect, incidentValidation], createIncident);

// ID-specific routes
// @route   GET api/incidents/:id
// @desc    Get incident by ID
// @access  Private (All authenticated users)
router.get('/:id', protect, getIncidentById);

// @route   PUT api/incidents/:id
// @desc    Update incident
// @access  Private (Admin only)
router.put('/:id', [
  protect, 
  authorize('admin'), 
  updateIncidentValidation
], updateIncident);

// @route   DELETE api/incidents/:id
// @desc    Delete incident
// @access  Private (Admin only)
router.delete('/:id', [protect, authorize('admin')], deleteIncident);

module.exports = router; 