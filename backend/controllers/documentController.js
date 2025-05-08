const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const axios = require('axios');
// Check if auditUtils exists before importing
try {
  var { createAuditLog } = require('../utils/auditUtils');
} catch (error) {
  // Create a dummy function if the module doesn't exist
  var createAuditLog = async () => {};
  console.log('Warning: auditUtils module not found, audit logging disabled');
}
const Document = require('../models/document');

// Upload document
exports.uploadDocument = async (req, res) => {
  try {
    console.log('Document upload handler started');
    
    // Double check that the file exists and has valid properties
    if (!req.file) {
      console.error('Error: File object not found in request');
      return res.status(400).json({ 
        success: false,
        message: 'No file uploaded',
        details: 'The file field is missing in the request'
      });
    }
    
    // Validate file object has required properties
    if (!req.file.path || !req.file.originalname || !req.file.mimetype) {
      console.error('Error: Invalid file object', req.file);
      return res.status(400).json({
        success: false,
        message: 'Invalid file object',
        details: 'The uploaded file is missing required properties'
      });
    }
    
    // Check if file exists on disk
    if (!fs.existsSync(req.file.path)) {
      console.error('Error: File does not exist on disk', req.file.path);
      return res.status(400).json({
        success: false,
        message: 'File not found',
        details: 'The uploaded file could not be found on the server'
      });
    }

    console.log('Processing file upload:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    });
    
    // Log request details for debugging
    console.log('Request body:', req.body);
    console.log('Request user:', req.user ? {
      id: req.user.id,
      name: req.user.name,
      role: req.user.role
    } : 'Not authenticated');

    // Get document information from the request body
    const { type, description, vehicleId } = req.body || {}; // Add fallback empty object
    
    // Ensure type exists
    if (!type) {
      console.log('Error: Document type is required');
      
      // Clean up the uploaded file
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
        console.log('Cleaned up file due to missing type');
      }
      
      return res.status(400).json({ 
        success: false,
        message: 'Document type is required',
        details: 'The type field is missing in the request body'
      });
    }

    console.log('Starting upload to Cloudinary');
    
    try {
      // Check that all required inputs for Cloudinary are valid
      if (!req.file.path) {
        throw new Error('File path is missing');
      }
      
      // Upload to Cloudinary with proper error handling
      const result = await cloudinary.uploader.upload(req.file.path, {
        resource_type: 'auto',
        folder: vehicleId 
          ? `vehicle_documents/${vehicleId}`
          : 'vehicle_documents',
        public_id: `${type}_${Date.now()}`,
        tags: [type]
      });
      
      if (!result || !result.secure_url) {
        throw new Error('Failed to get valid response from Cloudinary');
      }

      console.log('Cloudinary upload successful:', {
        publicId: result.public_id,
        url: result.secure_url,
        size: result.bytes,
        format: result.format
      });

      // Delete local file after upload
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
        console.log('Local file deleted after successful upload');
      }

      // Create MongoDB document with all required fields
      console.log('Creating MongoDB document record with name:', req.file.originalname);
      const newDocument = new Document({
        name: req.file.originalname,
        type: type,
        url: result.secure_url,
        publicId: result.public_id,
        size: result.bytes,
        uploadedBy: req.user.id,
        vehicle: vehicleId || null,
        uploadDate: new Date()
      });
      
      // Save document to MongoDB
      const savedDocument = await newDocument.save();
      console.log('Document saved to MongoDB:', savedDocument._id);

      // Create audit log
      await createAuditLog(
        req,
        'create',
        'document',
        savedDocument._id,
        `Document uploaded: ${req.file.originalname}`,
        true
      );

      console.log('Document upload completed successfully');
      res.status(201).json({
        success: true,
        message: 'Document uploaded successfully',
        document: savedDocument
      });
    } catch (cloudinaryError) {
      console.error('Cloudinary upload error:', cloudinaryError);
      
      // Clean up the uploaded file
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
        console.log('Cleaned up file after Cloudinary error');
      }
      
      res.status(500).json({ 
        success: false,
        message: 'Cloud storage error',
        details: 'Failed to upload file to cloud storage',
        error: cloudinaryError.message
      });
    }
  } catch (error) {
    console.error('Document upload error:', error);
    
    // Delete temp file if it exists
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
      console.log('Cleaned up file after general error');
    }
    
    // Provide more specific error messages based on the error type
    let errorMessage = 'Server error during document upload';
    let errorDetails = error.message;
    
    if (error.name === 'MulterError') {
      if (error.code === 'LIMIT_FILE_SIZE') {
        errorMessage = 'File size exceeds the limit';
        errorDetails = 'Maximum file size is 5MB';
      } else {
        errorMessage = 'File upload error';
        errorDetails = error.message;
      }
    } else if (error.name === 'CloudinaryError' || error.message.includes('Cloudinary')) {
      errorMessage = 'Cloud storage error';
      errorDetails = 'Error uploading to cloud storage';
    }
    
    res.status(500).json({ 
      success: false,
      message: errorMessage,
      details: errorDetails,
      error: error.message
    });
  }
};

