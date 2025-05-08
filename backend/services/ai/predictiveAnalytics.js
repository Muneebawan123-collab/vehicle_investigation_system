/**
 * Predictive Analytics Service
 * 
 * This service provides machine learning models for predicting vehicle risks,
 * identifying patterns, and generating insights from historical data.
 */

const tf = require('@tensorflow/tfjs');
const { LinearRegression } = require('ml-regression');
const mongoose = require('mongoose');
const Vehicle = require('../../models/Vehicle');
const Incident = require('../../models/Incident');
const Document = require('../../models/document');
const logger = require('../../utils/logger');

// Initialize models
let riskPredictionModel;

/**
 * Initialize the predictive models
 */
async function initModels() {
  try {
    // Try to load risk prediction model if exists
    try {
      riskPredictionModel = await tf.loadLayersModel('file://./models/risk_prediction/model.json');
      logger.info('Risk prediction model loaded from disk');
    } catch (err) {
      logger.info('Creating new risk prediction model');
      
      // Create a new model
      riskPredictionModel = tf.sequential();
      riskPredictionModel.add(tf.layers.dense({ units: 64, activation: 'relu', inputShape: [15] }));
      riskPredictionModel.add(tf.layers.dropout({ rate: 0.2 }));
      riskPredictionModel.add(tf.layers.dense({ units: 32, activation: 'relu' }));
      riskPredictionModel.add(tf.layers.dropout({ rate: 0.2 }));
      riskPredictionModel.add(tf.layers.dense({ units: 3, activation: 'softmax' })); // 3 risk categories
      
      // Compile the model
      riskPredictionModel.compile({
        optimizer: 'adam',
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });
    }
  } catch (error) {
    logger.error('Error initializing predictive models', error);
    throw new Error('Failed to initialize predictive models');
  }
}

/**
 * Extract features from a vehicle record for risk prediction
 * @param {Object} vehicle - Vehicle document with populated incidents
 * @returns {Array} - Array of normalized features
 */
function extractRiskFeatures(vehicle) {
  const features = [];
  
  // Basic vehicle features
  const currentYear = new Date().getFullYear();
  const vehicleYear = vehicle.year ? parseInt(vehicle.year) : currentYear - 5;
  const vehicleAge = currentYear - vehicleYear;
  
  features.push(vehicleAge / 20); // Normalized vehicle age
  
  // Incident history features
  const incidents = vehicle.incidents || [];
  const incidentCount = incidents.length;
  features.push(incidentCount / 10); // Normalized incident count
  
  // Calculate incident frequency (incidents per year)
  const incidentFrequency = vehicleAge > 0 ? incidentCount / vehicleAge : 0;
  features.push(incidentFrequency / 2); // Normalized incident frequency
  
  // Calculate severity score from incidents
  let severityScore = 0;
  incidents.forEach(incident => {
    // Assign severity score based on incident type
    const type = (incident.type || '').toLowerCase();
    if (type.includes('accident') || type.includes('collision')) {
      severityScore += 5;
    } else if (type.includes('theft')) {
      severityScore += 4;
    } else if (type.includes('fire')) {
      severityScore += 6;
    } else if (type.includes('damage')) {
      severityScore += 3;
    } else if (type.includes('violation')) {
      severityScore += 2;
    } else {
      severityScore += 1;
    }
  });
  features.push(severityScore / 20); // Normalized severity score
  
  // Document status features
  const documents = vehicle.documents || [];
  const expiredDocuments = documents.filter(doc => {
    const expiryDate = doc.expiryDate ? new Date(doc.expiryDate) : null;
    return expiryDate && expiryDate < new Date();
  }).length;
  
  features.push(expiredDocuments / 5); // Normalized expired documents count
  
  // Maintenance history features
  const maintenanceRecords = documents.filter(doc => {
    const type = (doc.type || '').toLowerCase();
    return type.includes('maintenance') || type.includes('repair') || type.includes('service');
  }).length;
  
  features.push(maintenanceRecords / 10); // Normalized maintenance records count
  
  // Owner history
  features.push(vehicle.ownerChangeCount ? vehicle.ownerChangeCount / 5 : 0);
  
  // Geographic risk factor (simplified: 0-1 based on state/region)
  features.push(getGeographicRiskFactor(vehicle.registeredState || vehicle.currentState));
  
  // Vehicle type risk (based on make/model if available)
  features.push(getVehicleTypeRiskFactor(vehicle.make, vehicle.model));
  
  // Fill remaining features with zeros to maintain consistent input shape
  while (features.length < 15) {
    features.push(0);
  }
  
  return features;
}

