const mongoose = require('mongoose');
const logger = require('./logger');

/**
 * Creates an audit log entry
 * @param {Object} req - Express request object
 * @param {String} action - The action performed (create, update, delete, view, etc.)
 * @param {String} resourceType - The type of resource (vehicle, incident, user, etc.)
 * @param {String} resourceId - The ID of the resource
 * @param {String} description - Description of the action
 * @param {Boolean} isSuccess - Whether the action was successful
 * @returns {Promise} The created audit log
 */
const createAuditLog = async (req, res, action, resourceType, resourceId, description, isSuccess = true) => {
  try {
    // Check if AuditLog model exists
    const AuditLog = mongoose.models.AuditLog || 
      mongoose.model('AuditLog', new mongoose.Schema({
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        userName: String,
        userRole: String,
        action: {
          type: String,
          required: true
        },
        resourceType: {
          type: String,
          required: true
        },
        resourceId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true
        },
        description: String,
        ip: String,
        userAgent: String,
        timestamp: {
          type: Date,
          default: Date.now
        },
        isSuccess: {
          type: Boolean,
          default: true
        }
      }, { timestamps: true }));

    const logEntry = await AuditLog.create({
      userId: req.user._id,
      userName: req.user.name || `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email,
      userRole: req.user.role,
      action,
      resourceType,
      resourceId,
      description,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent'],
      isSuccess
    });

    logger.info(`Audit log created: ${action} on ${resourceType} ${resourceId} by ${req.user._id}`);
    return logEntry;
  } catch (error) {
    logger.error(`Error creating audit log: ${error.message}`);
    // Don't throw error - audit logs should never break main functionality
    return null;
  }
};

module.exports = {
  createAuditLog
}; 