// Get all documents
exports.getDocuments = async (req, res) => {
  try {
    console.log('Getting documents from Cloudinary...');
    
    // Get documents from Cloudinary
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'vehicle_documents/',
      max_results: 100,
      tags: req.query.type ? [req.query.type] : undefined
    });

    console.log('Retrieved documents from Cloudinary:', result.resources.length);
    
    // If no documents were found, log more details
    if (!result.resources || result.resources.length === 0) {
      console.log('No documents found in Cloudinary');
      console.log('Result object:', JSON.stringify(result, null, 2));
    } else {
      // Log sample document (first one)
      console.log('Sample document:', JSON.stringify(result.resources[0], null, 2));
    }

    // Format the documents for the frontend
    const formattedDocuments = result.resources.map(doc => ({
      id: doc.public_id,
      name: doc.public_id.split('/').pop(),
      type: doc.format || 'document',
      size: doc.bytes || 0,
      url: doc.secure_url,
      uploadDate: doc.created_at,
      uploadedBy: 'System',
      secure_url: doc.secure_url
    }));

    console.log('Formatted documents:', formattedDocuments.length);

    await createAuditLog(
      req,
      'read',
      'document',
      null,
      'Retrieved all documents',
      true
    );

    res.status(200).json({
      success: true,
      count: formattedDocuments.length,
      data: formattedDocuments
    });
  } catch (error) {
    console.error('Error getting documents:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error retrieving documents',
      error: error.message 
    });
  }
};