/**
 * Calculate geographic risk factor based on location
 * @param {string} location - Vehicle registered location
 * @returns {number} - Risk factor (0-1)
 */
function getGeographicRiskFactor(location) {
  // This would ideally use real statistical data
  // For now, using a simplified approach
  const highRiskLocations = ['california', 'texas', 'florida', 'new york'];
  const mediumRiskLocations = ['illinois', 'arizona', 'georgia', 'north carolina'];
  
  if (!location) return 0.5;
  
  const normalizedLocation = location.toLowerCase().trim();
  
  if (highRiskLocations.some(loc => normalizedLocation.includes(loc))) {
    return 0.8;
  }
  
  if (mediumRiskLocations.some(loc => normalizedLocation.includes(loc))) {
    return 0.6;
  }
  
  return 0.4;
}

/**
 * Calculate vehicle type risk factor based on make and model
 * @param {string} make - Vehicle make
 * @param {string} model - Vehicle model
 * @returns {number} - Risk factor (0-1)
 */
function getVehicleTypeRiskFactor(make, model) {
  // This would ideally use real statistical data
  // For now, using a simplified approach
  if (!make) return 0.5;
  
  const normalizedMake = make.toLowerCase().trim();
  const normalizedModel = model ? model.toLowerCase().trim() : '';
  
  // Some examples based on commonly stolen or accident-prone vehicles
  const highRiskMakes = ['honda', 'toyota', 'nissan', 'chevrolet', 'ford'];
  const highRiskModels = ['civic', 'accord', 'camry', 'altima', 'silverado', 'f-150'];
  
  // Sports cars and luxury vehicles
  const highPerformanceMakes = ['ferrari', 'lamborghini', 'porsche', 'bugatti'];
  const luxuryMakes = ['mercedes', 'bmw', 'audi', 'lexus'];
  
  // Check for high-risk combinations
  if (highRiskMakes.includes(normalizedMake) && 
      highRiskModels.some(m => normalizedModel.includes(m))) {
    return 0.85;
  }
  
  // Check for high-performance vehicles
  if (highPerformanceMakes.includes(normalizedMake)) {
    return 0.9;
  }
  
  // Check for luxury vehicles
  if (luxuryMakes.includes(normalizedMake)) {
    return 0.75;
  }
  
  // Check for high-risk makes
  if (highRiskMakes.includes(normalizedMake)) {
    return 0.7;
  }
  
  return 0.5; // Default risk
}

/**
 * Predict risk level for a specific vehicle
 * @param {string} vehicleId - ID of the vehicle to analyze
 * @returns {Promise<Object>} - Risk prediction results
 */
async function predictVehicleRisk(vehicleId) {
  try {
    if (!riskPredictionModel) {
      await initModels();
    }
    
    const vehicle = await Vehicle.findById(vehicleId)
      .populate('incidents')
      .populate('documents');
      
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }
    
    // Extract features from the vehicle data
    const features = extractRiskFeatures(vehicle);
    
    // Make prediction with TensorFlow model
    const inputTensor = tf.tensor2d([features]);
    const prediction = riskPredictionModel.predict(inputTensor);
    const riskScores = await prediction.data();
    
    // Risk categories (Low, Medium, High)
    const riskLevels = ['low', 'medium', 'high'];
    const predictedRiskIndex = riskScores.indexOf(Math.max(...riskScores));
    const predictedRiskLevel = riskLevels[predictedRiskIndex];
    
    // Calculate risk factors
    const riskFactors = analyzeRiskFactors(vehicle);
    
    // Clean up tensors
    inputTensor.dispose();
    prediction.dispose();
    
    // Linear regression for predicting future incidents (simplified)
    const incidentTrend = predictIncidentTrend(vehicle);
    
    return {
      vehicleId: vehicle._id,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      licensePlate: vehicle.licensePlate,
      riskProbabilities: {
        low: riskScores[0],
        medium: riskScores[1],
        high: riskScores[2]
      },
      predictedRiskLevel,
      riskFactors,
      incidentTrend,
      recommendations: generateRiskRecommendations(predictedRiskLevel, riskFactors),
      timestamp: new Date()
    };
  } catch (error) {
    logger.error('Error in vehicle risk prediction', error);
    throw new Error('Risk prediction failed: ' + error.message);
  }
}

