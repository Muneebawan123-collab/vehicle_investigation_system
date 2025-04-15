const express = require('express');
const router = express.Router();
const { 
  getUserChats, 
  getChatById, 
  createChat, 
  sendMessage, 
  deleteChat, 
  getAllChats 
} = require('../controllers/chatController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

// Get all chats for current user
router.get('/', getUserChats);

// Get all chats (admin only)
router.get('/admin', authorize('admin'), getAllChats);

// Create new chat
router.post('/', createChat);

// Get chat by ID
router.get('/:id', getChatById);

// Send message in chat
router.post('/:id/messages', sendMessage);

// Delete chat (admin only)
router.delete('/:id', authorize('admin'), deleteChat);

module.exports = router; 