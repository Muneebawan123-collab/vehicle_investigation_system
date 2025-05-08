/**
 * AI Controller
 * 
 * This controller handles routes related to AI features including
 * fraud detection, image analysis, report generation, and risk prediction
 */

const asyncHandler = require('express-async-handler');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Vehicle = require('../models/Vehicle');
const Incident = require('../models/Incident');
const Document = require('../models/document');
const fraudDetection = require('../services/ai/fraudDetection');
const imageAnalysis = require('../services/ai/imageAnalysis');
const nlpService = require('../services/ai/nlpService');
const predictiveAnalytics = require('../services/ai/predictiveAnalytics');
const logger = require('../utils/logger');
const AuditLog = require('../models/auditModel');

/**
 * @desc    Detect fraud for a specific vehicle
 * @route   GET /api/ai/fraud/:vehicleId
 * @access  Private (Officer, Investigator, Admin)
 */
const detectVehicleFraud = asyncHandler(async (req, res) => {
  const vehicleId = req.params.vehicleId;
  
  if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
    res.status(400);
    throw new Error('Invalid vehicle ID');
  }
  
  const fraudAnalysis = await fraudDetection.detectVehicleFraud(vehicleId);
  
  // Record audit log
  await AuditLog.create({
    user: req.user._id,
    action: 'FRAUD_DETECTION',
    resource: 'Vehicle',
    resourceId: vehicleId,
    details: `Fraud analysis performed with result: ${fraudAnalysis.riskLevel}`
  });
  
  res.status(200).json(fraudAnalysis);
});

/**
 * @desc    Run batch fraud detection across vehicles
 * @route   GET /api/ai/fraud/batch
 * @access  Private (Investigator, Admin)
 */
const batchFraudDetection = asyncHandler(async (req, res) => {
  const results = await fraudDetection.batchFraudDetection();
  
  // Record audit log
  await AuditLog.create({
    user: req.user._id,
    action: 'BATCH_FRAUD_DETECTION',
    resource: 'Vehicles',
    details: `Batch fraud detection found ${results.length} suspicious vehicles`
  });
  
  res.status(200).json(results);
});

/**
 * @desc    Analyze damage from vehicle image
 * @route   POST /api/ai/damage-analysis
 * @access  Private (Officer, Investigator, Admin)
 */
const analyzeVehicleDamage = asyncHandler(async (req, res) => {
  // Check if image was uploaded
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload an image');
  }
  
  const imagePath = req.file.path;
  const vehicleId = req.body.vehicleId;
  
  if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
    res.status(400);
    throw new Error('Invalid vehicle ID');
  }
  
  try {
    // Analyze image
    const analysisResults = await imageAnalysis.analyzeVehicleDamage(imagePath);
    
    // Associate results with the vehicle if needed
    if (req.body.saveToVehicle === 'true') {
      const vehicle = await Vehicle.findById(vehicleId);
      
      if (!vehicle) {
        res.status(404);
        throw new Error('Vehicle not found');
      }
      
      // Create a new incident for the damage if requested
      if (req.body.createIncident === 'true') {
        const incident = await Incident.create({
          vehicle: vehicleId,
          type: 'Damage Assessment',
          status: 'Open',
          description: `AI damage assessment detected ${analysisResults.overallDamageLevel} damage.`,
          reportedBy: req.user.name,
          assignedTo: req.user._id,
          date: new Date(),
          aiGenerated: true,
          damageLevel: analysisResults.overallDamageLevel,
          estimatedCost: analysisResults.repairCostEstimate,
          notes: JSON.stringify(analysisResults.damages)
        });
        
        // Link incident to vehicle
        if (!vehicle.incidents) {
          vehicle.incidents = [];
        }
        vehicle.incidents.push(incident._id);
        await vehicle.save();
      }
    }
    
    // Record audit log
    await AuditLog.create({
      user: req.user._id,
      action: 'DAMAGE_ANALYSIS',
      resource: 'Vehicle',
      resourceId: vehicleId,
      details: `Damage analysis performed with result: ${analysisResults.overallDamageLevel}`
    });
    
    res.status(200).json(analysisResults);
  } catch (error) {
    logger.error('Error in damage analysis:', error);
    res.status(500);
    throw new Error('Error analyzing vehicle damage: ' + error.message);
  } finally {
    // Clean up the temporary file if needed
    if (req.body.cleanupFile === 'true' && fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
  }
});

/**
 * @desc    Generate a report for an incident
 * @route   GET /api/ai/report/:incidentId
 * @access  Private (Officer, Investigator, Admin)
 */
const generateIncidentReport = asyncHandler(async (req, res) => {
  const incidentId = req.params.incidentId;
  
  if (!mongoose.Types.ObjectId.isValid(incidentId)) {
    res.status(400);
    throw new Error('Invalid incident ID');
  }
  
  // Get incident with related data
  const incident = await Incident.findById(incidentId);
  
  if (!incident) {
    res.status(404);
    throw new Error('Incident not found');
  }
  
  // Get related vehicle
  const vehicle = await Vehicle.findById(incident.vehicle);
  
  if (!vehicle) {
    res.status(404);
    throw new Error('Related vehicle not found');
  }
  
  // Get related documents
  const documents = await Document.find({ 
    $or: [
      { vehicle: vehicle._id },
      { incident: incident._id }
    ]
  });
  
  // Generate report
  const report = await nlpService.generateIncidentReport(incident, vehicle, documents);
  
  // Save report if requested
  if (req.query.save === 'true') {
    // Create a document for the report
    await Document.create({
      title: report.title,
      type: 'Report',
      description: report.summary,
      vehicle: vehicle._id,
      incident: incident._id,
      createdBy: req.user._id,
      content: JSON.stringify(report),
      referenceNumber: report.referenceNumber,
      aiGenerated: true
    });
    
    // Update incident with report reference
    incident.report = report.referenceNumber;
    await incident.save();
  }
  
  // Record audit log
  await AuditLog.create({
    user: req.user._id,
    action: 'GENERATE_REPORT',
    resource: 'Incident',
    resourceId: incidentId,
    details: `AI-generated report: ${report.title}`
  });
  
  res.status(200).json(report);
});

