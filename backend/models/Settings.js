const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  systemName: {
    type: String,
    required: [true, 'System name is required'],
    trim: true
  },
  emailNotifications: {
    type: Boolean,
    default: true
  },
  smsNotifications: {
    type: Boolean,
    default: false
  },
  maxFileSize: {
    type: Number,
    default: 10 // in MB
  },
  allowedFileTypes: [{
    type: String,
    trim: true
  }],
  retentionPeriod: {
    type: Number,
    default: 30 // in days
  },
  autoArchive: {
    type: Boolean,
    default: false
  },
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Create default settings if none exist
settingsSchema.statics.createDefault = async function() {
  const defaultSettings = {
    systemName: 'Vehicle Investigation System',
    emailNotifications: true,
    smsNotifications: false,
    maxFileSize: 10,
    allowedFileTypes: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
    retentionPeriod: 30,
    autoArchive: false,
    maintenanceMode: false
  };

  try {
    const settings = await this.findOne();
    if (!settings) {
      return await this.create(defaultSettings);
    }
    return settings;
  } catch (error) {
    console.error('Error creating default settings:', error);
    throw error;
  }
};

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings; 