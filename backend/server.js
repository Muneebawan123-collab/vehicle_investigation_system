const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');

// Load environment variables
dotenv.config();

// Import utilities and configurations
const connectDB = require('./config/database');
const logger = require('./config/logger');
const { notFound, errorHandler, mongooseValidationError, duplicateKeyError } = require('./middleware/errorMiddleware');
const { testCloudinaryConnection } = require('./config/cloudinary');

// Load and register models first
const Notification = require('./models/Notification');

// Import routes after models are registered
const userRoutes = require('./routes/userRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const incidentRoutes = require('./routes/incidentRoutes');
const documentRoutes = require('./routes/documentRoutes');
const chatRoutes = require('./routes/chatRoutes');
const trafficRoutes = require('./routes/trafficRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const aiRoutes = require('./routes/aiRoutes');

// Conditionally load AI features if dependencies are available
/* Removing mock routes since we now have real AI routes
let aiRoutes = express.Router();
try {
  console.log('Loading AI routes in mock mode...');
  
  // Create a mock implementation of AI routes
  // Health check route always returns success
  aiRoutes.get('/health-check', (req, res) => {
    console.log('AI health check route hit - returning mock success');
    res.status(200).json({
      status: 'success',
      message: 'AI features are available (mock mode)',
      features: ['fraud-detection', 'damage-analysis', 'report-generation', 'risk-prediction'],
      mode: 'mock'
    });
  });
  
  // Mock fraud detection endpoint
  aiRoutes.get('/fraud/:vehicleId', (req, res) => {
    console.log('Mock fraud detection for vehicle:', req.params.vehicleId);
    res.status(200).json({
      status: 'success',
      vehicle: req.params.vehicleId,
      riskScore: Math.floor(Math.random() * 100),
      findings: [
        'Mock analysis - no actual ML processing performed',
        'This is a simulated result',
        'Install TensorFlow.js for actual AI processing'
      ],
      mode: 'mock'
    });
  });
  
  // Mock damage analysis endpoint
  aiRoutes.post('/damage-analysis', (req, res) => {
    console.log('Mock damage analysis request received');
    res.status(200).json({
      status: 'success',
      damages: [
        { type: 'Scratch', confidence: 0.89, location: 'Driver side door', severity: 'Low' },
        { type: 'Dent', confidence: 0.76, location: 'Front bumper', severity: 'Medium' }
      ],
      estimatedCost: '$450 - $800',
      message: 'Mock analysis - no actual image processing performed',
      mode: 'mock'
    });
  });
  
  console.log('AI features are enabled in mock mode');
  
  // Try to load real TensorFlow.js later if available
  try {
    const tf = require('@tensorflow/tfjs-node-cpu');
    console.log('TensorFlow.js loaded successfully:', tf.version);
    console.log('Real AI processing available!');
  } catch (tfError) {
    console.log('TensorFlow.js not available, continuing in mock mode');
  }
} catch (error) {
  console.error('Error setting up mock AI routes:', error.message);
  
  // Fallback to basic mock routes
  aiRoutes.all('/*', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'AI features are in mock mode',
      data: { mockResult: true }
    });
  });
}
*/

// Logging that we're using real AI routes
console.log('Using real AI routes from aiRoutes.js');

// Create Express app
const app = express();
// Make app globally available
global.app = app;

// Create HTTP server
const server = http.createServer(app);
// Create Socket.IO instance
const io = socketIo(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Store active user connections
const userSockets = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`New client connected: ${socket.id}`);
  
  // User authentication for socket
  socket.on('authenticate', (userId) => {
    if (userId) {
      logger.info(`User authenticated: ${userId}`);
      // Add this socket to user's connections
      userSockets.set(userId, socket.id);
      socket.userId = userId;
    }
  });
  
  // Handle client disconnection
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
    if (socket.userId) {
      userSockets.delete(socket.userId);
    }
  });
});

// Make io accessible to routes
app.set('io', io);
app.set('userSockets', userSockets);

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], // Allow your frontend domains
  credentials: true, // Allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Cache-Control', 
    'X-Requested-With', 
    'Accept',
    'Pragma',
    'Expires',
    'X-Debug-Info'  // Add this header to allowed list
  ]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', userRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/traffic', trafficRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);

// Connect to MongoDB
connectDB()
  .then(() => {
    logger.info('MongoDB Connected Successfully');
    // Test Cloudinary connection after MongoDB is connected
    testCloudinaryConnection();
  })
  .catch(err => {
    logger.error('MongoDB Connection Error:', err);
    process.exit(1);
  });

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Create models directories for AI models if enabled
try {
  const modelsDir = path.join(__dirname, 'models');
  const aiModelDirs = ['fraud_detection', 'damage_detection', 'risk_prediction'];
  
  if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir);
  }
  
  for (const dir of aiModelDirs) {
    const fullPath = path.join(modelsDir, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  }
} catch (error) {
  logger.warn('Could not create AI model directories', error);
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      connectSrc: ["'self'", "http://localhost:5173", "http://localhost:5000"],
      imgSrc: ["'self'", "http://localhost:5173", "http://localhost:5000", "data:", "blob:"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", "data:"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Increased from 100 to 500 requests per window
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting for local development
  skip: (req, res) => {
    const ip = req.ip || req.connection.remoteAddress;
    return ip === '127.0.0.1' || ip === '::1' || ip === 'localhost' || 
           process.env.NODE_ENV === 'development';
  }
});
app.use('/api', limiter);

// Parsing middleware
app.use(express.urlencoded({ extended: false }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Vehicle Investigation System API' });
});

// Error handling middleware
app.use(notFound);
app.use(mongooseValidationError);
app.use(duplicateKeyError);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
}); 