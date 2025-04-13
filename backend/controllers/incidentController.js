const Incident = require('../models/Incident');
const { validationResult } = require('express-validator');

// Get all incidents
exports.getAllIncidents = async (req, res) => {
  try {
    const incidents = await Incident.find()
      .populate('vehicle', 'registrationNumber make model')
      .populate('reportedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get incident by ID
exports.getIncidentById = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate('vehicle', 'registrationNumber make model')
      .populate('reportedBy', 'name email');
    
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }
    
    res.json(incident);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new incident
exports.createIncident = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const incident = new Incident({
      ...req.body,
      reportedBy: req.user.id
    });
    
    const savedIncident = await incident.save();
    res.status(201).json(savedIncident);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update incident
exports.updateIncident = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const incident = await Incident.findById(req.params.id);
    
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    // Check if user is authorized to update
    if (incident.reportedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updatedIncident = await Incident.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    res.json(updatedIncident);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete incident
exports.deleteIncident = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);
    
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    // Check if user is authorized to delete
    if (incident.reportedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await incident.remove();
    res.json({ message: 'Incident deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get incidents by vehicle ID
exports.getIncidentsByVehicle = async (req, res) => {
  try {
    const incidents = await Incident.find({ vehicle: req.params.vehicleId })
      .populate('vehicle', 'registrationNumber make model')
      .populate('reportedBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get incidents by user ID
exports.getIncidentsByUser = async (req, res) => {
  try {
    const incidents = await Incident.find({ reportedBy: req.params.userId })
      .populate('vehicle', 'registrationNumber make model')
      .populate('reportedBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 