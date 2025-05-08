/**
 * Script to download all documents from Cloudinary and store them in MongoDB
 * This improves reliability and performance for document access
 */
require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const Document = require('../models/document');
const cloudinary = require('cloudinary').v2;

// Configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

/**
 * Main function to process all documents
 */
async function storeAllDocumentsInMongoDB() {
  try {
    console.log('Starting document migration to MongoDB...');
    
    // Get all documents from MongoDB that don't have fileData
    const documents = await Document.find({ fileData: { $exists: false } });
    console.log(`Found ${documents.length} documents without binary data in MongoDB`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Process each document
    for (const document of documents) {
      try {
        console.log(`Processing document: ${document.name} (${document._id})`);
        
        // Get the source URL
        const sourceUrl = document.url || document.fileUrl;
        
        if (!sourceUrl) {
          console.log(`No source URL found for document: ${document._id}`);
          errorCount++;
          continue;
        }
        
        console.log(`Fetching from URL: ${sourceUrl}`);
        
        // Download the document
        const response = await axios({
          method: 'GET',
          url: sourceUrl,
          responseType: 'arraybuffer',
          timeout: 30000
        });
        
        if (response.status !== 200) {
          throw new Error(`Failed to fetch document: ${response.status}`);
        }
        
        // Update the document with binary data
        document.fileData = Buffer.from(response.data);
        document.lastBinaryUpdate = new Date();
        await document.save();
        
        console.log(`Successfully stored document in MongoDB: ${document._id}`);
        successCount++;
      } catch (error) {
        console.error(`Error processing document ${document._id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('Document migration completed');
    console.log(`Documents processed: ${documents.length}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Failed: ${errorCount}`);
  } catch (error) {
    console.error('Error in storeAllDocumentsInMongoDB:', error);
  } finally {
    // Close MongoDB connection
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Execute the script
storeAllDocumentsInMongoDB(); 