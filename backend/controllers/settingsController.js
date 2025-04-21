const Settings = require('../models/Settings');
const { createAuditLog } = require('../utils/auditUtils');

/**
 * @desc    Get system settings
 * @route   GET /api/settings
 * @access  Private/Admin
 */
const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    // If no settings exist, create default settings
    if (!settings) {
      settings = await Settings.create({
        systemName: 'Vehicle Investigation System',
        emailNotifications: true,
        smsNotifications: false,
        maxFileSize: 10, // MB
        allowedFileTypes: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'],
        retentionPeriod: 30, // days
        autoArchive: false,
        maintenanceMode: false
      });
    }

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching system settings',
      error: error.message
    });
  }
};

/**
 * @desc    Update system settings
 * @route   PUT /api/settings
 * @access  Private/Admin
 */
const updateSettings = async (req, res) => {
  try {
    const {
      systemName,
      emailNotifications,
      smsNotifications,
      maxFileSize,
      allowedFileTypes,
      retentionPeriod,
      autoArchive,
      maintenanceMode
    } = req.body;

    let settings = await Settings.findOne();

    // If no settings exist, create new settings
    if (!settings) {
      settings = new Settings({});
    }

    // Update fields if provided
    if (systemName !== undefined) settings.systemName = systemName;
    if (emailNotifications !== undefined) settings.emailNotifications = emailNotifications;
    if (smsNotifications !== undefined) settings.smsNotifications = smsNotifications;
    if (maxFileSize !== undefined) settings.maxFileSize = maxFileSize;
    if (allowedFileTypes !== undefined) settings.allowedFileTypes = allowedFileTypes;
    if (retentionPeriod !== undefined) settings.retentionPeriod = retentionPeriod;
    if (autoArchive !== undefined) settings.autoArchive = autoArchive;
    if (maintenanceMode !== undefined) settings.maintenanceMode = maintenanceMode;

    const updatedSettings = await settings.save();

    // Create audit log
    await createAuditLog(
      req,
      'update',
      'settings',
      updatedSettings._id,
      'System settings updated',
      true
    );

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: updatedSettings
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating system settings',
      error: error.message
    });
  }
};

module.exports = {
  getSettings,
  updateSettings
}; 