// Get document by ID
exports.getDocumentById = async (req, res) => {
  try {
    const result = await cloudinary.api.resource(req.params.id);

    await createAuditLog(
      req,
      'read',
      'document',
      req.params.id,
      `Retrieved document: ${req.params.id}`,
      true
    );

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update document
exports.updateDocument = async (req, res) => {
  try {
    const result = await cloudinary.uploader.rename(
      req.params.id,
      `vehicle_documents/${req.body.newName}`
    );

    await createAuditLog(
      req,
      'update',
      'document',
      req.params.id,
      `Updated document: ${req.params.id}`,
      true
    );

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete document
exports.deleteDocument = async (req, res) => {
  try {
    const documentId = req.params.id;
    console.log('Delete document request received for ID:', documentId);
    
    // Find the document in MongoDB
    const document = await Document.findOne({
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(documentId) ? documentId : null },
        { name: documentId },
        { publicId: documentId },
        { publicId: `vehicle_documents/${documentId}` }
      ]
    }).exec();

    if (!document) {
      // If not found in MongoDB, try to delete directly from Cloudinary
      console.log('Document not found in MongoDB, trying Cloudinary direct delete');
      
      // Try with various potential public ID formats
      const publicIds = [
        documentId,
        `vehicle_documents/${documentId}`,
        documentId.replace('_', '/'),
        `vehicle_documents/${documentId.replace('_', '/')}`
      ];
      
      let cloudinaryResult = null;
      let successfulPublicId = null;
      
      // Try each potential public ID format
      for (const publicId of publicIds) {
        try {
          console.log('Attempting to delete from Cloudinary with ID:', publicId);
          cloudinaryResult = await cloudinary.uploader.destroy(publicId);
          console.log('Cloudinary response for', publicId, ':', cloudinaryResult);
          
          if (cloudinaryResult && cloudinaryResult.result === 'ok') {
            successfulPublicId = publicId;
            break;
          }
        } catch (error) {
          console.log('Error with', publicId, ':', error.message);
        }
      }
      
      if (successfulPublicId) {
        console.log('Successfully deleted from Cloudinary with ID:', successfulPublicId);
        return res.json({
          success: true,
          message: 'Document deleted successfully from Cloudinary',
          deletedFrom: 'cloudinary',
          publicId: successfulPublicId
        });
      }
      
      return res.status(404).json({
        success: false,
        message: 'Document not found in either MongoDB or Cloudinary'
      });
    }

    console.log('Found document in MongoDB:', {
      id: document._id,
      publicId: document.publicId,
      name: document.name
    });

    // Delete from Cloudinary if publicId exists
    if (document.publicId) {
      try {
        console.log('Attempting to delete from Cloudinary:', document.publicId);
        const cloudinaryResult = await cloudinary.uploader.destroy(document.publicId);
        console.log('Cloudinary deletion result:', cloudinaryResult);
        
        if (cloudinaryResult.result !== 'ok') {
          console.warn('Cloudinary deletion warning:', cloudinaryResult);
        }
      } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
        // Log the error but continue with document deletion
        console.log('Continuing with database deletion despite Cloudinary error');
      }
    }

    // Delete from MongoDB
    const deletedDoc = await Document.findByIdAndDelete(document._id);
    if (!deletedDoc) {
      throw new Error('Failed to delete document from database');
    }
    console.log('Successfully deleted from MongoDB');

    // Create audit log
    await createAuditLog(
      req,
      'delete',
      'document',
      document._id,
      `Document deleted: ${document.name || document.publicId}`,
      true
    );

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting document',
      error: error.message || 'Internal server error'
    });
  }
};

