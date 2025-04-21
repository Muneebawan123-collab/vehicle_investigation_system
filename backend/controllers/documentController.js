const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
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

      // Create document object with all relevant information
      const document = {
        type,
        url: result.secure_url,
        description: description || 'No description provided',
        uploadedBy: req.user.id,
        publicId: result.public_id,
        size: result.bytes,
        format: result.format,
        vehicleId: vehicleId || null,
        createdAt: result.created_at
      };

      console.log('Creating audit log');
      await createAuditLog(
        req,
        'create',
        'document',
        result.public_id,
        `Document uploaded: ${type}`,
        true
      );

      console.log('Document upload completed successfully');
      res.status(201).json({
        success: true,
        message: 'Document uploaded successfully',
        document
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
    console.log('Delete document request received for ID:', req.params.id);
    
    // Find the document in MongoDB
    const document = await Document.findOne({
      $or: [
        { _id: req.params.id },
        { publicId: req.params.id },
        { publicId: `vehicle_documents/${req.params.id}` }
      ]
    });

    if (!document) {
      console.log('Document not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    console.log('Found document:', {
      id: document._id,
      publicId: document.publicId,
      name: document.name
    });

    // Delete from Cloudinary
    if (document.publicId) {
      try {
        console.log('Attempting to delete from Cloudinary:', document.publicId);
        await cloudinary.uploader.destroy(document.publicId);
        console.log('Successfully deleted from Cloudinary');
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary:', cloudinaryError);
        // Continue with document deletion even if Cloudinary fails
      }
    }

    // Delete from MongoDB
    await Document.findByIdAndDelete(document._id);
    console.log('Successfully deleted from MongoDB');

    // Create audit log
    await createAuditLog(
      req,
      'delete',
      'document',
      document._id,
      `Document deleted: ${document.name}`,
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
      error: error.message
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