/**
 * Analyze specific risk factors for a vehicle
 * @param {Object} vehicle - Vehicle document with populated incidents
 * @returns {Array} - Array of identified risk factors
 */
function analyzeRiskFactors(vehicle) {
  const riskFactors = [];
  const incidents = vehicle.incidents || [];
  const documents = vehicle.documents || [];
  
  // Check vehicle age
  const currentYear = new Date().getFullYear();
  const vehicleYear = vehicle.year ? parseInt(vehicle.year) : currentYear;
  const vehicleAge = currentYear - vehicleYear;
  
  if (vehicleAge > 10) {
    riskFactors.push({
      type: 'AGE',
      description: 'Vehicle is over 10 years old',
      severity: vehicleAge > 15 ? 'high' : 'medium'
    });
  }
  
  // Check incident frequency
  if (incidents.length > 0) {
    const incidentsPerYear = vehicleAge > 0 ? incidents.length / vehicleAge : incidents.length;
    
    if (incidentsPerYear > 1) {
      riskFactors.push({
        type: 'INCIDENT_FREQUENCY',
        description: 'Multiple incidents per year',
        severity: incidentsPerYear > 2 ? 'high' : 'medium',
        value: incidentsPerYear.toFixed(2)
      });
    }
  }
  
  // Check recent severe incidents
  const recentIncidents = incidents.filter(inc => {
    const incidentDate = inc.date ? new Date(inc.date) : null;
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return incidentDate && incidentDate >= oneYearAgo;
  });
  
  const severeRecentIncidents = recentIncidents.filter(inc => {
    const type = (inc.type || '').toLowerCase();
    return type.includes('accident') || type.includes('collision') || 
           type.includes('fire') || type.includes('theft');
  });
  
  if (severeRecentIncidents.length > 0) {
    riskFactors.push({
      type: 'RECENT_SEVERE_INCIDENTS',
      description: 'Severe incidents in the past year',
      severity: 'high',
      count: severeRecentIncidents.length
    });
  }
  
  // Check document status
  const expiredDocuments = documents.filter(doc => {
    const expiryDate = doc.expiryDate ? new Date(doc.expiryDate) : null;
    return expiryDate && expiryDate < new Date();
  });
  
  if (expiredDocuments.length > 0) {
    riskFactors.push({
      type: 'EXPIRED_DOCUMENTS',
      description: 'Vehicle has expired documents',
      severity: expiredDocuments.length > 2 ? 'high' : 'medium',
      count: expiredDocuments.length
    });
  }
  
  // Check for frequent ownership changes
  if (vehicle.ownerChangeCount && vehicle.ownerChangeCount > 3) {
    riskFactors.push({
      type: 'FREQUENT_OWNERSHIP_CHANGES',
      description: 'Vehicle has changed owners multiple times',
      severity: vehicle.ownerChangeCount > 5 ? 'high' : 'medium',
      count: vehicle.ownerChangeCount
    });
  }
  
  return riskFactors;
}

/**
 * Predict future incident trend using linear regression
 * @param {Object} vehicle - Vehicle with incident history
 * @returns {Object} - Prediction results
 */
