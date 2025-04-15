const Incident = require('../models/Incident');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Get all incidents
exports.getAllIncidents = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Query parameters
    const query = {};
    if (req.query.type) query.incidentType = req.query.type;
    if (req.query.status) query.status = req.query.status;
    if (req.query.severity) query.severity = req.query.severity;
    if (req.query.vehicle) query.vehicle = req.query.vehicle;

    // If user is not admin, only show incidents they reported
    if (req.user.role !== 'admin' && req.user.role !== 'investigator') {
      query.reportedBy = req.user._id;
    }

    const incidents = await Incident.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('vehicle', 'registrationNumber licensePlate make model')
      .populate('reportedBy', 'name');

    const total = await Incident.countDocuments(query);

    // Return just the incidents array for easier frontend consumption
    res.json(incidents);
  } catch (error) {
    logger.error(`Error getting incidents: ${error.message}`);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Get incident by ID
exports.getIncidentById = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate('vehicle', 'registrationNumber licensePlate make model')
      .populate('reportedBy', 'name');

    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    // Check permission - admin, investigator or the user who reported it
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'investigator' &&
      incident.reportedBy._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized to view this incident' });
    }

    res.json(incident);
  } catch (error) {
    logger.error(`Error getting incident: ${error.message}`);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Create new incident
exports.createIncident = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      incidentType,
      severity,
      dateTime,
      location,
      vehicle,
      witnesses,
      policeReportNumber,
      status
    } = req.body;

    // Format location data correctly
    let formattedLocation;
    if (!location) {
      return res.status(400).json({ 
        errors: [{ param: 'location', msg: 'Location is required' }] 
      });
    } else if (typeof location === 'string') {
      formattedLocation = {
        type: 'Point',
        coordinates: [0, 0], // Default coordinates
        address: location
      };
    } else if (typeof location === 'object') {
      formattedLocation = {
        type: location.type || 'Point',
        coordinates: location.coordinates || [0, 0],
        address: location.address || 'Unknown location'
      };
    }

    // Check if the vehicle exists
    const vehicleExists = await mongoose.model('Vehicle').findById(vehicle);
    if (!vehicleExists) {
      return res.status(400).json({ 
        errors: [{ param: 'vehicle', msg: 'Selected vehicle does not exist' }] 
      });
    }

    const incident = new Incident({
      title,
      description,
      incidentType,
      severity,
      dateTime: dateTime || Date.now(),
      location: formattedLocation,
      vehicle,
      reportedBy: req.user._id,
      witnesses: witnesses || [],
      policeReportNumber: policeReportNumber || '',
      status: status || 'Open'
    });

    const savedIncident = await incident.save();
    logger.info(`New incident created: ${savedIncident._id} by user ${req.user._id}`);
    
    res.status(201).json(savedIncident);
  } catch (error) {
    logger.error(`Error creating incident: ${error.message}`);
    
    // Send more specific error messages based on error type
    if (error.name === 'ValidationError') {
      const errors = Object.keys(error.errors).map(field => ({
        param: field,
        msg: error.errors[field].message
      }));
      return res.status(400).json({ errors });
    } else if (error.name === 'CastError') {
      return res.status(400).json({ 
        errors: [{ param: error.path, msg: 'Invalid format' }] 
      });
    }
    
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Update incident
exports.updateIncident = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Find the incident to update
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    // Check permission - admin, investigator or the user who reported it
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'investigator' &&
      incident.reportedBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized to update this incident' });
    }

    // Parse and validate location data if it's provided
    if (req.body.location) {
      // If location is a string, convert it to an object
      if (typeof req.body.location === 'string') {
        req.body.location = {
          type: 'Point',
          coordinates: [0, 0],
          address: req.body.location
        };
      } else if (typeof req.body.location === 'object') {
        // Ensure proper type and coordinates if object is provided
        req.body.location.type = req.body.location.type || 'Point';
        req.body.location.coordinates = req.body.location.coordinates || [0, 0];
      }
    }

    // Check if the vehicle exists if it's being updated
    if (req.body.vehicle) {
      const vehicleExists = await mongoose.model('Vehicle').findById(req.body.vehicle);
      if (!vehicleExists) {
        return res.status(400).json({ 
          errors: [{ param: 'vehicle', msg: 'Selected vehicle does not exist' }] 
        });
      }
    }

    // Update fields
    const updatedIncident = await Incident.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('vehicle', 'registrationNumber licensePlate make model')
      .populate('reportedBy', 'name');

    logger.info(`Incident updated: ${updatedIncident._id} by user ${req.user._id}`);
    res.json(updatedIncident);
  } catch (error) {
    logger.error(`Error updating incident: ${error.message}`);
    
    // Handle specific error types
    if (error.name === 'ValidationError') {
      const errors = Object.keys(error.errors).map(field => ({
        param: field,
        msg: error.errors[field].message
      }));
      return res.status(400).json({ errors });
    } else if (error.name === 'CastError') {
      return res.status(400).json({ 
        errors: [{ param: error.path, msg: 'Invalid format' }] 
      });
    }
    
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Delete incident
exports.deleteIncident = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    // Only admin or the user who reported it can delete
    if (
      req.user.role !== 'admin' &&
      incident.reportedBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized to delete this incident' });
    }

    await Incident.findByIdAndDelete(req.params.id);
    logger.info(`Incident deleted: ${req.params.id} by user ${req.user._id}`);
    
    res.json({ message: 'Incident deleted' });
  } catch (error) {
    logger.error(`Error deleting incident: ${error.message}`);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Get incidents by vehicle ID
exports.getIncidentsByVehicle = async (req, res) => {
  try {
    const incidents = await Incident.find({ vehicle: req.params.vehicleId })
      .sort({ createdAt: -1 })
      .populate('reportedBy', 'name');

    res.json(incidents);
  } catch (error) {
    logger.error(`Error getting incidents by vehicle: ${error.message}`);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Get incidents by user ID
exports.getIncidentsByUser = async (req, res) => {
  try {
    // Only admin can see other user's incidents
    if (req.user.role !== 'admin' && req.params.userId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view these incidents' });
    }

    const incidents = await Incident.find({ reportedBy: req.params.userId })
      .sort({ createdAt: -1 })
      .populate('vehicle', 'registrationNumber licensePlate make model');

    res.json(incidents);
  } catch (error) {
    logger.error(`Error getting incidents by user: ${error.message}`);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
}; 