const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  make: {
    type: String,
    required: true,
    trim: true
  },
  model: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: Number,
    required: true
  },
  vin: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  licensePlate: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  color: {
    type: String,
    required: true,
    trim: true
  },
  registrationState: {
    type: String,
    required: true,
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
  owner: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    contact: {
      phone: {
        type: String,
        required: true,
        trim: true
      },
      email: {
        type: String,
        trim: true,
        lowercase: true
      },
      address: {
        type: String,
        required: true,
        trim: true
      }
    }
  },
  complianceDetails: {
    emissions: {
      type: Map,
      of: String
    },
    safety: {
      type: Map,
      of: String
    }
  },
  status: {
    type: String,
    enum: ['active', 'stolen', 'recovered', 'scrapped'],
    default: 'active'
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  registeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  vehicleImages: [{
    type: String
  }],
  mainImage: {
    type: String
  },
  notes: [{
    content: String,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Create indexes for efficient querying
vehicleSchema.index({ vin: 1 });
vehicleSchema.index({ licensePlate: 1 });
vehicleSchema.index({ 'owner.name': 1 });
vehicleSchema.index({ status: 1 });
vehicleSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Vehicle', vehicleSchema); 