const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const logger = require('../config/logger');

// Mock data - in a real app, this would come from a database
const safetyTips = [
  {
    tip: "Always wear your seatbelt, even for short trips.",
    source: "National Highway Traffic Safety Administration",
    timestamp: new Date()
  },
  {
    tip: "Maintain a safe following distance of at least 3 seconds behind the vehicle in front of you.",
    source: "AAA Foundation for Traffic Safety",
    timestamp: new Date()
  },
  {
    tip: "Never drive under the influence of alcohol or drugs.",
    source: "CDC",
    timestamp: new Date()
  },
  {
    tip: "Avoid distracted driving - put your phone away while driving.",
    source: "National Safety Council",
    timestamp: new Date()
  },
  {
    tip: "Adjust your speed according to weather and road conditions.",
    source: "FEMA",
    timestamp: new Date()
  }
];

const trafficAlerts = [
  {
    alert: "Construction zone ahead. Expect delays and lane closures.",
    location: "Main Street between Oak and Pine",
    timestamp: new Date()
  },
  {
    alert: "Traffic accident blocking right lane.",
    location: "Northbound Highway 101 at Exit 25",
    timestamp: new Date()
  },
  {
    alert: "Heavy congestion reported during rush hour.",
    location: "Downtown area",
    timestamp: new Date()
  },
  {
    alert: "Road closure due to fallen tree.",
    location: "Elm Street near City Park",
    timestamp: new Date()
  },
  {
    alert: "Flash flooding reported. Use caution when driving.",
    location: "Riverside Drive and Water Street",
    timestamp: new Date()
  }
];

// @desc    Get a random safety tip
// @route   GET /traffic/safety-tips
// @access  Public
router.get('/safety-tips', (req, res) => {
  try {
    const randomIndex = Math.floor(Math.random() * safetyTips.length);
    const tip = {
      ...safetyTips[randomIndex],
      timestamp: new Date() // Update timestamp to current time
    };
    
    logger.info(`Safety tip retrieved: ${tip.tip.substring(0, 30)}...`);
    res.json(tip);
  } catch (error) {
    logger.error(`Error retrieving safety tip: ${error.message}`);
    res.status(500).json({ message: 'Server error retrieving safety tip' });
  }
});

// @desc    Get a random traffic alert
// @route   GET /traffic/alerts
// @access  Public
router.get('/alerts', (req, res) => {
  try {
    const randomIndex = Math.floor(Math.random() * trafficAlerts.length);
    const alert = {
      ...trafficAlerts[randomIndex],
      timestamp: new Date(), // Update timestamp to current time
      severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] // Add random severity
    };
    
    logger.info(`Traffic alert retrieved: ${alert.alert.substring(0, 30)}...`);
    res.json(alert);
  } catch (error) {
    logger.error(`Error retrieving traffic alert: ${error.message}`);
    res.status(500).json({ message: 'Server error retrieving traffic alert' });
  }
});

// @desc    Get all safety tips
// @route   GET /traffic/all-safety-tips
// @access  Protected (Admin only)
router.get('/all-safety-tips', protect, (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      logger.warn(`Unauthorized access attempt to all safety tips by user ${req.user._id}`);
      return res.status(403).json({ message: 'Not authorized, admin only' });
    }
    
    res.json(safetyTips);
    logger.info(`All safety tips retrieved by admin ${req.user._id}`);
  } catch (error) {
    logger.error(`Error retrieving all safety tips: ${error.message}`);
    res.status(500).json({ message: 'Server error retrieving safety tips' });
  }
});

// @desc    Get all traffic alerts
// @route   GET /traffic/all-alerts
// @access  Protected (Admin only)
router.get('/all-alerts', protect, (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      logger.warn(`Unauthorized access attempt to all traffic alerts by user ${req.user._id}`);
      return res.status(403).json({ message: 'Not authorized, admin only' });
    }
    
    res.json(trafficAlerts);
    logger.info(`All traffic alerts retrieved by admin ${req.user._id}`);
  } catch (error) {
    logger.error(`Error retrieving all traffic alerts: ${error.message}`);
    res.status(500).json({ message: 'Server error retrieving traffic alerts' });
  }
});

module.exports = router; 