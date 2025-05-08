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
  getIncidentsByUser,
  assignIncident,
  submitInvestigationReport,
  reviewInvestigationReport
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
    .isIn(['accident', 'theft', 'vandalism', 'traffic_violation', 'dui', 'abandoned', 'suspicious_activity', 'other']),
  check('severity', 'Valid severity is required if provided')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical']),
  check('vehicle', 'Valid Vehicle ID is required if provided')
    .optional()
    .isMongoId(),
  check('status', 'Valid status is required if provided')
    .optional()
    .isIn(['open', 'under_investigation', 'pending', 'closed', 'reopened'])
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

// New Routes for the Incident Workflow

// @route   POST api/incidents/assign/:id
// @desc    Assign incident to investigator (Admin only)
// @access  Private (Admin only)
router.post('/assign/:id', [
  protect, 
  authorize('admin'),
  check('investigatorId', 'Investigator ID is required').isMongoId(),
  check('priority', 'Valid priority is required if provided')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
], assignIncident);

// @route   POST api/incidents/report/:id
// @desc    Submit investigation report (Investigator only)
// @access  Private (Investigator only)
router.post('/report/:id', [
  protect, 
  authorize('investigator'),
  check('findings', 'Findings are required').not().isEmpty(),
  check('recommendations', 'Recommendations are required').not().isEmpty(),
  check('conclusion', 'Valid conclusion is required')
    .isIn(['substantiated', 'unsubstantiated', 'inconclusive']),
  check('reportContent', 'Report content is required').not().isEmpty()
], submitInvestigationReport);

// @route   POST api/incidents/review/:id
// @desc    Review investigation report (Officer only)
// @access  Private (Officer only)
router.post('/review/:id', [
  protect, 
  authorize('officer'),
  check('actions', 'Actions are required').not().isEmpty(),
  check('reportStatus', 'Valid report status is required')
    .isIn(['approved', 'rejected']),
  check('conclusion', 'Valid conclusion is required if provided')
    .optional()
    .isIn(['confirmed', 'additional_investigation', 'case_dismissed', 'legal_action', 'other'])
], reviewInvestigationReport);

module.exports = router; 