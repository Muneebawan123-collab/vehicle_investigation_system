const logger = require('../config/logger');
const User = require('../models/User');
const mongoose = require('mongoose');
const express = require('express');

/**
 * Create a notification for all admin users
 * @param {string} title - The notification title
 * @param {string} message - The notification message
 * @param {string} type - The notification type (info, warning, success, error)
 * @param {string} resourceType - Type of resource (incident, vehicle, etc.)
 * @param {string} resourceId - ID of the related resource
 * @param {boolean} isUrgent - Whether the notification is urgent
 * @returns {Promise} - Promise that resolves when notifications are created
 */
const notifyAdmins = async (title, message, type = 'info', resourceType = null, resourceId = null, isUrgent = false) => {
  try {
    // Find all admin users
    const admins = await User.find({ role: 'admin' }).select('_id');
    
    if (!admins || admins.length === 0) {
      logger.warn('No admin users found to notify');
      return [];
    }

    // Check if we have a Notification model
    let Notification;
    try {
      Notification = mongoose.model('Notification');
    } catch (error) {
      // If model doesn't exist yet, create it
      const notificationSchema = new mongoose.Schema({
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        title: {
          type: String,
          required: true
        },
        message: {
          type: String, 
          required: true
        },
        type: {
          type: String,
          enum: ['info', 'warning', 'success', 'error'],
          default: 'info'
        },
        isRead: {
          type: Boolean,
          default: false
        },
        isUrgent: {
          type: Boolean,
          default: false
        },
        resourceType: {
          type: String,
          enum: ['incident', 'vehicle', 'user', 'document', 'system', 'chat', null],
          default: null
        },
        resourceId: {
          type: mongoose.Schema.Types.ObjectId,
          default: null
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      });
      
      Notification = mongoose.model('Notification', notificationSchema);
    }

    // Validate resourceId as ObjectId if provided
    if (resourceId && typeof resourceId === 'string') {
      if (!mongoose.Types.ObjectId.isValid(resourceId)) {
        logger.warn(`Invalid resource ID provided for notification: ${resourceId}`);
        resourceId = null;
      }
    }

    // Create notifications for all admins
    const notifications = [];
    const promises = admins.map(admin => {
      return Notification.create({
        user: admin._id,
        title,
        message,
        type,
        isUrgent,
        resourceType,
        resourceId: resourceId ? mongoose.Types.ObjectId(resourceId) : null
      }).catch(err => {
        logger.warn(`Failed to create notification for admin ${admin._id}: ${err.message}`);
        return null;
      });
    });

    const results = await Promise.allSettled(promises);
    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        notifications.push(result.value);
        
        // Send real-time notification via Socket.IO
        emitNotification(result.value);
      }
    });

    logger.info(`Created ${notifications.length} admin notifications: "${title}"`);
    return notifications;
  } catch (error) {
    logger.error(`Error creating admin notifications: ${error.message}`);
    return [];
  }
};

/**
 * Send a notification to a specific user
 * @param {string} userId - The user ID to notify
 * @param {string} title - The notification title
 * @param {string} message - The notification message
 * @param {string} type - The notification type (info, warning, success, error)
 * @param {string} resourceType - Type of resource (incident, vehicle, etc.)
 * @param {string} resourceId - ID of the related resource
 * @param {boolean} isUrgent - Whether the notification is urgent
 * @returns {Promise} - Promise that resolves to the created notification
 */
const notifyUser = async (userId, title, message, type = 'info', resourceType = null, resourceId = null, isUrgent = false) => {
  try {
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      logger.warn(`User not found for notification: ${userId}`);
      return null;
    }

    // Get or create Notification model
    let Notification;
    try {
      Notification = mongoose.model('Notification');
    } catch (error) {
      // If we get here, notifyAdmins hasn't been called yet to create the model
      // Let's call it to create the model
      await notifyAdmins('System Message', 'Notification system initialized', 'info', 'system');
      Notification = mongoose.model('Notification');
    }

    // Create notification
    const notification = await Notification.create({
      user: userId,
      title,
      message,
      type,
      isUrgent,
      resourceType,
      resourceId
    });

    // Send real-time notification via Socket.IO
    emitNotification(notification);

    logger.info(`Created notification for user ${userId}: "${title}"`);
    return notification;
  } catch (error) {
    logger.error(`Error creating user notification: ${error.message}`);
    return null;
  }
};

/**
 * Send a notification using Socket.IO
 * @param {Object} notification - The notification object
 */
const emitNotification = (notification) => {
  try {
    // Access the main app directly
    const app = global.app || require('../server').app;
    
    if (!app) {
      logger.warn('Express app instance not found for real-time notifications');
      return;
    }
    
    // Get Socket.IO instance and userSockets map from app
    const io = app.get('io');
    const userSockets = app.get('userSockets');
    
    if (!io) {
      logger.warn('Socket.IO instance not found for real-time notifications');
      return;
    }
    
    // Get the user's socket ID
    const socketId = userSockets.get(notification.user.toString());
    
    if (socketId) {
      // Send to specific user
      io.to(socketId).emit('notification', notification);
      logger.info(`Real-time notification sent to user ${notification.user.toString()}`);
    } else {
      logger.info(`User ${notification.user.toString()} not connected, notification stored for later`);
    }
  } catch (error) {
    logger.error(`Error sending real-time notification: ${error.message}`);
  }
};

module.exports = {
  notifyAdmins,
  notifyUser
}; 