/**
 * @desc    Analyze document content with NLP
 * @route   POST /api/ai/analyze-document
 * @access  Private (Officer, Investigator, Admin)
 */
const analyzeDocument = asyncHandler(async (req, res) => {
  // Check if document was uploaded or text was provided
  if (!req.file && !req.body.text) {
    res.status(400);
    throw new Error('Please upload a document or provide text');
  }
  
  let textContent = req.body.text;
  
  // If file was uploaded, read its content
  if (req.file) {
    const filePath = req.file.path;
    textContent = fs.readFileSync(filePath, 'utf8');
    
    // Clean up file if needed
    if (req.body.cleanupFile === 'true') {
      fs.unlinkSync(filePath);
    }
  }
  
  // Analyze document text
  const analysis = await nlpService.extractDocumentInformation(textContent);
  
  // Save analysis if requested and document ID provided
  if (req.body.saveToDocument === 'true' && req.body.documentId) {
    const documentId = req.body.documentId;
    
    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      res.status(400);
      throw new Error('Invalid document ID');
    }
    
    const document = await Document.findById(documentId);
    
    if (!document) {
      res.status(404);
      throw new Error('Document not found');
    }
    
    // Update document with analysis
    document.aiAnalysis = analysis;
    await document.save();
    
    // Record audit log
    await AuditLog.create({
      user: req.user._id,
      action: 'DOCUMENT_ANALYSIS',
      resource: 'Document',
      resourceId: documentId,
      details: 'Document analyzed with NLP'
    });
  }
  
  res.status(200).json(analysis);
});

/**
 * @desc    Predict risk level for a vehicle
 * @route   GET /api/ai/risk/:vehicleId
 * @access  Private (Officer, Investigator, Admin)
 */
const predictVehicleRisk = asyncHandler(async (req, res) => {
  const vehicleId = req.params.vehicleId;
  
  if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
    res.status(400);
    throw new Error('Invalid vehicle ID');
  }
  
  const riskPrediction = await predictiveAnalytics.predictVehicleRisk(vehicleId);
  
  // Save risk assessment if requested
  if (req.query.save === 'true') {
    const vehicle = await Vehicle.findById(vehicleId);
    
    if (!vehicle) {
      res.status(404);
      throw new Error('Vehicle not found');
    }
    
    // Update vehicle with risk assessment
    vehicle.riskAssessment = {
      level: riskPrediction.predictedRiskLevel,
      score: Math.max(
        riskPrediction.riskProbabilities.low,
        riskPrediction.riskProbabilities.medium,
        riskPrediction.riskProbabilities.high
      ),
      factors: riskPrediction.riskFactors.map(f => f.type),
      timestamp: new Date()
    };
    
    await vehicle.save();
  }
  
  // Record audit log
  await AuditLog.create({
    user: req.user._id,
    action: 'RISK_PREDICTION',
    resource: 'Vehicle',
    resourceId: vehicleId,
    details: `Risk assessment performed with result: ${riskPrediction.predictedRiskLevel}`
  });
  
  res.status(200).json(riskPrediction);
});

/**
 * @desc    Find high risk vehicles
 * @route   GET /api/ai/high-risk-vehicles
 * @access  Private (Investigator, Admin)
 */
const identifyHighRiskVehicles = asyncHandler(async (req, res) => {
  // Extract filter options from query params
  const options = {
    state: req.query.state,
    make: req.query.make,
    model: req.query.model,
    yearFrom: req.query.yearFrom,
    yearTo: req.query.yearTo,
    limit: req.query.limit ? parseInt(req.query.limit) : 100
  };
  
  const highRiskVehicles = await predictiveAnalytics.identifyHighRiskVehicles(options);
  
  // Record audit log
  await AuditLog.create({
    user: req.user._id,
    action: 'HIGH_RISK_VEHICLE_SEARCH',
    resource: 'Vehicles',
    details: `Found ${highRiskVehicles.length} high-risk vehicles`
  });
  
  res.status(200).json(highRiskVehicles);
});

/**
 * @desc    Train AI models with new data
 * @route   POST /api/ai/train/:modelType
 * @access  Private (Admin)
 */
const trainModel = asyncHandler(async (req, res) => {
  const { modelType } = req.params;
  const trainingData = req.body.trainingData;
  
  if (!trainingData || !Array.isArray(trainingData)) {
    res.status(400);
    throw new Error('Please provide valid training data array');
  }
  
  let result;
  
  switch (modelType) {
    case 'fraud':
      result = await fraudDetection.trainFraudModel(trainingData);
      break;
    case 'damage':
      result = await imageAnalysis.trainDamageModel(trainingData);
      break;
    case 'risk':
      result = await predictiveAnalytics.trainRiskModel(trainingData);
      break;
    default:
      res.status(400);
      throw new Error('Invalid model type specified');
  }
  
  // Record audit log
  await AuditLog.create({
    user: req.user._id,
    action: 'TRAIN_AI_MODEL',
    resource: 'AI Model',
    details: `Training ${modelType} model with ${trainingData.length} examples`
  });
  
  res.status(200).json(result);
});

module.exports = {
  detectVehicleFraud,
  batchFraudDetection,
  analyzeVehicleDamage,
  generateIncidentReport,
  analyzeDocument,
  predictVehicleRisk,
  identifyHighRiskVehicles,
  trainModel
}; 