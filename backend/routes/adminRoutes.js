const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const Audit = require('../models/auditModel');

// GET /api/admin/logs - Get system logs
router.get('/logs', protect, authorize('admin'), async (req, res) => {
  try {
    console.log('Fetching system logs');
    
    // Parse query parameters for filtering
    const { 
      action, 
      resourceType, 
      startDate, 
      endDate, 
      userId,
      limit = 100
    } = req.query;
    
    // Build query filter
    const filter = {};
    
    if (action) filter.action = action;
    if (resourceType) filter.resourceType = resourceType;
    if (userId) filter.user = userId;
    
    // Add date range filter if provided
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }
    
    console.log('Log filter:', filter);
    
    // Fetch logs with populated user reference
    const logs = await Audit.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .populate({
        path: 'user',
        select: 'name email role firstName lastName'
      });
    
    console.log(`Found ${logs.length} logs`);
    
    // Format logs for frontend
    const formattedLogs = logs.map(log => ({
      id: log._id,
      timestamp: log.timestamp,
      level: log.success ? 'info' : 'error',
      message: log.description,
      action: log.action,
      resourceType: log.resourceType,
      user: log.user ? `${log.user.firstName || ''} ${log.user.lastName || ''}`.trim() || log.user.name || log.user.email : 'System',
      userId: log.user ? log.user._id : null,
      userRole: log.user ? log.user.role : null,
      userEmail: log.user ? log.user.email : null,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      resourceId: log.resourceId,
      metadata: log.metadata
    }));
    
    // Create an audit log entry for this request
    await Audit.create({
      user: req.user._id,
      action: 'read',
      resourceType: 'system',
      description: 'Viewed system logs',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.json({
      success: true,
      count: formattedLogs.length,
      logs: formattedLogs
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching system logs',
      error: error.message
    });
  }
});

// Get system statistics
router.get('/statistics', protect, authorize('admin'), async (req, res) => {
  try {
    // You can implement system statistics here
    res.json({
      success: true,
      message: 'System statistics endpoint (to be implemented)'
    });
  } catch (error) {
    console.error('Error getting system statistics:', error);
    res.status(500).json({
      success: false, 
      message: 'Error fetching system statistics'
    });
  }
});

// Get system settings
router.get('/settings', protect, authorize('admin'), async (req, res) => {
  try {
    // You can implement system settings here
    res.json({
      success: true,
      message: 'System settings endpoint (to be implemented)'
    });
  } catch (error) {
    console.error('Error getting system settings:', error);
    res.status(500).json({
      success: false, 
      message: 'Error fetching system settings'
    });
  }
});

module.exports = router; 