/**
 * Fraud Detection Service
 * 
 * This service implements machine learning algorithms to detect fraudulent 
 * patterns in vehicle data, incident reports, and user behavior.
 */

const tf = require('@tensorflow/tfjs');
const mongoose = require('mongoose');
const Vehicle = require('../../models/Vehicle');
const Incident = require('../../models/Incident');
const User = require('../../models/User');
const logger = require('../../utils/logger');
const path = require('path');
const fs = require('fs');

// Load local models or initialize new ones
let fraudModel;

/**
 * Initialize the fraud detection model
 * Either loads a pre-trained model or creates a new one
 */
async function initModel() {
  try {
    const modelPath = path.join(__dirname, '../../models/fraud_detection/model.json');
    
    // Check if model file exists
    if (fs.existsSync(modelPath)) {
      try {
        fraudModel = await tf.loadLayersModel(`file://${modelPath}`);
        logger.info('Fraud detection model loaded from disk');
        return;
      } catch (err) {
        logger.warn('Failed to load existing model, creating new one', err);
      }
    }

    // Create a new model if loading fails or file doesn't exist
    logger.info('Creating new fraud detection model');
    fraudModel = tf.sequential();
    fraudModel.add(tf.layers.dense({ units: 64, activation: 'relu', inputShape: [20] }));
    fraudModel.add(tf.layers.dropout({ rate: 0.2 }));
    fraudModel.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    fraudModel.add(tf.layers.dropout({ rate: 0.2 }));
    fraudModel.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

    // Compile the model
    fraudModel.compile({
      optimizer: 'adam',
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    // Save the model
    const saveDir = path.join(__dirname, '../../models/fraud_detection');
    if (!fs.existsSync(saveDir)) {
      fs.mkdirSync(saveDir, { recursive: true });
    }
    await fraudModel.save(`file://${modelPath}`);
    logger.info('New fraud detection model created and saved');
  } catch (error) {
    logger.error('Error initializing fraud detection model', error);
    throw new Error('Failed to initialize fraud detection model: ' + error.message);
  }
}

/**
 * Extract features from a vehicle record for fraud detection
 * @param {Object} vehicle - Vehicle document
 * @returns {Array} - Array of normalized features
 */
function extractFeaturesFromVehicle(vehicle) {
  const features = [];
  
  // Push relevant features (normalized)
  features.push(vehicle.modificationCount ? vehicle.modificationCount / 10 : 0); // Normalized modification count
  features.push(vehicle.ownerChangeCount ? vehicle.ownerChangeCount / 5 : 0); // Normalized owner change count
  features.push(vehicle.incidents && vehicle.incidents.length ? vehicle.incidents.length / 5 : 0); // Normalized incident count
  features.push(vehicle.registeredState === vehicle.currentState ? 0 : 1); // State mismatch flag
  
  // Check for age inconsistencies
  const yearRegex = /\b(19|20)\d{2}\b/;
  const yearMatch = vehicle.manufacturingYear?.match(yearRegex);
  const manufactureYear = yearMatch ? parseInt(yearMatch[0]) : null;
  const currentYear = new Date().getFullYear();
  features.push(manufactureYear ? (currentYear - manufactureYear) / 30 : 0.5); // Normalized vehicle age
  
  // Fill remaining features with zeros to maintain consistent input shape
  while (features.length < 20) {
    features.push(0);
  }
  
  return features;
}

/**
 * Detect potential fraud for a specific vehicle
 * @param {string} vehicleId - ID of the vehicle to check
 * @returns {Object} - Fraud analysis results
 */
async function detectVehicleFraud(vehicleId) {
  try {
    if (!fraudModel) {
      await initModel();
    }
    
    const vehicle = await Vehicle.findById(vehicleId)
      .populate('incidents')
      .populate('documents');
      
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }
    
    // Extract features from the vehicle data
    const features = extractFeaturesFromVehicle(vehicle);
    
    // Make prediction
    const inputTensor = tf.tensor2d([features]);
    const prediction = fraudModel.predict(inputTensor);
    const fraudScore = await prediction.data();
    
    // Analyze specific fraud patterns
    const fraudPatterns = analyzeFraudPatterns(vehicle);
    
    // Clean up tensors
    inputTensor.dispose();
    prediction.dispose();
    
    return {
      vehicleId: vehicle._id,
      fraudProbability: fraudScore[0],
      riskLevel: getFraudRiskLevel(fraudScore[0]),
      suspiciousPatterns: fraudPatterns,
      timestamp: new Date()
    };
  } catch (error) {
    logger.error('Error in fraud detection', error);
    throw new Error('Fraud detection failed: ' + error.message);
  }
}

/**
 * Get risk level based on fraud probability score
 * @param {number} score - Fraud probability score
 * @returns {string} - Risk level (low, medium, high)
 */
function getFraudRiskLevel(score) {
  if (score < 0.3) return 'low';
  if (score < 0.7) return 'medium';
  return 'high';
}

/**
 * Analyze vehicle data for known fraud patterns
 * @param {Object} vehicle - Vehicle document
 * @returns {Array} - Array of detected suspicious patterns
 */
function analyzeFraudPatterns(vehicle) {
  const patterns = [];
  
  // Check for VIN inconsistencies
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vehicle.vin)) {
    patterns.push({
      type: 'VIN_FORMAT_INVALID',
      description: 'Vehicle Identification Number format is invalid',
      severity: 'high'
    });
  }
  
  // Check for odometer tampering indicators
  const incidents = vehicle.incidents || [];
  const odometerReadings = incidents
    .filter(inc => inc.odometerReading)
    .map(inc => ({ 
      reading: parseInt(inc.odometerReading), 
      date: new Date(inc.date) 
    }))
    .sort((a, b) => a.date - b.date);
    
  if (odometerReadings.length >= 2) {
    for (let i = 1; i < odometerReadings.length; i++) {
      if (odometerReadings[i].reading < odometerReadings[i-1].reading) {
        patterns.push({
          type: 'ODOMETER_ROLLBACK',
          description: 'Possible odometer rollback detected',
          severity: 'high',
          data: {
            before: odometerReadings[i-1],
            after: odometerReadings[i]
          }
        });
        break;
      }
    }
  }
  
  // Check for frequent ownership changes
  if (vehicle.ownerChangeCount && vehicle.ownerChangeCount > 3) {
    patterns.push({
      type: 'FREQUENT_OWNERSHIP_CHANGE',
      description: 'Frequent ownership changes detected',
      severity: 'medium',
      count: vehicle.ownerChangeCount
    });
  }
  
  return patterns;
}