function predictIncidentTrend(vehicle) {
  try {
    const incidents = vehicle.incidents || [];
    
    // Need at least 2 incidents to predict a trend
    if (incidents.length < 2) {
      return {
        predictedNextIncident: null,
        trend: 'insufficient_data',
        confidence: 0
      };
    }
    
    // Prepare data for regression
    const incidentDates = incidents
      .filter(inc => inc.date)
      .map(inc => new Date(inc.date))
      .sort((a, b) => a - b);
      
    if (incidentDates.length < 2) {
      return {
        predictedNextIncident: null,
        trend: 'insufficient_data',
        confidence: 0
      };
    }
    
    // Convert dates to numerical values (days since first incident)
    const firstIncidentDate = incidentDates[0];
    const xValues = incidentDates.map(date => 
      Math.floor((date - firstIncidentDate) / (1000 * 60 * 60 * 24))
    );
    
    // Y values are just sequential incident numbers
    const yValues = xValues.map((_, i) => i + 1);
    
    // Create linear regression model
    const regression = new LinearRegression(xValues, yValues);
    
    // Get the time interval in days between incidents
    const averageInterval = xValues.length > 1 ? 
      xValues[xValues.length - 1] / (xValues.length - 1) : 
      365; // Default to 1 year
    
    // Predict the next incident date
    const nextIncidentX = xValues[xValues.length - 1] + averageInterval;
    const nextIncidentDays = regression.predict(nextIncidentX);
    
    // Calculate the actual date
    const nextIncidentDate = new Date(firstIncidentDate);
    nextIncidentDate.setDate(nextIncidentDate.getDate() + nextIncidentX);
    
    // Determine trend (increasing or decreasing frequency)
    const initialInterval = xValues.length > 1 ? xValues[1] - xValues[0] : averageInterval;
    const recentInterval = xValues.length > 2 ? 
      xValues[xValues.length - 1] - xValues[xValues.length - 2] : 
      averageInterval;
    
    let trend = 'stable';
    if (recentInterval < initialInterval * 0.8) {
      trend = 'increasing_frequency'; // Incidents happening more often (bad)
    } else if (recentInterval > initialInterval * 1.2) {
      trend = 'decreasing_frequency'; // Incidents happening less often (good)
    }
    
    // Calculate confidence based on R² value
    const rSquared = regression.score(xValues, yValues);
    let confidence = rSquared;
    
    // Adjust confidence based on number of data points
    if (xValues.length < 5) {
      confidence *= 0.5;
    } else if (xValues.length < 10) {
      confidence *= 0.8;
    }
    
    return {
      predictedNextIncident: nextIncidentDate,
      daysBetweenIncidents: averageInterval,
      trend,
      confidence: parseFloat(confidence.toFixed(2))
    };
  } catch (error) {
    logger.error('Error predicting incident trend', error);
    return {
      error: 'Failed to predict incident trend',
      trend: 'unknown'
    };
  }
}

/**
 * Generate recommendations based on risk assessment
 * @param {string} riskLevel - Overall risk level
 * @param {Array} riskFactors - Identified risk factors
 * @returns {Array} - Recommended actions
 */
function generateRiskRecommendations(riskLevel, riskFactors) {
  const recommendations = [];
  
  // General recommendations based on risk level
  if (riskLevel === 'high') {
    recommendations.push({
      priority: 'high',
      action: 'Schedule immediate comprehensive vehicle inspection',
      description: 'Due to high risk assessment, conduct a full mechanical and safety inspection'
    });
    
    recommendations.push({
      priority: 'high',
      action: 'Verify all documentation is current and valid',
      description: 'Ensure registration, insurance, and all required certifications are up-to-date'
    });
    
    recommendations.push({
      priority: 'medium',
      action: 'Review driver history and provide additional training if necessary',
      description: 'Consider defensive driving or specialized training programs'
    });
  } else if (riskLevel === 'medium') {
    recommendations.push({
      priority: 'medium',
      action: 'Schedule routine vehicle inspection',
      description: 'Perform standard safety and maintenance checks'
    });
    
    recommendations.push({
      priority: 'medium',
      action: 'Review vehicle maintenance schedule',
      description: 'Ensure all regular maintenance is performed on time'
    });
  } else {
    recommendations.push({
      priority: 'low',
      action: 'Maintain regular maintenance schedule',
      description: 'Continue following manufacturer-recommended maintenance intervals'
    });
  }
  
  // Specific recommendations based on risk factors
  riskFactors.forEach(factor => {
    switch (factor.type) {
      case 'AGE':
        recommendations.push({
          priority: factor.severity,
          action: 'Perform age-specific vehicle inspection',
          description: 'Focus on components that typically fail in older vehicles: suspension, electrical system, and engine components'
        });
        break;
        
      case 'INCIDENT_FREQUENCY':
        recommendations.push({
          priority: factor.severity,
          action: 'Conduct pattern analysis of previous incidents',
          description: 'Look for common causes or circumstances to prevent future occurrences'
        });
        break;
        
      case 'RECENT_SEVERE_INCIDENTS':
        recommendations.push({
          priority: 'high',
          action: 'Perform follow-up inspection related to recent incidents',
          description: 'Verify repairs were properly completed and no related issues have developed'
        });
        break;
        
      case 'EXPIRED_DOCUMENTS':
        recommendations.push({
          priority: 'high',
          action: 'Renew all expired documentation immediately',
          description: 'Update registrations, inspections, and certifications as required by law'
        });
        break;
        
      case 'FREQUENT_OWNERSHIP_CHANGES':
        recommendations.push({
          priority: factor.severity,
          action: 'Conduct title history verification',
          description: 'Verify the legitimacy of all title transfers and check for potential fraud'
        });
        break;
    }
  });
  
  return recommendations;
}

