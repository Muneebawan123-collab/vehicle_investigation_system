const express = require('express');
const router = express.Router();
const { 
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
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../utils/multerConfig');
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const User = require('../models/User');
const mongoose = require('mongoose');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:resetToken', resetPassword);

// Protected routes - all users
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, upload.single('profileImage'), updateUserProfile);
router.put('/consent', protect, updateConsentStatus);
router.put('/last-login', protect, recordLastLogin);
router.get('/available', protect, getAvailableUsers);

// Protected routes - admin only
router.get('/', protect, authorize('admin'), getUsers);
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

// @route   GET api/users
// @desc    Get all users
// @access  Private (Admin only)
router.get('/', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/users/:id
// @desc    Get user by ID
// @access  Private (Admin only)
router.get('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

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

// @route   PUT api/users/:id
// @desc    Update user
// @access  Private (Admin only)
router.put('/:id', [
  auth,
  check('name', 'Name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
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

    const { name, email, role, department, phone, address } = req.body;

    // Check if email is already taken
    const existingUser = await User.findOne({ email, _id: { $ne: req.params.id } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, department, phone, address },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE api/users/:id
// @desc    Delete user
// @access  Private (Admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

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

module.exports = router; 