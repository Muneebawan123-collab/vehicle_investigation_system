const Incident = require('../models/incidentModel');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const { notifyAdmins } = require('../utils/notificationUtils');

// Get all incidents
exports.getAllIncidents = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Query parameters
    const query = {};
    if (req.query.type) query.type = req.query.type;
    if (req.query.status) query.status = req.query.status;
    if (req.query.severity) query.severity = req.query.severity;
    if (req.query.vehicle) {
      // Search in both places to ensure compatibility
      query.$or = [
        { 'vehicles.vehicle': req.query.vehicle },
        { vehicle: req.query.vehicle }
      ];
    }

    // If user is not admin, only show incidents they reported
    if (req.user.role !== 'admin' && req.user.role !== 'investigator') {
      query.reportedBy = req.user._id;
    }

    const incidents = await Incident.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('vehicles.vehicle', 'registrationNumber licensePlate make model year color')
      .populate('vehicle', 'registrationNumber licensePlate make model year color')
      .populate('reportedBy', 'name email role');

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

    // Create vehicle object for the vehicles array
    const vehicleObject = {
      vehicle: vehicle,
      involvement: 'victim', // Default involvement
      details: 'Primary vehicle involved in incident'
    };

    // Get a new unique incident number
    const incidentCount = await Incident.countDocuments();
    const incidentNumber = `INC-${(incidentCount + 1).toString().padStart(6, '0')}`;

    const incident = new Incident({
      incidentNumber,
      title,
      description,
      type: incidentType || 'other', // Map incidentType to type field
      severity,
      date: dateTime ? new Date(dateTime) : new Date(),
      time: dateTime ? new Date(dateTime).toLocaleTimeString() : new Date().toLocaleTimeString(),
      location: formattedLocation,
      // Add vehicle to vehicles array instead of single vehicle field
      vehicles: [vehicleObject],
      reportedBy: req.user._id,
      witnesses: witnesses || [],
      status: status || 'open'
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

    // Create timeline entry if status is being updated
    if (req.body.status && req.body.status !== incident.status) {
      if (!incident.timeline) {
        incident.timeline = [];
      }
      incident.timeline.push({
        date: new Date(),
        action: 'Status Updated',
        description: `Status changed from ${incident.status || 'none'} to ${req.body.status} by ${req.user.name || req.user.email}`,
        performedBy: req.user._id
      });
    }

    // Prepare update data
    const updateData = {
      ...req.body
    };

    // If timeline was modified, add it to the update
    if (incident.timeline) {
      updateData.timeline = incident.timeline;
    }

    // Update fields using findByIdAndUpdate
    const updatedIncident = await Incident.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { 
        new: true, 
        runValidators: true 
      }
    ).populate('vehicle', 'registrationNumber licensePlate make model')
     .populate('reportedBy', 'name email')
     .populate('assignedTo', 'name email role');

    logger.info(`Incident updated: ${updatedIncident._id} by user ${req.user._id}`);
    res.json(updatedIncident);
  } catch (error) {
    logger.error(`Error updating incident: ${error.message}`);
    logger.error(error.stack);
    
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
    
    res.status(500).json({ 
      message: 'Server Error', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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
    // Search in both places to ensure compatibility
    const query = {
      $or: [
        { 'vehicles.vehicle': req.params.vehicleId },
        { vehicle: req.params.vehicleId }
      ]
    };
    
    const incidents = await Incident.find(query)
      .sort({ createdAt: -1 })
      .populate({
        path: 'vehicles.vehicle',
        select: 'registrationNumber licensePlate make model year color'
      })
      .populate({
        path: 'vehicle', 
        select: 'registrationNumber licensePlate make model year color'
      })
      .populate({
        path: 'reportedBy',
        select: 'name email role'
      });
    
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
      .populate({
        path: 'vehicles.vehicle',
        select: 'registrationNumber licensePlate make model year color'
      })
      .populate({
        path: 'vehicle', 
        select: 'registrationNumber licensePlate make model year color'
      });
    
    res.json(incidents);
  } catch (error) {
    logger.error(`Error getting incidents by user: ${error.message}`);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Assign incident to investigator (Admin only)
exports.assignIncident = async (req, res) => {
  try {
    // Validate admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only administrators can assign incidents' });
    }

    const { investigatorId, priority } = req.body;
    if (!investigatorId) {
      return res.status(400).json({ message: 'Investigator ID is required' });
    }

    // Verify the investigator exists and has the investigator role
    const investigator = await mongoose.model('User').findById(investigatorId);
    if (!investigator) {
      return res.status(404).json({ message: 'Investigator not found' });
    }
    
    if (investigator.role !== 'investigator') {
      return res.status(400).json({ message: 'Selected user is not an investigator' });
    }

    // Get the incident with all necessary fields
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    // Create a clone of the incident so the original document is not modified yet
    // This prevents validation errors for required fields that might be missing in the update
    const updatedFields = {
      status: 'under_investigation',
      assignedTo: investigatorId,
      assignedBy: req.user._id
    };

    // Initialize or update case file
    if (!incident.caseFile) {
      updatedFields.caseFile = {
        status: 'assigned',
        assignedInvestigator: investigatorId,
        investigationStartDate: new Date(),
        priority: priority || 'medium'
      };
    } else {
      updatedFields['caseFile.status'] = 'assigned';
      updatedFields['caseFile.assignedInvestigator'] = investigatorId;
      updatedFields['caseFile.investigationStartDate'] = new Date();
      updatedFields['caseFile.priority'] = priority || incident.caseFile.priority || 'medium';
    }

    // Initialize timeline array if it doesn't exist
    if (!incident.timeline) {
      incident.timeline = [];
    }

    // Add to timeline using findByIdAndUpdate to avoid validation errors
    const timelineEntry = {
      date: new Date(),
      action: 'Assigned to Investigator',
      description: `Incident assigned to investigator ${investigator.name || investigator.email}`,
      performedBy: req.user._id
    };

    // Update the incident using findByIdAndUpdate which bypasses validation
    const updatedIncident = await Incident.findByIdAndUpdate(
      req.params.id,
      { 
        $set: updatedFields,
        $push: { timeline: timelineEntry }
      },
      { new: true, runValidators: false }
    ).populate('vehicles.vehicle', 'registrationNumber licensePlate make model')
     .populate('vehicle', 'registrationNumber licensePlate make model')
     .populate('reportedBy', 'name email')
     .populate('assignedTo', 'name email role');
    
    logger.info(`Incident ${incident._id} assigned to investigator ${investigatorId} by admin ${req.user._id}`);
    
    res.json({
      success: true,
      message: 'Incident assigned successfully',
      incident: updatedIncident
    });
  } catch (error) {
    logger.error(`Error assigning incident: ${error.message}`);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Submit investigation report (Investigator only)
exports.submitInvestigationReport = async (req, res) => {
  try {
    // Validate investigator role
    if (req.user.role !== 'investigator') {
      return res.status(403).json({ message: 'Only investigators can submit reports' });
    }

    const { 
      findings, 
      recommendations, 
      conclusion,
      reportContent,
      attachments 
    } = req.body;
    
    if (!findings || !recommendations || !conclusion || !reportContent) {
      return res.status(400).json({ 
        message: 'Findings, recommendations, conclusion, and report content are required' 
      });
    }

    // Get the incident
    const incident = await Incident.findById(req.params.id)
      .populate('vehicle', 'registrationNumber licensePlate make model')
      .populate('reportedBy', 'name email');
      
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    // Verify this investigator is assigned to this incident
    if (!incident.assignedTo || incident.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not assigned to this incident' });
    }

    // Prepare the update object
    const updateData = {
      status: 'pending',
      caseFile: {
        status: 'report_submitted',
        assignedInvestigator: req.user._id,
        investigationStartDate: incident.caseFile?.investigationStartDate || new Date(),
        investigationEndDate: new Date(),
        findings: findings,
        recommendations: recommendations,
        conclusion: conclusion,
        investigationReport: {
          submittedBy: req.user._id,
          submittedAt: new Date(),
          content: reportContent,
          attachments: attachments || [],
          status: 'submitted'
        }
      }
    };

    // Add timeline entry
    const timelineEntry = {
      date: new Date(),
      action: 'Investigation Report Submitted',
      description: `Investigation report submitted by ${req.user.name || req.user.email}`,
      performedBy: req.user._id
    };

    // Update the incident using findByIdAndUpdate
    const updatedIncident = await Incident.findByIdAndUpdate(
      req.params.id,
      { 
        $set: updateData,
        $push: { timeline: timelineEntry }
      },
      { 
        new: true,
        runValidators: false // Disable validation for this update
      }
    ).populate('vehicle', 'registrationNumber licensePlate make model')
     .populate('reportedBy', 'name email')
     .populate('assignedTo', 'name email role');
    
    // Notify all admins about the new investigation report
    const vehicleInfo = updatedIncident.vehicle ? 
      `${updatedIncident.vehicle.make} ${updatedIncident.vehicle.model} (${updatedIncident.vehicle.licensePlate})` : 
      'Unknown vehicle';
      
    await notifyAdmins(
      'Investigation Report Submitted',
      `A new investigation report has been submitted for incident "${updatedIncident.title}" involving ${vehicleInfo} by ${req.user.name || req.user.email}`,
      'info',
      'incident',
      updatedIncident._id,
      true
    );
    
    logger.info(`Investigation report submitted for incident ${updatedIncident._id} by investigator ${req.user._id}`);
    
    res.json({
      success: true,
      message: 'Investigation report submitted successfully',
      incident: updatedIncident
    });
  } catch (error) {
    logger.error(`Error submitting investigation report: ${error.message}`);
    logger.error(error.stack);
    res.status(500).json({ 
      message: 'Server Error', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Review investigation report and take action (Officer only)
exports.reviewInvestigationReport = async (req, res) => {
  try {
    // Validate officer role
    if (req.user.role !== 'officer') {
      return res.status(403).json({ message: 'Only officers can review reports' });
    }

    const { 
      actions,
      notes,
      reportStatus
    } = req.body;
    
    if (!actions) {
      return res.status(400).json({ message: 'Actions are required' });
    }

    // Get the incident
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    // Verify this incident has a submitted report
    if (!incident.caseFile || !incident.caseFile.investigationReport || 
        incident.caseFile.investigationReport.status !== 'submitted') {
      return res.status(400).json({ message: 'No submitted investigation report found for this incident' });
    }

    // Update incident status
    incident.status = reportStatus === 'approved' ? 'closed' : 'reopened';
    
    // Update case file
    incident.caseFile.status = reportStatus === 'approved' ? 'review_complete' : 'under_investigation';
    
    // Update investigation report status
    incident.caseFile.investigationReport.status = reportStatus || 'reviewed';
    
    // Add officer actions
    incident.caseFile.officerActions = {
      reviewedBy: req.user._id,
      reviewedAt: new Date(),
      actions: actions,
      notes: notes || '',
      status: reportStatus === 'approved' ? 'completed' : 'in_progress'
    };
    
    // Add to timeline
    incident.timeline.push({
      date: new Date(),
      action: 'Investigation Report Reviewed',
      description: `Investigation report reviewed by officer ${req.user.name || req.user.email}`,
      performedBy: req.user._id
    });

    await incident.save();
    
    logger.info(`Investigation report for incident ${incident._id} reviewed by officer ${req.user._id}`);
    
    res.json({
      success: true,
      message: 'Investigation report reviewed successfully',
      incident
    });
  } catch (error) {
    logger.error(`Error reviewing investigation report: ${error.message}`);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
}; 