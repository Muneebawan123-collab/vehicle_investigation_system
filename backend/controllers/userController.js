const User = require('../models/User');
const logger = require('../utils/logger');
const { generateToken, generateResetToken, hashString } = require('../utils/authUtils');
const { createAuditLog } = require('../utils/auditUtils');
const { cloudinary } = require('../config/cloudinary');

/**
 * @desc    Register a new user
 * @route   POST /api/users/register
 * @access  Public
 */
const registerUser = async (req, res, next) => {
  try {
    // Debug log to see exactly what's coming in
    console.log("Registration request received:", req.body);
    
    // Get data from request body
    const { firstName, lastName, email, password, role, department, badge, phone } = req.body;
    
    // Check for name or firstName/lastName
    let name = req.body.name;
    if (!name && (firstName || lastName)) {
      // If no name provided but firstName or lastName is, combine them
      name = `${firstName || ''} ${lastName || ''}`.trim();
      console.log("Combined firstName and lastName into name:", name);
    }
    
    // Ensure we have a name field now
    if (!name) {
      return res.status(400).json({
        message: 'Name is required - provide either name or firstName and lastName',
        errors: {
          name: 'A name is required'
        }
      });
    }
    
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user with either provided name or combined first/last name
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'officer', // Default role
      department,
      badge,
      phone
    });

    if (user) {
      // Generate token
      const token = generateToken(user._id);

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        badge: user.badge,
        phone: user.phone,
        token
      });

      logger.info(`New user registered: ${user.email}`);
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error("User registration error:", error);
    if (error.name === 'ValidationError') {
      // Handle mongoose validation errors
      const errors = {};
      for (let field in error.errors) {
        errors[field] = error.errors[field].message;
      }
      return res.status(400).json({
        message: 'Validation failed',
        errors
      });
    }
    next(error);
  }
};

