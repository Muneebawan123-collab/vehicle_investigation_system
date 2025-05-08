/**
 * Image Analysis Service
 * 
 * This service uses deep learning models to analyze vehicle images 
 * for damage detection, severity assessment, and cost estimation.
 */

const tf = require('@tensorflow/tfjs');
const cocoSsd = require('@tensorflow-models/coco-ssd');
const mobilenet = require('@tensorflow-models/mobilenet');
const fs = require('fs');
const path = require('path');
const jimp = require('jimp');
const logger = require('../../utils/logger');

// Initialize models
let damageDetectionModel;
let objectDetectionModel;
let classificationModel;

/**
 * Initialize all required models for image analysis
 */
async function initModels() {
  try {
    // Initialize object detection model (COCO-SSD)
    objectDetectionModel = await cocoSsd.load();
    logger.info('Object detection model loaded');
    
    // Initialize image classification model (MobileNet)
    classificationModel = await mobilenet.load();
    logger.info('Image classification model loaded');
    
    // Try to load custom damage detection model if exists
    try {
      damageDetectionModel = await tf.loadLayersModel('file://./models/damage_detection/model.json');
      logger.info('Damage detection model loaded from disk');
    } catch (err) {
      logger.info('Creating new damage detection model');
      
      // Create a new model for damage detection
      damageDetectionModel = tf.sequential();
      damageDetectionModel.add(tf.layers.conv2d({
        inputShape: [224, 224, 3],
        filters: 32,
        kernelSize: 3,
        activation: 'relu'
      }));
      damageDetectionModel.add(tf.layers.maxPooling2d({ poolSize: 2 }));
      damageDetectionModel.add(tf.layers.conv2d({
        filters: 64,
        kernelSize: 3,
        activation: 'relu'
      }));
      damageDetectionModel.add(tf.layers.maxPooling2d({ poolSize: 2 }));
      damageDetectionModel.add(tf.layers.flatten());
      damageDetectionModel.add(tf.layers.dense({ units: 128, activation: 'relu' }));
      damageDetectionModel.add(tf.layers.dense({ units: 5, activation: 'softmax' })); // 5 damage categories
      
      // Compile the model
      damageDetectionModel.compile({
        optimizer: 'adam',
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });
    }
  } catch (error) {
    logger.error('Error initializing image analysis models', error);
    throw new Error('Failed to initialize image analysis models');
  }
}

/**
 * Process an image file for analysis
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<tf.Tensor3D>} - Processed image tensor
 */
async function processImage(imagePath) {
  try {
    // Read the image file using jimp
    const image = await jimp.read(imagePath);
    
    // Resize to expected dimensions
    image.resize(224, 224);
    
    // Convert image to a format TensorFlow.js can work with
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    const buffer = new Uint8Array(width * height * 3);
    
    let i = 0;
    image.scan(0, 0, width, height, function (x, y, idx) {
      buffer[i++] = this.bitmap.data[idx + 0]; // R
      buffer[i++] = this.bitmap.data[idx + 1]; // G
      buffer[i++] = this.bitmap.data[idx + 2]; // B
    });
    
    // Create tensor from pixel data
    const tensor = tf.tensor3d(buffer, [height, width, 3]);
    
    // Normalize pixel values (0-255 to 0-1)
    const normalized = tensor.toFloat().div(tf.scalar(255));
    
    return normalized;
  } catch (error) {
    logger.error('Error processing image', error);
    throw new Error('Failed to process image for analysis');
  }
}

/**
 * Detect and classify vehicle damage from an image
 * @param {string} imagePath - Path to the vehicle image
 * @returns {Promise<Object>} - Damage analysis results
 */
async function analyzeVehicleDamage(imagePath) {
  try {
    if (!damageDetectionModel || !objectDetectionModel || !classificationModel) {
      await initModels();
    }
    
    // Process the image for analysis
    const imageBuffer = fs.readFileSync(imagePath);
    const processedImage = await processImage(imagePath);
    const expandedImage = processedImage.expandDims(0);
    
    // Perform object detection to locate the vehicle
    const objects = await objectDetectionModel.detect(imageBuffer);
    const vehicleObjects = objects.filter(obj => 
      ['car', 'truck', 'bus', 'motorcycle'].includes(obj.class.toLowerCase())
    );
    
    // Perform general classification
    const classifications = await classificationModel.classify(processedImage);
    
    // Perform damage detection
    const damageDetection = damageDetectionModel.predict(expandedImage);
    const damageScores = await damageDetection.data();
    
    // Damage categories
    const damageCategories = [
      'No Damage',
      'Minor Scratch',
      'Dent',
      'Broken Part',
      'Severe Damage'
    ];
    
    // Map scores to categories
    const damages = [];
    for (let i = 0; i < damageScores.length; i++) {
      if (damageScores[i] > 0.3) { // Threshold for detection
        damages.push({
          type: damageCategories[i],
          probability: damageScores[i],
          severity: getSeverityLevel(damageCategories[i])
        });
      }
    }
    
    // Estimate repair costs based on damage
    const costEstimate = estimateRepairCost(damages);
    
    // Clean up tensors
    processedImage.dispose();
    expandedImage.dispose();
    damageDetection.dispose();
    
    return {
      vehicleDetected: vehicleObjects.length > 0,
      vehicleType: vehicleObjects.length > 0 ? vehicleObjects[0].class : null,
      vehicleBoundingBox: vehicleObjects.length > 0 ? vehicleObjects[0].bbox : null,
      detectedObjects: objects,
      classifications: classifications,
      damages: damages,
      overallDamageLevel: getOverallDamageLevel(damages),
      repairCostEstimate: costEstimate,
      timestamp: new Date()
    };
  } catch (error) {
    logger.error('Error analyzing vehicle damage', error);
    throw new Error('Vehicle damage analysis failed: ' + error.message);
  }
}

