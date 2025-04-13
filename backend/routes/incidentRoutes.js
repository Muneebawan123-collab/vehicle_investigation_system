const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const auth = require('../middleware/auth');
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
  check('location.coordinates', 'Location coordinates are required').isArray({ min: 2, max: 2 }),
  check('dateTime', 'Valid date and time is required').isISO8601(),
  check('vehicle', 'Vehicle ID is required').isMongoId()
];

// @route   GET api/incidents
// @desc    Get all incidents
// @access  Private
router.get('/', auth, getAllIncidents);

// @route   GET api/incidents/:id
// @desc    Get incident by ID
// @access  Private
router.get('/:id', auth, getIncidentById);

// @route   POST api/incidents
// @desc    Create new incident
// @access  Private
router.post('/', [auth, incidentValidation], createIncident);

// @route   PUT api/incidents/:id
// @desc    Update incident
// @access  Private
router.put('/:id', [auth, incidentValidation], updateIncident);

// @route   DELETE api/incidents/:id
// @desc    Delete incident
// @access  Private
router.delete('/:id', auth, deleteIncident);

// @route   GET api/incidents/vehicle/:vehicleId
// @desc    Get incidents by vehicle ID
// @access  Private
router.get('/vehicle/:vehicleId', auth, getIncidentsByVehicle);

// @route   GET api/incidents/user/:userId
// @desc    Get incidents by user ID
// @access  Private
router.get('/user/:userId', auth, getIncidentsByUser);

module.exports = router; 