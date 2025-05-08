const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  incidentType: {
    type: String,
    enum: ['accident', 'theft', 'vandalism', 'other'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    required: true
  },
  dateTime: {
    type: Date,
    default: Date.now,
    required: true
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
    },
    address: {
      type: String,
      trim: true
    }
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  witnesses: [
    {
      name: String,
      contact: String,
      statement: String
    }
  ],
  evidence: [
    {
      type: {
        type: String,
        enum: ['photo', 'video', 'document', 'other'],
        required: true
      },
      description: String,
      url: String,
      fileType: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
    default: 'Open'
  },
  policeReportNumber: {
    type: String,
    trim: true
  },
  notes: [
    {
      content: {
        type: String,
        required: true
      },
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ]
}, {
  timestamps: true
});

// Add 2dsphere index for geospatial queries
incidentSchema.index({ location: '2dsphere' });

// Check if the model exists before creating it
module.exports = mongoose.models.Incident || mongoose.model('Incident', incidentSchema); 