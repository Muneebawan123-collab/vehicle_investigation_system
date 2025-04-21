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
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
documentSchema.index({ name: 'text' });
documentSchema.index({ vehicle: 1 });
documentSchema.index({ uploadedBy: 1 });
documentSchema.index({ type: 1 });

const Document = mongoose.model('Document', documentSchema);

module.exports = Document; 