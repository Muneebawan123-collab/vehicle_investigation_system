const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async (useFallback = false) => {
  try {
    // Remove deprecated options (useNewUrlParser and useUnifiedTopology)
    const options = {
      serverSelectionTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 45000, // 45 seconds
      family: 4 // Force IPv4
    };

    // Choose URI based on whether we're using fallback or not
    const uri = useFallback ? process.env.MONGODB_URI_FALLBACK : process.env.MONGODB_URI;
    
    // Check if we have a valid URI
    if (!uri) {
      logger.error('MongoDB URI is missing in environment variables');
      throw new Error('MongoDB URI is missing. Please check your .env file');
    }
    
    // Log that we're attempting to connect
    logger.info(`Attempting to connect to MongoDB at: ${uri.split('@')[1]?.split('/')[0] || 'localhost'}`);
    
    const conn = await mongoose.connect(uri, options);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    
    // Set global populate option after connection
    mongoose.set('strictPopulate', false);
    
    // Add connection error handler
    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err.message}`);
    });
    
    // Add disconnection handler
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });
    
    return conn;
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    
    // If using the main URI and it fails, try the fallback
    if (!useFallback && process.env.MONGODB_URI_FALLBACK) {
      logger.warn('Failed to connect to primary MongoDB. Trying fallback connection...');
      return connectDB(true);
    }
    
    // If fallback also failed or there's no fallback, retry or exit
    if (process.env.NODE_ENV === 'production') {
      logger.error('Connection to MongoDB failed. Retrying in 5 seconds...');
      setTimeout(() => connectDB(useFallback), 5000);
    } else {
      logger.error('Connection to MongoDB failed. Please check your connection string and network settings.');
      process.exit(1);
    }
  }
};

module.exports = connectDB; 