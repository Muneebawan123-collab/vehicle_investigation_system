const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  registrationNumber: {
    type: String,
    trim: true,
    unique: true,
    sparse: true, // This allows null/undefined values without triggering unique constraint
    index: true // Explicitly define as an index
  },
  vin: {
    type: String,
    required: [true, 'VIN is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  licensePlate: {
    type: String,
    required: [true, 'License plate is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  make: {
    type: String,
    required: [true, 'Vehicle make is required'],
    trim: true
  },
  model: {
    type: String,
    required: [true, 'Vehicle model is required'],
    trim: true
  },
  year: {
    type: Number,
    required: [true, 'Vehicle year is required']
  },
  color: {
    type: String,
    required: [true, 'Vehicle color is required'],
    trim: true
  },
  registrationState: {
    type: String,
    required: [true, 'Registration state is required'],
    trim: true
  },
  ownerName: {
    type: String,
    required: [true, 'Owner name is required'],
    trim: true
  },
  ownerContact: {
    type: String,
    required: [true, 'Owner contact is required'],
    trim: true
  },
  ownerEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  ownerAddress: {
    type: String,
    required: [true, 'Owner address is required'],
    trim: true
  },
  registrationExpiry: {
    type: Date
  },
  insuranceProvider: {
    type: String,
    trim: true
  },
  insurancePolicyNumber: {
    type: String,
    trim: true
  },
  insuranceExpiry: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'stolen', 'recovered', 'impounded'],
    default: 'active'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// We don't need to re-declare the indexes since they're already in the schema definition
// The schema will automatically create indexes for fields marked as unique

// Check if the model already exists before creating it
module.exports = mongoose.models.Vehicle || mongoose.model('Vehicle', vehicleSchema); 