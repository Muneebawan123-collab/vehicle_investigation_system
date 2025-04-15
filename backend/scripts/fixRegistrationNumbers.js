/**
 * Migration script to fix null registrationNumber values
 * Run with: node fixRegistrationNumbers.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Vehicle = require('../models/Vehicle');

async function fixRegistrationNumbers() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');
    
    // Find vehicles with null registrationNumber
    const vehiclesWithNullReg = await Vehicle.find({ 
      $or: [
        { registrationNumber: null },
        { registrationNumber: { $exists: false } }
      ] 
    });
    
    console.log(`Found ${vehiclesWithNullReg.length} vehicles with null registrationNumber`);
    
    // Update each vehicle
    for (const vehicle of vehiclesWithNullReg) {
      vehicle.registrationNumber = vehicle.licensePlate;
      await vehicle.save();
      console.log(`Updated vehicle ${vehicle._id}: Set registrationNumber to ${vehicle.registrationNumber}`);
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixRegistrationNumbers(); 