/**
 * @desc    Login user & get token
 * @route   POST /api/users/login
 * @access  Public
 */
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email }).select('+password');

    // Check if user exists and password matches
    if (user && (await user.matchPassword(password))) {
      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({ message: 'Your account has been deactivated. Please contact an administrator.' });
      }

      // Generate token
      const token = generateToken(user._id);

      // Update last login timestamp
      user.lastLogin = Date.now();
      await user.save();

      // Create audit log
      if (req.ip) {
        await createAuditLog(
          req, 
          'login', 
          'user', 
          user._id, 
          `User ${user.email} logged in`, 
          true
        );
      }

      res.json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        department: user.department,
        badge: user.badge,
        profileImage: user.profileImage,
        consentAccepted: user.consentAccepted,
        token
      });

      logger.info(`User logged in: ${user.email}`);
    } else {
      // Create failed login audit
      if (user && req.ip) {
        await createAuditLog(
          req, 
          'failed_login', 
          'user', 
          user._id, 
          `Failed login attempt for ${email}`, 
          false
        );
      }

      res.status(401).json({ message: 'Invalid email or password' });
      logger.warn(`Failed login attempt for: ${email}`);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        department: user.department,
        badge: user.badge,
        phone: user.phone,
        profileImage: user.profileImage,
        consentAccepted: user.consentAccepted,
        consentDate: user.consentDate,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      });

      // Create audit log
      await createAuditLog(
        req, 
        'read', 
        'user', 
        user._id, 
        `User viewed their profile`, 
        true
      );
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      // Update basic info
      user.firstName = req.body.firstName || user.firstName;
      user.lastName = req.body.lastName || user.lastName;
      user.email = req.body.email || user.email;
      user.phone = req.body.phone || user.phone;
      user.department = req.body.department || user.department;
      user.badge = req.body.badge || user.badge;

      // Update password if provided
      if (req.body.password) {
        user.password = req.body.password;
      }

      // Handle profile image upload
      if (req.file) {
        try {
          // Upload to Cloudinary if configured, otherwise use local path
          if (process.env.CLOUDINARY_CLOUD_NAME) {
            const result = await cloudinary.uploader.upload(req.file.path, {
              folder: 'vehicle_investigation_system/profiles',
              width: 200,
              crop: 'scale'
            });
            user.profileImage = result.secure_url;
          } else {
            user.profileImage = `/uploads/${req.file.filename}`;
          }
        } catch (uploadError) {
          logger.error(`Profile image upload error: ${uploadError.message}`);
          // Continue with user update even if image upload fails
        }
      }

      const updatedUser = await user.save();

      // Create audit log
      await createAuditLog(
        req, 
        'update', 
        'user', 
        user._id, 
        `User updated their profile`, 
        true
      );

      res.json({
        _id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        role: updatedUser.role,
        department: updatedUser.department,
        badge: updatedUser.badge,
        phone: updatedUser.phone,
        profileImage: updatedUser.profileImage,
        token: generateToken(updatedUser._id)
      });

      logger.info(`User profile updated: ${updatedUser.email}`);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all users
 * @route   GET /api/users
 * @access  Private/Admin
 */
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password');
    
    // Create audit log
    await createAuditLog(
      req, 
      'read', 
      'user', 
      null, 
      `Admin viewed all users`, 
      true
    );
    
    res.json(users);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user by ID
 * @route   GET /api/users/:id
 * @access  Private/Admin
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (user) {
      // Create audit log
      await createAuditLog(
        req, 
        'read', 
        'user', 
        user._id, 
        `Admin viewed user: ${user.email}`, 
        true
      );
      
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user
 * @route   PUT /api/users/:id
 * @access  Private/Admin
 */
const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      user.firstName = req.body.firstName || user.firstName;
      user.lastName = req.body.lastName || user.lastName;
      user.email = req.body.email || user.email;
      user.role = req.body.role || user.role;
      user.department = req.body.department || user.department;
      user.badge = req.body.badge || user.badge;
      user.phone = req.body.phone || user.phone;
      user.isActive = req.body.isActive !== undefined ? req.body.isActive : user.isActive;

      const updatedUser = await user.save();

      // Create audit log
      await createAuditLog(
        req, 
        'update', 
        'user', 
        user._id, 
        `Admin updated user: ${user.email}`, 
        true
      );

      res.json({
        _id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        role: updatedUser.role,
        department: updatedUser.department,
        badge: updatedUser.badge,
        phone: updatedUser.phone,
        isActive: updatedUser.isActive
      });

      logger.info(`User updated by admin: ${updatedUser.email}`);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete user
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      // Check if user is trying to delete themselves
      if (user._id.toString() === req.user._id.toString()) {
        return res.status(400).json({ message: 'You cannot delete your own account' });
      }

      // Instead of actually deleting, set to inactive
      user.isActive = false;
      await user.save();

      // Create audit log
      await createAuditLog(
        req, 
        'delete', 
        'user', 
        user._id, 
        `Admin deactivated user: ${user.email}`, 
        true
      );

      res.json({ message: 'User deactivated' });
      logger.info(`User deactivated: ${user.email}`);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Forgot password
 * @route   POST /api/users/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'No user with that email' });
    }
    
    // Generate reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });
    
    // Create reset URL
    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
    
    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please visit: ${resetUrl}`;
    
    try {
      // Send email (this is just a placeholder - implement actual email sending)
      logger.info(`Password reset email would be sent to: ${user.email}`);
      logger.info(`Reset URL: ${resetUrl}`);
      
      res.json({ 
        message: 'Password reset link sent',
        // Only for development - should be removed in production
        resetUrl: process.env.NODE_ENV === 'development' ? resetUrl : undefined
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      
      await user.save({ validateBeforeSave: false });
      
      return res.status(500).json({ message: 'Email could not be sent' });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset password
 * @route   POST /api/users/reset-password/:resetToken
 * @access  Public
 */
const resetPassword = async (req, res, next) => {
  try {
    // Get hashed token
    const resetPasswordToken = hashString(req.params.resetToken);
    
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    
    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();
    
    // Create audit log (without req.user)
    const auditReq = { ...req, user: { _id: user._id } };
    await createAuditLog(
      auditReq, 
      'password_reset', 
      'user', 
      user._id, 
      `User reset their password`, 
      true
    );
    
    res.json({ message: 'Password reset successful' });
    logger.info(`Password reset successful for: ${user.email}`);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user role
 * @route   PUT /api/users/:id/role
 * @access  Private/Admin
 */
const updateUserRole = async (req, res, next) => {
  try {
    console.log(`Attempting to update role for user ID: ${req.params.id} to ${req.body.role}`);
    
    // Special case for Muneeb - using email as identifier
    const MUNEEB_EMAIL = 'muneeb@123.com';
    const isMuneebRequest = req.params.id === '67fdfab1c5f4f06ad5dced30';
    let user;
    
    if (isMuneebRequest) {
      console.log('Processing special case for Muneeb Awan');
      
      // Find Muneeb by email rather than ID
      user = await User.findOne({ email: MUNEEB_EMAIL });
      
      if (user) {
        console.log(`Found Muneeb by email: ${MUNEEB_EMAIL}, ID: ${user._id}`);
      } else {
        console.log(`Muneeb user not found with email: ${MUNEEB_EMAIL}, this is unexpected`);
        return res.status(404).json({ 
          message: 'Muneeb user not found',
          detail: 'User with email muneeb@123.com does not exist in the database.'
        });
      }
    } else {
      // Validate ObjectId for normal requests
      const mongoose = require('mongoose');
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        console.error(`Invalid ObjectId format: ${req.params.id}`);
        return res.status(400).json({ message: 'Invalid user ID format' });
      }
      
      // Find normal user
      user = await User.findById(req.params.id);
    }
    
    if (!user) {
      console.log(`User not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log(`Found user: ${user.email} with current role: ${user.role}`);
    
    // Get the old role for logging
    const oldRole = user.role;
    
    // Update role
    user.role = req.body.role;
    
    try {
      const updatedUser = await user.save();
      console.log(`Successfully updated user role to ${updatedUser.role}`);
      
      // Create audit log
      await createAuditLog(
        req, 
        'permission_change', 
        'user', 
        user._id, 
        `Admin changed user role from ${oldRole} to ${updatedUser.role} for user: ${user.email}`, 
        true
      );
      
      res.json({
        _id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        role: updatedUser.role
      });
      
      logger.info(`User role updated from ${oldRole} to ${updatedUser.role} for: ${user.email}`);
    } catch (saveError) {
      console.error('Error saving user role update:', saveError);
      next(saveError);
    }
  } catch (error) {
    console.error('Error in updateUserRole:', error);
    next(error);
  }
};

