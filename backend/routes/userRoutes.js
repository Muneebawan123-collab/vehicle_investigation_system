const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  updateUserProfile,
  getAllUsers,
  deleteUser,
  updateUserRole,
  getUsers,
  getUserById,
  updateUser,
  forgotPassword,
  resetPassword,
  updateConsentStatus,
  recordLastLogin,
  getAvailableUsers,
  getPublicUserById
} = require('../controllers/userController');
const { protect, authorize, admin } = require('../middleware/authMiddleware');
const upload = require('../utils/multerConfig');
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const User = require('../models/User');
const mongoose = require('mongoose');
const { createAuditLog } = require('../utils/auditUtils');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:resetToken', resetPassword);

// Protected routes - all users
router.get('/profile', protect, async (req, res) => {
  try {
    console.log('Get user profile request received for user ID:', req.user._id);
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      console.log('User not found with ID:', req.user._id);
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    // Debug log the found user's fields
    console.log('User fields available:', {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      address: user.address,
      phone: user.phone,
      department: user.department
    });
    
    // Return complete user object with all fields
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      badge: user.badge,
      phone: user.phone,
      address: user.address,
      profileImage: user.profileImage,
      consentAccepted: user.consentAccepted,
      consentDate: user.consentDate,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      success: true
    });
    
    // Create audit log asynchronously
    createAuditLog(
      req, 
      'read', 
      'user', 
      user._id, 
      `User viewed their profile`, 
      true
    ).catch(err => console.error('Error creating audit log:', err));
    
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error retrieving user profile',
      error: error.message 
    });
  }
});
router.put('/profile', protect, upload, async (req, res) => {
  try {
    console.log('Profile update request received:', {
      userId: req.user._id, 
      bodyFields: Object.keys(req.body),
      hasFiles: !!req.files
    });
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      console.log(`User not found with ID: ${req.user._id}`);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('Found user:', {
      id: user._id,
      name: user.name,
      email: user.email,
      currentFields: {
        name: !!user.name,
        email: !!user.email,
        phone: !!user.phone,
        department: !!user.department,
        address: !!user.address,
        profileImage: !!user.profileImage
      }
    });

    // Update user fields if provided
    const updateFields = ['name', 'email', 'phone', 'department', 'address'];
    const updatedFields = [];
    
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        console.log(`Updating field '${field}' from '${user[field]}' to '${req.body[field]}'`);
        user[field] = req.body[field];
        updatedFields.push(field);
      }
    });
    
    // Handle password update separately with validation
    if (req.body.password) {
      if (req.body.password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long'
        });
      }
      user.password = req.body.password;
      updatedFields.push('password');
    }

    // Handle profile image
    if (req.files && req.files.profileImage) {
      // Generate a proper URL for the profile image rather than a file path
      const imagePath = req.files.profileImage[0].path;
      const filename = req.files.profileImage[0].filename;
      
      // Convert the file path to a proper URL that the server can serve
      const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
      const imageUrl = `${baseUrl}/uploads/${filename}`;
      
      console.log('Profile image saved, generating URL:', {
        originalPath: imagePath,
        filename: filename,
        generatedUrl: imageUrl
      });
      
      // Store the URL, not the file path
      user.profileImage = imageUrl;
      updatedFields.push('profileImage');
    }

    // Save the updated user
    const updatedUser = await user.save();
    
    console.log('User successfully updated:', {
      id: updatedUser._id,
      updatedFields,
      fieldsStatus: {
        name: !!updatedUser.name,
        email: !!updatedUser.email,
        phone: !!updatedUser.phone,
        department: !!updatedUser.department,
        address: !!updatedUser.address,
        profileImage: !!updatedUser.profileImage
      }
    });

    // Return user data in the expected format
    res.json({
      success: true,
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        department: updatedUser.department,
        phone: updatedUser.phone,
        address: updatedUser.address,
        profileImage: updatedUser.profileImage,
        active: updatedUser.active,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
});
router.put('/consent', protect, updateConsentStatus);
router.put('/last-login', protect, recordLastLogin);
router.get('/available', protect, getAvailableUsers);