/**
 * Analyze a batch of vehicles for fraud patterns
 * @returns {Promise<Array>} - List of vehicles with fraud risk
 */
async function batchFraudDetection() {
  try {
    if (!fraudModel) {
      await initModel();
    }
    
    // Get all vehicles or a subset for batch analysis
    const vehicles = await Vehicle.find({})
      .populate('incidents')
      .limit(100);
      
    const results = [];
    
    for (const vehicle of vehicles) {
      const features = extractFeaturesFromVehicle(vehicle);
      const inputTensor = tf.tensor2d([features]);
      const prediction = fraudModel.predict(inputTensor);
      const fraudScore = await prediction.data();
      
      if (fraudScore[0] > 0.5) {
        results.push({
          vehicleId: vehicle._id,
          vin: vehicle.vin,
          licensePlate: vehicle.licensePlate,
          fraudProbability: fraudScore[0],
          riskLevel: getFraudRiskLevel(fraudScore[0])
        });
      }
      
      // Clean up tensors
      inputTensor.dispose();
      prediction.dispose();
    }
    
    return results;
  } catch (error) {
    logger.error('Error in batch fraud detection', error);
    throw new Error('Batch fraud detection failed');
  }
}

/**
 * Train the fraud detection model with labeled data
 * @param {Array} trainingData - Array of labeled examples
 * @returns {Promise<Object>} - Training results
 */
async function trainFraudModel(trainingData) {
  try {
    if (!fraudModel) {
      await initModel();
    }
    
    // Prepare features and labels
    const features = trainingData.map(item => item.features);
    const labels = trainingData.map(item => item.isFraudulent ? 1 : 0);
    
    const xs = tf.tensor2d(features);
    const ys = tf.tensor2d(labels, [labels.length, 1]);
    
    // Train the model
    const history = await fraudModel.fit(xs, ys, {
      epochs: 50,
      batchSize: 32,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          logger.info(`Epoch ${epoch}: loss = ${logs.loss}, accuracy = ${logs.acc}`);
        }
      }
    });
    
    // Save the trained model
    await fraudModel.save('file://./models/fraud_detection');
    
    // Clean up tensors
    xs.dispose();
    ys.dispose();
    
    return {
      success: true,
      message: 'Fraud detection model trained successfully',
      history: history.history
    };
  } catch (error) {
    logger.error('Error training fraud model', error);
    throw new Error('Failed to train fraud detection model');
  }
}

// Initialize the model when the service starts
initModel().catch(err => {
  logger.error('Failed to initialize fraud detection model', err);
});

module.exports = {
  detectVehicleFraud,
  batchFraudDetection,
  trainFraudModel
}; 