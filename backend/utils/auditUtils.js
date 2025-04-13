const Audit = require('../models/auditModel');
const logger = require('./logger');

/**
 * Create an audit log entry
 * @param {Object} req - Express request object
 * @param {string} action - The action performed (login, create, update, etc.)
 * @param {string} resourceType - The type of resource (user, vehicle, incident, etc.)
 * @param {string|ObjectId} resourceId - ID of the resource
 * @param {string} description - Description of the activity
 * @param {boolean} success - Whether the action was successful
 * @param {Object} metadata - Additional data to store
 * @returns {Promise} - Promise that resolves to the created audit entry
 */
const createAuditLog = async (req, action, resourceType, resourceId = null, description, success = true, metadata = {}) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const userId = req.user ? req.user._id : null;

    if (!userId) {
      logger.warn(`Attempted to create audit log without user ID: ${action} - ${resourceType}`);
      return null;
    }

    const auditEntry = await Audit.create({
      user: userId,
      action,
      resourceType,
      resourceId,
      description,
      ipAddress,
      userAgent,
      success,
      metadata,
      timestamp: new Date()
    });

    logger.debug(`Audit log created: ${auditEntry._id}`);
    return auditEntry;
  } catch (error) {
    logger.error(`Error creating audit log: ${error.message}`);
    return null;
  }
};

/**
 * Create a system audit log (no user required)
 * @param {string} action - The action performed
 * @param {string} description - Description of the activity
 * @param {boolean} success - Whether the action was successful
 * @returns {Promise} - Promise that resolves to the created audit entry
 */
const createSystemAuditLog = async (action, description, success = true) => {
  try {
    // For system activities, use the admin user if available
    const adminUser = await require('../models/userModel').findOne({ role: 'admin' });
    
    if (!adminUser) {
      logger.warn('No admin user found for system audit log');
      return null;
    }

    const auditEntry = await Audit.create({
      user: adminUser._id,
      action,
      resourceType: 'system',
      description,
      success,
      timestamp: new Date()
    });

    logger.debug(`System audit log created: ${auditEntry._id}`);
    return auditEntry;
  } catch (error) {
    logger.error(`Error creating system audit log: ${error.message}`);
    return null;
  }
};

/**
 * Get audit logs for a specific resource
 * @param {string} resourceType - The type of resource
 * @param {string|ObjectId} resourceId - ID of the resource
 * @returns {Promise} - Promise that resolves to array of audit logs
 */
const getResourceAuditLogs = async (resourceType, resourceId) => {
  try {
    return await Audit.find({ resourceType, resourceId })
      .sort({ timestamp: -1 })
      .populate('user', 'firstName lastName email role');
  } catch (error) {
    logger.error(`Error fetching resource audit logs: ${error.message}`);
    return [];
  }
};

/**
 * Get audit logs for a specific user
 * @param {string|ObjectId} userId - User ID
 * @returns {Promise} - Promise that resolves to array of audit logs
 */
const getUserAuditLogs = async (userId) => {
  try {
    return await Audit.find({ user: userId })
      .sort({ timestamp: -1 });
  } catch (error) {
    logger.error(`Error fetching user audit logs: ${error.message}`);
    return [];
  }
};

module.exports = {
  createAuditLog,
  createSystemAuditLog,
  getResourceAuditLogs,
  getUserAuditLogs
}; 