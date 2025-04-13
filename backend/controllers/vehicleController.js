const Vehicle = require('../models/Vehicle');
const logger = require('../utils/logger');
const { createAuditLog } = require('../utils/auditUtils');
const { cloudinary } = require('../config/cloudinary');

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
 * @route   POST /api/vehicles
 * @access  Private/Officer/Admin/Investigator
 */
const registerVehicle = async (req, res, next) => {
  try {
    const { 
      make, 
      model, 
      year, 
      vin,
      licensePlate, 
      color, 
      registrationState,
      registrationExpiry,
      insuranceProvider,
      insurancePolicyNumber,
      insuranceExpiry,
      owner,
      complianceDetails,
      status,
      location
    } = req.body;

    // Check if vehicle with this VIN already exists
    const vehicleExists = await Vehicle.findOne({ vin });
    if (vehicleExists) {
      return res.status(400).json({ 
        message: 'Vehicle with this VIN already exists',
        existingVehicle: {
          _id: vehicleExists._id,
          make: vehicleExists.make,
          model: vehicleExists.model,
          year: vehicleExists.year,
          licensePlate: vehicleExists.licensePlate
        }
      });
    }

    // Check if vehicle with this license plate already exists
    const licensePlateExists = await Vehicle.findOne({ licensePlate });
    if (licensePlateExists) {
      return res.status(409).json({ 
        message: `Vehicle with license plate "${licensePlate}" already exists`,
        existingVehicle: {
          _id: licensePlateExists._id,
          make: licensePlateExists.make,
          model: licensePlateExists.model,
          year: licensePlateExists.year,
          licensePlate: licensePlateExists.licensePlate
        }
      });
    }

    // Create vehicle
    const vehicle = await Vehicle.create({
      make,
      model,
      year,
      vin,
      licensePlate,
      color,
      registrationState,
      registrationExpiry: registrationExpiry ? new Date(registrationExpiry) : undefined,
      insuranceProvider,
      insurancePolicyNumber,
      insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry) : undefined,
      owner,
      complianceDetails,
      status: status || 'active',
      location: location || {
        type: 'Point',
        coordinates: [0, 0]
      },
      registeredBy: req.user._id,
      vehicleImages: [],
      mainImage: ''
    });

    if (vehicle) {
      // Create audit log
      await createAuditLog(
        req,
        'create',
        'vehicle',
        vehicle._id,
        `Vehicle registered: ${year} ${make} ${model} (${licensePlate})`,
        true
      );

      res.status(201).json(vehicle);
      logger.info(`Vehicle registered: ${vehicle.vin} by user ${req.user._id}`);
    } else {
      res.status(400).json({ message: 'Invalid vehicle data' });
    }
  } catch (error) {
    next(error);
  }
};

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
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedVehicle);
  } catch (error) {
    next(error);
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

    await vehicle.remove();
    res.json({ message: 'Vehicle removed' });
  } catch (error) {
    next(error);
  }
};

// Placeholder functions for unimplemented features
const uploadVehicleImages = (req, res) => res.status(501).json({ message: 'Not implemented' });
const setMainVehicleImage = (req, res) => res.status(501).json({ message: 'Not implemented' });
const removeVehicleImage = (req, res) => res.status(501).json({ message: 'Not implemented' });
const searchVehicles = (req, res) => res.status(501).json({ message: 'Not implemented' });
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