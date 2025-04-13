const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const { createAuditLog } = require('../utils/auditUtils');

// Upload document
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: 'auto',
      folder: 'vehicle_documents'
    });

    // Delete local file
    fs.unlinkSync(req.file.path);

    const document = {
      type: req.body.type,
      url: result.secure_url,
      description: req.body.description,
      uploadedBy: req.user.id,
      publicId: result.public_id
    };

    await createAuditLog(
      req,
      'create',
      'document',
      result.public_id,
      `Document uploaded: ${req.body.type}`,
      true
    );

    res.status(201).json(document);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all documents
exports.getDocuments = async (req, res) => {
  try {
    const documents = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'vehicle_documents/'
    });

    await createAuditLog(
      req,
      'read',
      'document',
      null,
      'Retrieved all documents',
      true
    );

    res.json(documents.resources);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
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
    await cloudinary.uploader.destroy(req.params.id);

    await createAuditLog(
      req,
      'delete',
      'document',
      req.params.id,
      `Deleted document: ${req.params.id}`,
      true
    );

    res.json({ message: 'Document deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
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
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Delete old version
    await cloudinary.uploader.destroy(req.params.id);

    // Upload new version
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: 'auto',
      public_id: req.params.id,
      folder: 'vehicle_documents'
    });

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

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
}; 