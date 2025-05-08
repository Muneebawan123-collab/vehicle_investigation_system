const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  incidentNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  title: {
    type: String,
    required: [true, 'Incident title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Incident description is required']
  },
  date: {
    type: Date,
    required: [true, 'Incident date is required'],
    default: Date.now
  },
  time: {
    type: String,
    required: [true, 'Incident time is required']
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
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: {
        type: String,
        default: 'USA'
      }
    }
  },
  type: {
    type: String,
    required: [true, 'Incident type is required'],
    enum: [
      'theft', 
      'accident', 
      'vandalism', 
      'traffic_violation', 
      'dui', 
      'abandoned', 
      'suspicious_activity',
      'other'
    ]
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'under_investigation', 'pending', 'closed', 'reopened'],
    default: 'open'
  },
  vehicles: [
    {
      vehicle: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: true
      },
      involvement: {
        type: String,
        enum: ['suspect', 'victim', 'witness', 'other'],
        required: true
      },
      details: String
    }
  ],
  persons: [
    {
      name: {
        type: String,
        required: true
      },
      role: {
        type: String,
        enum: ['suspect', 'victim', 'witness', 'reporting_party', 'officer', 'other'],
        required: true
      },
      contact: {
        phone: String,
        email: String,
        address: String
      },
      details: String,
      identification: {
        type: String,
        trim: true
      }
    }
  ],
  evidence: [
    {
      type: {
        type: String,
        enum: ['photo', 'video', 'document', 'physical_item', 'statement', 'other'],
        required: true
      },
      fileUrl: String,
      thumbnailUrl: String,
      description: String,
      collectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      collectedAt: {
        type: Date,
        default: Date.now
      },
      tags: [String],
      metadata: {
        fileType: String,
        fileSize: Number,
        dimensions: String,
        duration: String
      }
    }
  ],
  timeline: [
    {
      date: {
        type: Date,
        default: Date.now
      },
      action: {
        type: String,
        required: true
      },
      description: String,
      performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }
  ],
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: [
    {
      content: {
        type: String,
        required: true
      },
      author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      },
      isPrivate: {
        type: Boolean,
        default: false
      }
    }
  ],
  caseFile: {
    caseNumber: String,
    status: {
      type: String,
      enum: ['not_assigned', 'assigned', 'under_investigation', 'report_submitted', 'review_complete', 'closed'],
      default: 'not_assigned'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    assignedInvestigator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    investigationStartDate: Date,
    investigationEndDate: Date,
    findings: String,
    recommendations: String,
    conclusion: {
      type: String,
      enum: ['pending', 'substantiated', 'unsubstantiated', 'inconclusive'],
      default: 'pending'
    },
    investigationReport: {
      submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      submittedAt: Date,
      content: String,
      attachments: [String],
      status: {
        type: String,
        enum: ['pending', 'submitted', 'reviewed', 'approved', 'rejected'],
        default: 'pending'
      }
    },
    officerActions: {
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      reviewedAt: Date,
      actions: String,
      notes: String,
      conclusion: {
        type: String,
        enum: ['confirmed', 'additional_investigation', 'case_dismissed', 'legal_action', 'other'],
        default: 'confirmed'
      },
      status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed'],
        default: 'pending'
      }
    }
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  },
  incidentType: {
    type: String,
    enum: [
      'theft', 
      'accident', 
      'vandalism', 
      'traffic_violation', 
      'dui', 
      'abandoned', 
      'suspicious_activity',
      'other'
    ]
  },
  dateTime: {
    type: Date
  }
}, {
  timestamps: true
});

// Create geospatial index
incidentSchema.index({ location: '2dsphere' });

// Create text index for searching
incidentSchema.index({ 
  title: 'text', 
  description: 'text', 
  incidentNumber: 'text',
  'persons.name': 'text'
});

// Auto-generate incident number before saving
incidentSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await mongoose.model('Incident').countDocuments();
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    this.incidentNumber = `INC-${year}${month}-${(count + 1).toString().padStart(4, '0')}`;
  }

  // Sync type and incidentType fields
  if (this.type && !this.incidentType) {
    this.incidentType = this.type;
  } else if (this.incidentType && !this.type) {
    this.type = this.incidentType;
  }

  // Sync date and dateTime fields
  if (this.date && !this.dateTime) {
    this.dateTime = this.date;
  } else if (this.dateTime && !this.date) {
    this.date = this.dateTime;
  }

  // Sync vehicle field with vehicles array
  if (this.vehicle && (!this.vehicles || this.vehicles.length === 0)) {
    this.vehicles = [{ 
      vehicle: this.vehicle, 
      involvement: 'victim',
      details: 'Primary vehicle'
    }];
  } else if (this.vehicles && this.vehicles.length > 0 && !this.vehicle) {
    this.vehicle = this.vehicles[0].vehicle;
  }

  next();
});

// Check if the model already exists before creating it again
module.exports = mongoose.models.Incident || mongoose.model('Incident', incidentSchema); 