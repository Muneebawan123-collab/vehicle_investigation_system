const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Document name is required']
  },
  type: {
    type: String,
    required: [true, 'Document type is required']
  },
  url: {
    type: String,
    required: [true, 'Document URL is required']
  },
  publicId: {
    type: String,
    required: [true, 'Public ID is required']
  },
  size: {
    type: Number,
    required: [true, 'File size is required']
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploader information is required']
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: false
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  // Add binary data storage
  fileData: {
    type: Buffer,
    required: false
  },
  lastBinaryUpdate: {
    type: Date,
    required: false
  },
  fileUrl: {
    type: String,
    required: false
  },
  // Document access logs
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
  ],
  description: {
    type: String,
    required: false
  },
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  expiration: {
    type: Date,
    required: false
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
documentSchema.index({ name: 'text' });
documentSchema.index({ vehicle: 1 });
documentSchema.index({ uploadedBy: 1 });
documentSchema.index({ type: 1 });
documentSchema.index({ tags: 1 });
documentSchema.index({ expiration: 1 });

// Check if the model already exists before creating it
module.exports = mongoose.models.Document || mongoose.model('Document', documentSchema); 