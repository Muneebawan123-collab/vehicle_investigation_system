const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { protect, authorize } = require('../middleware/authMiddleware');
const logger = require('../config/logger');

// Get the Notification model
const Notification = mongoose.model('Notification');

/**
 * @route   GET /api/notifications
 * @desc    Get all notifications for the current user
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
      
    res.json(notifications);
  } catch (error) {
    logger.error(`Error fetching notifications: ${error.message}`);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

/**
 * @route   GET /api/notifications/unread
 * @desc    Get unread notifications count for the current user
 * @access  Private
 */
router.get('/unread', protect, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      user: req.user._id,
      isRead: false
    });
      
    res.json({ unreadCount: count });
  } catch (error) {
    logger.error(`Error fetching unread notifications count: ${error.message}`);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.put('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    // Check that this notification belongs to the user
    if (notification.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this notification' });
    }
    
    notification.isRead = true;
    await notification.save();
    
    res.json(notification);
  } catch (error) {
    logger.error(`Error marking notification as read: ${error.message}`);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put('/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true }
    );
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    logger.error(`Error marking all notifications as read: ${error.message}`);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete a notification
 * @access  Private
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    // Check that this notification belongs to the user
    if (notification.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this notification' });
    }
    
    await notification.remove();
    
    res.json({ message: 'Notification removed' });
  } catch (error) {
    logger.error(`Error deleting notification: ${error.message}`);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

/**
 * @route   DELETE /api/notifications/clear-all
 * @desc    Delete all notifications for the current user
 * @access  Private
 */
router.delete('/clear-all', protect, async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user._id });
    
    res.json({ message: 'All notifications cleared' });
  } catch (error) {
    logger.error(`Error clearing all notifications: ${error.message}`);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

module.exports = router; 