// Special route for promoting Muneeb to admin (no auth required)
router.post('/promote-muneeb', async (req, res, next) => {
  try {
    console.log('Direct Muneeb promotion route accessed');
    const MUNEEB_EMAIL = 'muneeb@123.com';
    
    // First try to find by email, which is more reliable than ID
    let user = await User.findOne({ email: MUNEEB_EMAIL });
    
    if (user) {
      console.log(`Found Muneeb by email: ${MUNEEB_EMAIL}, ID: ${user._id}`);
      
      // Store this ID for future reference
      const MUNEEB_ID = user._id.toString();
      
      // Return this ID in the response so frontend can update
      if (user.role === 'admin') {
        return res.json({
          message: 'Muneeb is already an admin',
          user: {
            _id: user._id,
            email: user.email,
            role: user.role
          }
        });
      }
      
      // Update role
      const oldRole = user.role;
      user.role = 'admin';
      
      // Save the user
      const updatedUser = await user.save();
      
      console.log(`Successfully promoted Muneeb to admin`);
      
      // Return success
      return res.json({
        message: 'Successfully promoted Muneeb to admin',
        user: {
          _id: updatedUser._id,
          email: updatedUser.email,
          role: updatedUser.role
        }
      });
    } else {
      // This shouldn't happen based on logs, but just in case
      console.log(`Muneeb user not found with email: ${MUNEEB_EMAIL}, this is unexpected`);
      return res.status(404).json({ 
        message: 'Muneeb user not found by email',
        detail: 'User with email muneeb@123.com does not exist in the database.'
      });
    }
  } catch (error) {
    console.error('Error in promoteMuneeb route:', error);
    
    // Better error handling
    if (error.code === 11000) {
      console.warn(`Duplicate Key Error: email=muneeb@123.com`);
      return res.status(409).json({
        message: 'Duplicate email error',
        detail: 'Another user with this email already exists'
      });
    }
    
    next(error);
  }
});

// Protected routes - admin only
router.get('/', protect, authorize('admin'), getUsers);

// @route   GET api/users/role/:role
// @desc    Get users by role
// @access  Private
router.get('/role/:role', protect, async (req, res) => {
  try {
    const role = req.params.role;
    const validRoles = ['admin', 'officer', 'investigator'];
    
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    // Log request details for debugging
    console.log(`Fetching users with role: ${role}`);
    
    const users = await User.find({ role }).select('-password');
    console.log(`Found ${users.length} users with role ${role}`);
    
    res.json(users);
  } catch (error) {
    console.error(`Error fetching users by role: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:id', protect, authorize('admin'), getUserById);
router.put('/:id', protect, authorize('admin'), updateUser);
router.delete('/:id', protect, authorize('admin'), deleteUser);
router.put('/:id/role', protect, async (req, res, next) => {
  try {
    // Add debug logging to understand what's happening
    console.log('Role update request details:', {
      pathId: req.params.id,
      requestedBy: req.user?._id,
      requestedRole: req.body.role,
      currentUserRole: req.user?.role,
      currentUserEmail: req.user?.email
    });

    // Check if this is a request to promote Muneeb
    const isMuneebRequest = req.params.id === '67fdfab1c5f4f06ad5dced30';
    const isMuneebEmail = req.user?.email === 'muneeb@123.com';
    
    // Allow if it's Muneeb's email or if admin
    const isMuneebPromotingSelf = isMuneebRequest && isMuneebEmail;
    
    console.log('Promotion check:', {
      isMuneebRequest,
      isMuneebEmail,
      isMuneebPromotingSelf
    });

    // If it's Muneeb promoting himself, allow it; otherwise, check admin role
    if (!isMuneebPromotingSelf && req.user.role !== 'admin') {
      console.log('Authorization failed for role update');
      return res.status(403).json({
        success: false,
        message: 'Not authorized to change user roles',
        detail: 'You must be an admin to change user roles'
      });
    }
    
    console.log('Role update authorized, proceeding to controller');
    // Proceed to controller
    next();
  } catch (error) {
    console.error('Error in role update middleware:', error);
    next(error);
  }
}, updateUserRole);

// @route   POST api/users
// @desc    Create user
// @access  Private (Admin only)
router.post('/', [
  auth,
  check('name', 'Name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  check('role', 'Valid role is required').isIn(['admin', 'officer', 'investigator'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { name, email, password, role, department, phone, address } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    user = new User({
      name,
      email,
      password,
      role,
      department,
      phone,
      address
    });

    await user.save();
    res.status(201).json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/public/:id
// @desc    Get user by ID (public fields only)
// @access  Private (all authenticated users)
router.get('/public/:id', protect, getPublicUserById);

module.exports = router; 