/**
 * Identify high-risk vehicles across the entire fleet
 * @param {Object} options - Search options and filters
 * @returns {Promise<Array>} - List of high-risk vehicles
 */
async function identifyHighRiskVehicles(options = {}) {
  try {
    if (!riskPredictionModel) {
      await initModels();
    }
    
    // Build query based on options
    const query = {};
    
    if (options.state) {
      query.$or = [
        { registeredState: options.state },
        { currentState: options.state }
      ];
    }
    
    if (options.make) {
      query.make = new RegExp(options.make, 'i');
    }
    
    if (options.model) {
      query.model = new RegExp(options.model, 'i');
    }
    
    // Include year range if provided
    if (options.yearFrom && options.yearTo) {
      query.year = { $gte: options.yearFrom, $lte: options.yearTo };
    } else if (options.yearFrom) {
      query.year = { $gte: options.yearFrom };
    } else if (options.yearTo) {
      query.year = { $lte: options.yearTo };
    }
    
    // Get vehicles
    const limit = options.limit || 100;
    const vehicles = await Vehicle.find(query)
      .populate('incidents')
      .populate('documents')
      .limit(limit);
      
    const results = [];
    const highRiskThreshold = 0.7;
    
    // Process each vehicle
    for (const vehicle of vehicles) {
      const features = extractRiskFeatures(vehicle);
      const inputTensor = tf.tensor2d([features]);
      const prediction = riskPredictionModel.predict(inputTensor);
      const riskScores = await prediction.data();
      
      const highRiskProbability = riskScores[2]; // Index 2 is high risk
      
      if (highRiskProbability > highRiskThreshold) {
        const riskFactors = analyzeRiskFactors(vehicle);
        
        results.push({
          vehicleId: vehicle._id,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          licensePlate: vehicle.licensePlate,
          riskProbability: highRiskProbability,
          riskFactors: riskFactors.map(f => f.type).join(', '),
          factorCount: riskFactors.length
        });
      }
      
      // Clean up tensors
      inputTensor.dispose();
      prediction.dispose();
    }
    
    // Sort by risk probability (highest first)
    results.sort((a, b) => b.riskProbability - a.riskProbability);
    
    return results;
  } catch (error) {
    logger.error('Error identifying high-risk vehicles', error);
    throw new Error('High-risk vehicle identification failed');
  }
}

/**
 * Train the risk prediction model with labeled data
 * @param {Array} trainingData - Array of labeled examples
 * @returns {Promise<Object>} - Training results
 */
async function trainRiskModel(trainingData) {
  try {
    if (!riskPredictionModel) {
      await initModels();
    }
    
    // Prepare features and labels
    const features = trainingData.map(item => item.features);
    const labels = trainingData.map(item => {
      // One-hot encode the risk level
      const riskLevel = item.riskLevel.toLowerCase();
      if (riskLevel === 'high') return [0, 0, 1];
      if (riskLevel === 'medium') return [0, 1, 0];
      return [1, 0, 0]; // low risk
    });
    
    const xs = tf.tensor2d(features);
    const ys = tf.tensor2d(labels);
    
    // Train the model
    const history = await riskPredictionModel.fit(xs, ys, {
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
    await riskPredictionModel.save('file://./models/risk_prediction');
    
    // Clean up tensors
    xs.dispose();
    ys.dispose();
    
    return {
      success: true,
      message: 'Risk prediction model trained successfully',
      history: history.history
    };
  } catch (error) {
    logger.error('Error training risk model', error);
    throw new Error('Failed to train risk prediction model');
  }
}

// Initialize models when the service starts
initModels().catch(err => {
  logger.error('Failed to initialize predictive models', err);
});

module.exports = {
  predictVehicleRisk,
  identifyHighRiskVehicles,
  trainRiskModel
}; 