/**
 * Determine severity level for a damage type
 * @param {string} damageType - Type of damage
 * @returns {string} - Severity level
 */
function getSeverityLevel(damageType) {
  const severityMap = {
    'No Damage': 'none',
    'Minor Scratch': 'low',
    'Dent': 'medium',
    'Broken Part': 'high',
    'Severe Damage': 'critical'
  };
  
  return severityMap[damageType] || 'unknown';
}

/**
 * Calculate overall damage level based on individual damages
 * @param {Array} damages - Array of detected damages
 * @returns {string} - Overall damage level
 */
function getOverallDamageLevel(damages) {
  if (damages.length === 0) return 'none';
  
  // Check for critical damage
  if (damages.some(d => d.severity === 'critical')) return 'critical';
  
  // Check for high damage
  if (damages.some(d => d.severity === 'high')) return 'high';
  
  // Check for medium damage
  if (damages.some(d => d.severity === 'medium')) return 'medium';
  
  // Must be low or none
  return damages.some(d => d.severity === 'low') ? 'low' : 'none';
}

/**
 * Estimate repair costs based on damage assessment
 * @param {Array} damages - Array of detected damages
 * @returns {Object} - Cost estimate range
 */
function estimateRepairCost(damages) {
  if (damages.length === 0) return { min: 0, max: 0, currency: 'INR' };
  
  const costRanges = {
    'No Damage': [0, 0],
    'Minor Scratch': [100, 500],
    'Dent': [500, 2000],
    'Broken Part': [1000, 5000],
    'Severe Damage': [5000, 20000]
  };
  
  let minTotal = 0;
  let maxTotal = 0;
  
  // Calculate total cost range
  damages.forEach(damage => {
    const [min, max] = costRanges[damage.type] || [0, 0];
    minTotal += min;
    maxTotal += max;
  });
  
  // Convert USD to INR (approximate conversion rate)
  const conversionRate = 75;
  minTotal = minTotal * conversionRate;
  maxTotal = maxTotal * conversionRate;
  
  return {
    min: minTotal,
    max: maxTotal,
    currency: 'INR'
  };
}

/**
 * Train the damage detection model with new images
 * @param {Array} trainingData - Array of labeled examples
 * @returns {Promise<Object>} - Training results
 */
async function trainDamageModel(trainingData) {
  try {
    if (!damageDetectionModel) {
      await initModels();
    }
    
    // Process training images
    const xs = [];
    const ys = [];
    
    for (const item of trainingData) {
      // Process the image
      const processedImage = await processImage(item.imagePath);
      const expandedImage = processedImage.expandDims(0);
      
      // Create one-hot encoded label
      const label = tf.oneHot(tf.tensor1d([item.damageType], 'int32'), 5);
      
      xs.push(expandedImage);
      ys.push(label);
      
      // Clean up tensors
      processedImage.dispose();
    }
    
    // Combine all examples
    const xDataset = tf.concat(xs, 0);
    const yDataset = tf.concat(ys, 0);
    
    // Train the model
    const history = await damageDetectionModel.fit(xDataset, yDataset, {
      epochs: 10,
      batchSize: 16,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          logger.info(`Epoch ${epoch}: loss = ${logs.loss}, accuracy = ${logs.acc}`);
        }
      }
    });
    
    // Save the trained model
    await damageDetectionModel.save('file://./models/damage_detection');
    
    // Clean up tensors
    xDataset.dispose();
    yDataset.dispose();
    xs.forEach(tensor => tensor.dispose());
    ys.forEach(tensor => tensor.dispose());
    
    return {
      success: true,
      message: 'Damage detection model trained successfully',
      history: history.history
    };
  } catch (error) {
    logger.error('Error training damage model', error);
    throw new Error('Failed to train damage detection model');
  }
}

// Initialize models when the service starts
initModels().catch(err => {
  logger.error('Failed to initialize image analysis models', err);
});

module.exports = {
  analyzeVehicleDamage,
  trainDamageModel
}; 