/**
 * @desc    Update user consent status
 * @route   PUT /api/users/consent
 * @access  Private
 */
const updateConsentStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update consent status
    user.consentAccepted = req.body.consentAccepted;
    
    // If consent is accepted, update the date
    if (req.body.consentAccepted) {
      user.consentDate = Date.now();
    }
    
    const updatedUser = await user.save();
    
    // Create audit log
    await createAuditLog(
      req, 
      'consent_update', 
      'user', 
      user._id, 
      `User ${user.consentAccepted ? 'accepted' : 'revoked'} consent`, 
      true
    );
    
    res.json({
      _id: updatedUser._id,
      consentAccepted: updatedUser.consentAccepted,
      consentDate: updatedUser.consentDate
    });
    
    logger.info(`Consent status updated to ${updatedUser.consentAccepted} for: ${user.email}`);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Record user's last login timestamp
 * @route   PUT /api/users/last-login
 * @access  Private
 */
const recordLastLogin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update last login timestamp
    user.lastLogin = Date.now();
    
    await user.save();
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get available users for chat
 * @route   GET /api/users/available
 * @access  Private
 */
const getAvailableUsers = async (req, res, next) => {
  try {
    let users;
    const currentUser = req.user;
    
    if (currentUser.role === 'admin') {
      // Admins can chat with all active users
      users = await User.find({ isActive: true, _id: { $ne: currentUser._id } })
        .select('name email role department');
    } else {
      // Regular users can chat with admins and users in their department
      users = await User.find({
        $or: [
          { role: 'admin' },
          { department: currentUser.department, _id: { $ne: currentUser._id } }
        ],
        isActive: true
      }).select('name email role department');
    }
    
    // Create audit log
    await createAuditLog(
      req, 
      'read', 
      'user', 
      null, 
      `User requested available users for chat`, 
      true
    );
    
    res.json(users);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  forgotPassword,
  resetPassword,
  updateUserRole,
  updateConsentStatus,
  recordLastLogin,
  getAvailableUsers
}; 