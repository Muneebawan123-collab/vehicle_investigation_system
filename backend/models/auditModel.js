const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'login',
      'logout',
      'create',
      'read',
      'update',
      'delete',
      'export',
      'upload',
      'download',
      'search',
      'failed_login',
      'password_reset',
      'permission_change',
      'consent_update',
      'api_access',
      'other'
    ]
  },
  resourceType: {
    type: String,
    required: true,
    enum: [
      'user',
      'vehicle',
      'incident',
      'document',
      'case',
      'report',
      'system',
      'chat',
      'other'
    ]
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId
  },
  description: {
    type: String,
    required: true
  },
  ipAddress: String,
  userAgent: String,
  success: {
    type: Boolean,
    default: true
  },
  metadata: {
    type: Map,
    of: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for frequent queries
auditSchema.index({ user: 1 });
auditSchema.index({ action: 1 });
auditSchema.index({ resourceType: 1, resourceId: 1 });
auditSchema.index({ timestamp: -1 });

// Create text index for searching
auditSchema.index({ description: 'text' });

const Audit = mongoose.model('Audit', auditSchema);

module.exports = Audit;
