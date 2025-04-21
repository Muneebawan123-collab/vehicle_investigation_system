const Vehicle = require('../models/Vehicle');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditUtils');
const { cloudinary } = require('../config/cloudinary');
const asyncHandler = require('express-async-handler');

/**
 * @desc    Get all vehicles
 * @route   GET /api/vehicles
 * @access  Private
 */
const getVehicles = async (req, res, next) => {
  try {
    const vehicles = await Vehicle.find()
      .sort({ createdAt: -1 })
      .select('-__v');
    res.json(vehicles);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Register a new vehicle
 * @route   POST /api/vehicles/register
 * @access  Private (Officer, Admin, Investigator)
 */
const registerVehicle = asyncHandler(async (req, res) => {
  try {
    // Extract vehicle data from request body
    const {
      licensePlate,
      vin,
      make,
      model,
      year,
      color,
      registrationState,
      ownerName,
      ownerContact,
      ownerAddress,
      registrationExpiry,
      insuranceProvider,
      insurancePolicyNumber,
      insuranceExpiry,
      status = 'active'
    } = req.body;

    // Check for required fields
    if (!licensePlate || !vin || !make || !model) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: license plate, VIN, make, and model'
      });
    }

    // Set registrationNumber to licensePlate if not provided
    const registrationNumber = req.body.registrationNumber || licensePlate;

    // Check if vehicle with same VIN already exists
    const existingVehicleByVin = await Vehicle.findOne({ vin });
    if (existingVehicleByVin) {
      return res.status(400).json({
        success: false,
        message: `Vehicle with VIN ${vin} is already registered`
      });
    }

    // Check if vehicle with same license plate already exists
    const existingVehicleByPlate = await Vehicle.findOne({ licensePlate });
    if (existingVehicleByPlate) {
      return res.status(400).json({
        success: false,
        message: `Vehicle with license plate ${licensePlate} is already registered`
      });
    }

    // Create vehicle
    const vehicle = await Vehicle.create({
      registrationNumber,
      licensePlate,
      vin,
      make,
      model,
      year,
      color,
      registrationState,
      ownerName,
      ownerContact,
      ownerAddress,
      registrationExpiry,
      insuranceProvider,
      insurancePolicyNumber,
      insuranceExpiry,
      status
    });

    // Log the action using the createAuditLog utility
    await createAuditLog(
      req,
      'create',
      'vehicle',
      vehicle._id,
      `Vehicle ${registrationNumber} (${make} ${model}) registered by ${req.user.name}`,
      true
    );

    res.status(201).json({
      success: true,
      message: 'Vehicle registered successfully',
      vehicle
    });
  } catch (error) {
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const value = error.keyValue[field];
      return res.status(400).json({
        success: false,
        message: `A vehicle with this ${field} (${value}) is already registered`
      });
    }
    
    console.error('Vehicle registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during vehicle registration',
      error: error.message
    });
  }
});

/**
 * @desc    Get vehicle by ID
 * @route   GET /api/vehicles/:id
 * @access  Private
 */
const getVehicleById = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (vehicle) {
      res.json(vehicle);
    } else {
      res.status(404).json({ message: 'Vehicle not found' });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update vehicle
 * @route   PUT /api/vehicles/:id
 * @access  Private/Officer/Admin/Investigator
 */
const updateVehicle = async (req, res, next) => {
  try {
    console.log('Update vehicle request received for ID:', req.params.id);
    console.log('Update data:', req.body);
    
    // Validate request ID
    if (!req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle ID is required'
      });
    }
    
    // Find the vehicle first to check if it exists
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      console.log('Vehicle not found with ID:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Update the vehicle
    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    // Create audit log
    await createAuditLog(
      req,
      'update',
      'vehicle',
      updatedVehicle._id,
      `Vehicle updated: ${updatedVehicle.year} ${updatedVehicle.make} ${updatedVehicle.model} (${updatedVehicle.licensePlate})`,
      true
    );

    console.log('Vehicle updated successfully:', updatedVehicle._id);
    
    res.json({
      success: true,
      message: 'Vehicle updated successfully',
      data: updatedVehicle
    });
  } catch (error) {
    console.error('Error updating vehicle:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const value = error.keyValue[field];
      return res.status(400).json({
        success: false,
        message: `A vehicle with this ${field} (${value}) already exists`
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error during vehicle update',
      error: error.message
    });
  }
};

/**
 * @desc    Delete vehicle
 * @route   DELETE /api/vehicles/:id
 * @access  Private/Admin
 */
const deleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    // Use findByIdAndDelete instead of remove() which is deprecated
    await Vehicle.findByIdAndDelete(req.params.id);
    
    // Create audit log
    await createAuditLog(
      req,
      'delete',
      'vehicle',
      vehicle._id,
      `Vehicle deleted: ${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})`,
      true
    );

    res.json({ 
      success: true,
      message: 'Vehicle removed successfully' 
    });
    logger.info(`Vehicle deleted: ${vehicle.vin} by user ${req.user._id}`);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Search vehicles
 * @route   GET /api/vehicles/search
 * @access  Private
 */
const searchVehicles = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a search query'
      });
    }

    // Search for vehicles by license plate (case-insensitive)
    const vehicles = await Vehicle.find({
      licensePlate: { $regex: query, $options: 'i' }
    }).select('-__v');

    if (vehicles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No vehicles found matching the search criteria'
      });
    }

    res.json({
      success: true,
      data: vehicles
    });
  } catch (error) {
    console.error('Error searching vehicles:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching vehicles',
      error: error.message
    });
  }
};

// Placeholder functions for unimplemented features
const uploadVehicleImages = (req, res) => res.status(501).json({ message: 'Not implemented' });
const setMainVehicleImage = (req, res) => res.status(501).json({ message: 'Not implemented' });
const removeVehicleImage = (req, res) => res.status(501).json({ message: 'Not implemented' });
const updateVehicleLocation = (req, res) => res.status(501).json({ message: 'Not implemented' });
const addVehicleNote = (req, res) => res.status(501).json({ message: 'Not implemented' });
const getVehicleNotes = (req, res) => res.status(501).json({ message: 'Not implemented' });
const addVehicleFlag = (req, res) => res.status(501).json({ message: 'Not implemented' });
const resolveVehicleFlag = (req, res) => res.status(501).json({ message: 'Not implemented' });
const getVehicleFlags = (req, res) => res.status(501).json({ message: 'Not implemented' });
const checkDuplicateVIN = (req, res) => res.status(501).json({ message: 'Not implemented' });
const checkVehicleCompliance = (req, res) => res.status(501).json({ message: 'Not implemented' });
const getVehiclesByOwner = (req, res) => res.status(501).json({ message: 'Not implemented' });
const getVehiclesByStatus = (req, res) => res.status(501).json({ message: 'Not implemented' });
const updateComplianceDetails = (req, res) => res.status(501).json({ message: 'Not implemented' });

module.exports = {
  getVehicles,
  getVehicleById,
  registerVehicle,
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
};