// Get documents by vehicle
exports.getDocumentsByVehicle = async (req, res) => {
  try {
    const documents = await cloudinary.api.resources({
      type: 'upload',
      prefix: `vehicle_documents/${req.params.vehicleId}/`
    });

    await createAuditLog(
      req,
      'read',
      'document',
      req.params.vehicleId,
      `Retrieved documents for vehicle: ${req.params.vehicleId}`,
      true
    );

    res.json(documents.resources);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get documents by type
exports.getDocumentsByType = async (req, res) => {
  try {
    const documents = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'vehicle_documents/',
      tags: [req.params.type]
    });

    await createAuditLog(
      req,
      'read',
      'document',
      null,
      `Retrieved documents of type: ${req.params.type}`,
      true
    );

    res.json(documents.resources);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Search documents
exports.searchDocuments = async (req, res) => {
  try {
    const documents = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'vehicle_documents/',
      tags: req.query.query
    });

    await createAuditLog(
      req,
      'read',
      'document',
      null,
      `Searched documents with query: ${req.query.query}`,
      true
    );

    res.json(documents.resources);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Verify document
exports.verifyDocument = async (req, res) => {
  try {
    const result = await cloudinary.uploader.add_tag('verified', [req.params.id]);

    await createAuditLog(
      req,
      'update',
      'document',
      req.params.id,
      `Verified document: ${req.params.id}`,
      true
    );

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add document note
exports.addDocumentNote = async (req, res) => {
  try {
    const result = await cloudinary.uploader.add_context(
      `note_${Date.now()}=${req.body.note}`,
      [req.params.id]
    );

    await createAuditLog(
      req,
      'update',
      'document',
      req.params.id,
      `Added note to document: ${req.params.id}`,
      true
    );

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Watermark document
exports.watermarkDocument = async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.params.id, {
      transformation: {
        overlay: {
          font_family: "Arial",
          font_size: 50,
          text: "Confidential"
        }
      }
    });

    await createAuditLog(
      req,
      'update',
      'document',
      req.params.id,
      `Added watermark to document: ${req.params.id}`,
      true
    );

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Sign document
exports.signDocument = async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.params.id, {
      transformation: {
        overlay: {
          font_family: "Arial",
          font_size: 30,
          text: `Signed by ${req.user.name} on ${new Date().toLocaleDateString()}`
        }
      }
    });

    await createAuditLog(
      req,
      'update',
      'document',
      req.params.id,
      `Signed document: ${req.params.id}`,
      true
    );

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get expiring documents
exports.getExpiringDocuments = async (req, res) => {
  try {
    const documents = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'vehicle_documents/',
      metadata: true
    });

    const expiringDocs = documents.resources.filter(doc => {
      if (doc.context && doc.context.expiry_date) {
        const expiryDate = new Date(doc.context.expiry_date);
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        return expiryDate <= thirtyDaysFromNow;
      }
      return false;
    });

    await createAuditLog(
      req,
      'read',
      'document',
      null,
      'Retrieved expiring documents',
      true
    );

    res.json(expiringDocs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Log document access
exports.logDocumentAccess = async (req, res) => {
  try {
    await createAuditLog(
      req,
      'access',
      'document',
      req.params.id,
      `Accessed document: ${req.params.id}`,
      true
    );

    res.json({ message: 'Access logged' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get document versions
exports.getDocumentVersions = async (req, res) => {
  try {
    const versions = await cloudinary.api.resource_by_asset_id(req.params.id, {
      versions: true
    });

    await createAuditLog(
      req,
      'read',
      'document',
      req.params.id,
      `Retrieved versions of document: ${req.params.id}`,
      true
    );

    res.json(versions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Replace document
exports.replaceDocument = async (req, res) => {
  try {
    console.log('Document replace request received');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    console.log('Request user:', req.user);
    
    if (!req.file) {
      console.log('Error: No file uploaded for replacement');
      return res.status(400).json({ 
        success: false,
        message: 'No file uploaded',
        details: 'The file field is missing in the request for document replacement'
      });
    }

    // Delete old version
    await cloudinary.uploader.destroy(req.params.id);

    // Upload new version
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: 'auto',
      public_id: req.params.id,
      folder: 'vehicle_documents'
    });

    console.log('Cloudinary upload result for replacement:', result);

    // Delete local file
    fs.unlinkSync(req.file.path);

    await createAuditLog(
      req,
      'update',
      'document',
      req.params.id,
      `Replaced document: ${req.params.id}`,
      true
    );

    res.status(200).json({
      success: true,
      message: 'Document replaced successfully',
      document: result
    });
  } catch (error) {
    console.error('Document replacement error:', error);
    
    // Delete temp file if it exists
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Server error during document replacement',
      error: error.message
    });
  }
};

// Download document file directly
exports.downloadDocumentFile = async (req, res) => {
  try {
    const documentId = req.params.id;
    console.log('Document direct download request received for:', documentId);
    
    // Add more verbose logging to track what's happening
    console.log('Searching for document with the following strategies:');
    console.log('1. MongoDB ID lookup');
    console.log('2. Name/publicId lookup in MongoDB');
    console.log('3. Direct Cloudinary lookup');
    
    // Find the document using multiple search strategies
    let document = null;
    
    // Check if it's a valid MongoDB ObjectId
    try {
      if (mongoose.Types.ObjectId.isValid(documentId)) {
        console.log('Valid MongoDB ObjectId format detected, searching by ID');
        document = await Document.findById(documentId);
        if (document) {
          console.log('Found document by MongoDB ID');
        } else {
          console.log('No document found by MongoDB ID');
        }
      } else {
        console.log('Not a valid MongoDB ObjectId format');
      }
    } catch (err) {
      console.log('Error searching by MongoDB ID:', err.message);
    }
    
    // If not found by ID, try other fields
    if (!document) {
      console.log('Trying to find document by name or publicId');
      try {
        // Try with exact match first
        document = await Document.findOne({ name: documentId });
        if (document) {
          console.log('Found document by exact name match');
        } else {
          // Try with more flexible criteria
          document = await Document.findOne({
            $or: [
              { name: documentId },
              { publicId: documentId },
              { publicId: `vehicle_documents/${documentId}` }
            ]
          });
          
          if (document) {
            console.log('Found document by name or publicId');
          } else {
            console.log('No document found by name or publicId');
          }
        }
      } catch (err) {
        console.log('Error searching by name/publicId:', err.message);
      }
    }
    
    // Skip database checks and try loading directly from Cloudinary
    console.log('Trying direct Cloudinary access for document:', documentId);
    
    // Try different potential publicId formats
    const publicIdFormats = [
      documentId,
      `vehicle_documents/${documentId}`,
      `vehicle_documents/${documentId.replace('_', '/')}`,
      documentId.replace('.pdf', ''),
      `vehicle_documents/${documentId.replace('_', '/').replace('.pdf', '')}`,
      // Add more formats to try
      `${documentId}`,
      `vehicle_documents/${documentId.split('_')[0]}/${documentId.split('_')[1] || ''}`
    ];
    
    console.log('Trying the following Cloudinary public IDs:', publicIdFormats);
    
    // Try each format until one works
    for (const publicId of publicIdFormats) {
      try {
        console.log(`Checking Cloudinary for: ${publicId}`);
        
        // Try with different resource types
        const resourceTypes = ['image', 'raw', 'auto'];
        
        for (const resourceType of resourceTypes) {
          try {
            console.log(`Trying resource type: ${resourceType}`);
            const result = await cloudinary.api.resource(publicId, { 
              resource_type: resourceType,
              type: 'upload'
            });
            
            if (result && result.secure_url) {
              console.log('Found document in Cloudinary:', {
                public_id: result.public_id,
                url: result.secure_url,
                type: result.format,
                resource_type: resourceType
              });
              
              // Create a temporary document object
              document = {
                publicId: result.public_id,
                url: result.secure_url,
                name: result.public_id.split('/').pop(),
                type: result.format || 'pdf',
                isCloudinaryDirect: true,
                resourceType: resourceType
              };
              
              break;
            }
          } catch (resourceTypeErr) {
            // Just continue to the next resource type
          }
        }
        
        if (document) break; // Exit the loop if we found the document
      } catch (err) {
        // Just continue trying other formats
      }
    }
    
    // Fallback: Try listing all resources and finding a match
    if (!document) {
      try {
        console.log('Trying to list all vehicle documents from Cloudinary');
        const resources = await cloudinary.api.resources({
          type: 'upload',
          prefix: 'vehicle_documents/',
          max_results: 100
        });
        
        if (resources && resources.resources && resources.resources.length > 0) {
          console.log(`Found ${resources.resources.length} documents in Cloudinary`);
          
          // Look for a matching document
          const matchingResource = resources.resources.find(r => 
            r.public_id.includes(documentId) || 
            r.public_id.endsWith(documentId) || 
            r.public_id.includes(documentId.replace('_', '/'))
          );
          
          if (matchingResource) {
            console.log('Found matching document by search:', matchingResource.public_id);
            
            document = {
              publicId: matchingResource.public_id,
              url: matchingResource.secure_url,
              name: matchingResource.public_id.split('/').pop(),
              type: matchingResource.format || 'pdf',
              isCloudinaryDirect: true
            };
          } else {
            console.log('No matching documents found in listing');
            // Print the first few documents to debug
            console.log('Available documents:');
            resources.resources.slice(0, 5).forEach(r => {
              console.log(`- ${r.public_id} (${r.format})`);
            });
          }
        } else {
          console.log('No resources found in Cloudinary or empty result');
        }
      } catch (listErr) {
        console.error('Error listing Cloudinary resources:', listErr);
      }
    }
    
    // If document still not found
    if (!document) {
      console.log('Document not found in database or Cloudinary after all attempts');
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    console.log('Preparing download for document:', {
      id: document._id || 'N/A',
      name: document.name,
      publicId: document.publicId || document.name,
      url: document.url
    });
    
    // Handle direct download
    try {
      // Set filename for download
      const filename = document.name || document.publicId?.split('/').pop() || 'document';
      
      // Set content type based on file extension
      let contentType = 'application/octet-stream';
      const fileExt = (document.type || '').toLowerCase();
      
      if (fileExt === 'pdf') contentType = 'application/pdf';
      else if (['jpg', 'jpeg'].includes(fileExt)) contentType = 'image/jpeg';
      else if (fileExt === 'png') contentType = 'image/png';
      
      // Set headers for file download
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // Get download URL (use document's url if available, otherwise generate)
      let downloadUrl = document.url;
      
      if (!downloadUrl && document.publicId) {
        // Get a direct download URL from Cloudinary
        const resourceType = document.resourceType || 
          (['jpg', 'jpeg', 'png', 'gif'].includes(fileExt) ? 'image' : 'raw');
        
        downloadUrl = cloudinary.url(document.publicId, {
          resource_type: resourceType,
          type: 'upload',
          flags: 'attachment'
        });
      }
      
      if (!downloadUrl) {
        throw new Error('No download URL available for this document');
      }
      
      console.log('Using download URL:', downloadUrl);
      
      // Download and stream the file
      const response = await axios({
        method: 'GET',
        url: downloadUrl,
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Vehicle Investigation System/1.0',
        },
        maxContentLength: 50 * 1024 * 1024, // 50MB max
        timeout: 30000 // 30 seconds
      });
      
      if (response.status === 200) {
        // Stream the file to the client
        res.write(response.data);
        res.end();
        
        console.log('File downloaded and streamed successfully');
        
        // Log document access if we have a MongoDB document
        if (document._id) {
          try {
            await Document.findByIdAndUpdate(document._id, {
              $push: {
                accessLog: {
                  user: req.user ? req.user._id : 'anonymous',
                  action: 'downloaded',
                  ipAddress: req.ip,
                  userAgent: req.headers['user-agent']
                }
              }
            });
            console.log('Document access logged');
          } catch (logError) {
            console.error('Error logging document access:', logError);
          }
        }
        
        // Create audit log
        try {
          await createAuditLog(
            req, 
            'download',
            'document',
            document._id || 'unknown',
            `Downloaded document: ${document.name || document.publicId}`,
            true
          );
          console.log('Audit log created');
        } catch (auditError) {
          console.error('Error creating audit log:', auditError);
        }
      } else {
        throw new Error(`Unexpected status: ${response.status}`);
      }
    } catch (downloadError) {
      console.error('Download error:', downloadError);
      res.status(500).json({
        success: false,
        message: 'Error downloading file',
        error: downloadError.message
      });
    }
  } catch (error) {
    console.error('Error in downloadDocumentFile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error downloading document',
      error: error.message
    });
  }
};

// Get document binary data directly from MongoDB (avoiding Cloudinary issues)
exports.getDocumentBinaryFromMongoDB = async (req, res) => {
  try {
    const documentId = req.params.id;
    console.log('MongoDB binary document request received for:', documentId);
    
    // Find the document in MongoDB
    let document = null;
    
    if (mongoose.Types.ObjectId.isValid(documentId)) {
      document = await Document.findById(documentId);
    }
    
    if (!document) {
      // Try alternative lookups
      document = await Document.findOne({
        $or: [
          { name: documentId },
          { publicId: documentId },
          { publicId: `vehicle_documents/${documentId}` }
        ]
      });
    }
    
    if (!document) {
      console.error('Document not found in MongoDB');
      return res.status(404).json({
        success: false,
        message: 'Document not found in database'
      });
    }
    
    // Check if document has binary data stored
    if (!document.fileData) {
      console.error('Document has no binary data stored in MongoDB');
      
      // If we have a Cloudinary URL but no binary data, fetch and store it
      if (document.url || document.fileUrl) {
        try {
          console.log('Attempting to fetch document from Cloudinary and store in MongoDB');
          
          const sourceUrl = document.url || document.fileUrl;
          const response = await axios({
            method: 'GET',
            url: sourceUrl,
            responseType: 'arraybuffer'
          });
          
          if (response.status === 200) {
            // Store the binary data in MongoDB
            document.fileData = Buffer.from(response.data);
            document.lastBinaryUpdate = new Date();
            await document.save();
            
            console.log('Document binary data successfully stored in MongoDB');
          } else {
            throw new Error(`Failed to fetch document: ${response.status}`);
          }
        } catch (fetchError) {
          console.error('Failed to fetch and store document:', fetchError);
          return res.status(500).json({
            success: false,
            message: 'Document binary data not available and could not be fetched',
            error: fetchError.message
          });
        }
      } else {
        return res.status(404).json({
          success: false,
          message: 'Document has no binary data or source URL'
        });
      }
    }
    
    // Set the appropriate content type
    let contentType = 'application/octet-stream';
    if (document.type === 'pdf') {
      contentType = 'application/pdf';
    } else if (['jpg', 'jpeg'].includes(document.type)) {
      contentType = 'image/jpeg';
    } else if (document.type === 'png') {
      contentType = 'image/png';
    }
    
    // Set response headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${document.name || 'document.' + document.type || 'bin'}"`);
    res.setHeader('Content-Length', document.fileData.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Log document access
    try {
      await Document.findByIdAndUpdate(document._id, {
        $push: {
          accessLog: {
            user: req.user ? req.user._id : 'anonymous',
            action: 'downloaded',
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            timestamp: new Date()
          }
        }
      });
      
      // Also add to audit log
      await createAuditLog(
        req,
        'download',
        'document',
        document._id,
        `Downloaded document ${document.name || document._id} from MongoDB`,
        true
      );
      
      console.log('Document access logged');
    } catch (logError) {
      console.error('Error logging document access:', logError);
    }
    
    // Send the binary data
    res.send(document.fileData);
    
    console.log('Document binary data sent successfully');
  } catch (error) {
    console.error('Error retrieving document from MongoDB:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving document binary data',
      error: error.message
    });
  }
};

// Store document binary data in MongoDB (from Cloudinary or other source)
exports.storeDocumentInMongoDB = async (req, res) => {
  try {
    const documentId = req.params.id;
    console.log('Request to store document in MongoDB:', documentId);
    
    // Find the document
    let document = null;
    
    if (mongoose.Types.ObjectId.isValid(documentId)) {
      document = await Document.findById(documentId);
    }
    
    if (!document) {
      document = await Document.findOne({
        $or: [
          { name: documentId },
          { publicId: documentId },
          { publicId: `vehicle_documents/${documentId}` }
        ]
      });
    }
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    // Check if document already has binary data
    if (document.fileData && document.fileData.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'Document already has binary data stored',
        documentId: document._id
      });
    }
    
    // Check if document has a URL
    const sourceUrl = document.url || document.fileUrl;
    if (!sourceUrl) {
      return res.status(400).json({
        success: false,
        message: 'Document has no source URL to fetch binary data from'
      });
    }
    
    // Fetch the document from the URL
    const response = await axios({
      method: 'GET',
      url: sourceUrl,
      responseType: 'arraybuffer',
      timeout: 30000
    });
    
    if (response.status !== 200) {
      throw new Error(`Failed to fetch document: ${response.status}`);
    }
    
    // Store the binary data in MongoDB
    document.fileData = Buffer.from(response.data);
    document.lastBinaryUpdate = new Date();
    await document.save();
    
    // Log the operation
    await createAuditLog(
      req,
      'update',
      'document',
      document._id,
      `Stored binary data for document ${document.name || document._id} in MongoDB`,
      true
    );
    
    res.status(200).json({
      success: true,
      message: 'Document binary data successfully stored in MongoDB',
      documentId: document._id,
      byteSize: document.fileData.length
    });
  } catch (error) {
    console.error('Error storing document in MongoDB:', error);
    res.status(500).json({
      success: false,
      message: 'Error storing document binary data',
      error: error.message
    });
  }
}; 