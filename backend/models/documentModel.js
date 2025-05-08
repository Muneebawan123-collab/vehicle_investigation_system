const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Document title is required'],
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Document type is required'],
    enum: [
      'insurance',
      'registration',
      'inspection',
      'maintenance',
      'recall',
      'citation',
      'police_report',
      'purchase',
      'title_deed',
      'other'
    ]
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: [true, 'Vehicle ID is required']
  },
  incident: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Incident'
  },
  fileUrl: {
    type: String,
    required: [true, 'File URL is required']
  },
  thumbnailUrl: String,
  description: String,
  issuedDate: Date,
  expiryDate: Date,
  issuedBy: {
    organization: String,
    contactInfo: String,
    address: String
  },
  documentNumber: String,
  tags: [String],
  metadata: {
    fileType: String,
    fileSize: Number,
    pages: Number,
    dimensions: String
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verificationDate: Date,
  isPublic: {
    type: Boolean,
    default: false
  },
  isWatermarked: {
    type: Boolean,
    default: false
  },
  watermarkPath: String,
  digitalSignature: {
    signature: String,
    signedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    signedAt: Date
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: [
    {
      content: String,
      author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  status: {
    type: String,
    enum: ['active', 'expired', 'revoked', 'replaced'],
    default: 'active'
  },
  replacedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  },
  accessLog: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      action: {
        type: String,
        enum: ['viewed', 'downloaded', 'edited', 'shared'],
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      ipAddress: String,
      userAgent: String
    }
  ]
}, {
  timestamps: true
});

// Create text index for searching
documentSchema.index({ 
  title: 'text',
  description: 'text',
  documentNumber: 'text',
  tags: 'text'
});

// Auto-populate document expiry alert
documentSchema.virtual('isExpiringSoon').get(function() {
  if (!this.expiryDate) return false;
  
  const today = new Date();
  const expiryDate = new Date(this.expiryDate);
  const daysRemaining = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
  
  return daysRemaining > 0 && daysRemaining <= 30;
});

documentSchema.virtual('isExpired').get(function() {
  if (!this.expiryDate) return false;
  
  const today = new Date();
  const expiryDate = new Date(this.expiryDate);
  
  return today > expiryDate;
});

// Check if the model already exists before creating it
module.exports = mongoose.models.Document || mongoose.model('Document', documentSchema); 