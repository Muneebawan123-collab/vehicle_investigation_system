const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const fs = require('fs');
const rateLimit = require('express-rate-limit');

// Load environment variables
dotenv.config();

// Import utilities and configurations
const connectDB = require('./config/database');
const logger = require('./config/logger');
const { notFound, errorHandler, mongooseValidationError, duplicateKeyError } = require('./middleware/errorMiddleware');
const { testCloudinaryConnection } = require('./config/cloudinary');
const userRoutes = require('./routes/userRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const incidentRoutes = require('./routes/incidentRoutes');
const documentRoutes = require('./routes/documentRoutes');
const chatRoutes = require('./routes/chatRoutes');
const trafficRoutes = require('./routes/trafficRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], // Allow your frontend domains
  credentials: true, // Allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB()
  .then(() => {
    logger.info('MongoDB Connected Successfully');
    // Test Cloudinary connection after MongoDB is connected
    testCloudinaryConnection();
    
    // Initialize notification routes after DB is connected
    try {
      const notificationRoutes = require('./routes/notificationRoutes');
      app.use('/api/notifications', notificationRoutes);
      logger.info('Notification routes registered');
    } catch (error) {
      logger.warn('Could not register notification routes:', error.message);
    }
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
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
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

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', userRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/traffic', trafficRoutes);
app.use('/api/settings', settingsRoutes);

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
app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
}); 