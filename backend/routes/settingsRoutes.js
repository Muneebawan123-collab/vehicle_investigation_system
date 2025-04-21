const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { protect, authorize } = require('../middleware/authMiddleware');

// @route   GET /api/settings
// @desc    Get system settings
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = await Settings.createDefault();
    }

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching settings',
      error: error.message
    });
  }
});

// @route   PUT /api/settings
// @desc    Update system settings
// @access  Private/Admin
router.put('/', protect, authorize('admin'), async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = await Settings.createDefault();
    }

    const updateFields = [
      'systemName',
      'emailNotifications',
      'smsNotifications',
      'maxFileSize',
      'allowedFileTypes',
      'retentionPeriod',
      'autoArchive',
      'maintenanceMode'
    ];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        settings[field] = req.body[field];
      }
    });

    settings.lastUpdatedBy = req.user._id;
    await settings.save();

    res.json({
      success: true,
      data: settings,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating settings',
      error: error.message
    });
  }
});

module.exports = router; 