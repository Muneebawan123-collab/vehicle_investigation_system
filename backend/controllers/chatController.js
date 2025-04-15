const Chat = require('../models/chatModel');
const User = require('../models/User');
const { createAuditLog } = require('../utils/auditUtils');
const logger = require('../config/logger');
const asyncHandler = require('express-async-handler');

/**
 * @desc    Get all chats for current user
 * @route   GET /api/chats
 * @access  Private
 */
const getUserChats = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find all chats where the current user is a participant
    const chats = await Chat.find({ 
      participants: userId,
      isActive: true 
    })
    .populate('participants', 'name email role')
    .sort('-lastMessage')
    .select('-messages');
    
    await createAuditLog(
      req,
      'read',
      'chat',
      null,
      'User retrieved their chat list',
      true
    );
    
    res.json({
      success: true,
      count: chats.length,
      chats
    });
  } catch (error) {
    logger.error(`Error getting user chats: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error retrieving chats',
      error: error.message
    });
  }
});

/**
 * @desc    Get chat by ID with messages
 * @route   GET /api/chats/:id
 * @access  Private
 */
const getChatById = asyncHandler(async (req, res) => {
  try {
    const chatId = req.params.id;
    const userId = req.user._id;
    
    // Find the chat and make sure the user is a participant
    const chat = await Chat.findOne({
      _id: chatId,
      participants: userId,
      isActive: true
    }).populate('participants', 'name email role')
      .populate('messages.sender', 'name role');
    
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found or you are not a participant'
      });
    }
    
    // Mark messages as read by current user
    chat.messages.forEach(message => {
      if (!message.readBy.includes(userId)) {
        message.readBy.push(userId);
      }
    });
    
    await chat.save();
    
    await createAuditLog(
      req,
      'read',
      'chat',
      chatId,
      'User viewed chat messages',
      true
    );
    
    res.json({
      success: true,
      chat
    });
  } catch (error) {
    logger.error(`Error getting chat by ID: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error retrieving chat',
      error: error.message
    });
  }
});

/**
 * @desc    Create new chat
 * @route   POST /api/chats
 * @access  Private
 */
const createChat = asyncHandler(async (req, res) => {
  try {
    const { participants, title, initialMessage } = req.body;
    const userId = req.user._id;
    
    // Make sure at least one other participant is provided
    if (!participants || participants.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one participant is required'
      });
    }
    
    // Add current user to participants if not already included
    if (!participants.includes(userId.toString())) {
      participants.push(userId);
    }
    
    // Validate all participants exist
    const users = await User.find({ _id: { $in: participants } });
    if (users.length !== participants.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more participants do not exist'
      });
    }
    
    // Check if chat between these participants already exists
    const existingChat = await Chat.findOne({
      participants: { $all: participants, $size: participants.length },
      isActive: true
    });
    
    if (existingChat) {
      return res.status(400).json({
        success: false,
        message: 'A chat with these participants already exists',
        chatId: existingChat._id
      });
    }
    
    // Create new chat
    const newChat = new Chat({
      participants,
      title: title || `Chat ${Date.now()}`,
      messages: initialMessage ? [{
        sender: userId,
        content: initialMessage,
        readBy: [userId]
      }] : [],
      lastMessage: Date.now()
    });
    
    await newChat.save();
    
    await createAuditLog(
      req,
      'create',
      'chat',
      newChat._id,
      'User created a new chat',
      true
    );
    
    res.status(201).json({
      success: true,
      message: 'Chat created successfully',
      chat: newChat
    });
  } catch (error) {
    logger.error(`Error creating chat: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error creating chat',
      error: error.message
    });
  }
});

/**
 * @desc    Send a message in chat
 * @route   POST /api/chats/:id/messages
 * @access  Private
 */
const sendMessage = asyncHandler(async (req, res) => {
  try {
    const chatId = req.params.id;
    const { content } = req.body;
    const userId = req.user._id;
    
    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message content cannot be empty'
      });
    }
    
    // Find the chat and make sure the user is a participant
    const chat = await Chat.findOne({
      _id: chatId,
      participants: userId,
      isActive: true
    });
    
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found or you are not a participant'
      });
    }
    
    // Add the message
    chat.messages.push({
      sender: userId,
      content,
      readBy: [userId],
      timestamp: Date.now()
    });
    
    chat.lastMessage = Date.now();
    await chat.save();
    
    // Get the newly added message
    const newMessage = chat.messages[chat.messages.length - 1];
    
    await createAuditLog(
      req,
      'create',
      'message',
      chatId,
      'User sent a message in chat',
      true
    );
    
    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      chatMessage: newMessage
    });
  } catch (error) {
    logger.error(`Error sending message: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error sending message',
      error: error.message
    });
  }
});

/**
 * @desc    Delete a chat (mark as inactive)
 * @route   DELETE /api/chats/:id
 * @access  Private
 */
const deleteChat = asyncHandler(async (req, res) => {
  try {
    const chatId = req.params.id;
    const userId = req.user._id;
    
    // Only allow admin to delete chats
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can delete chats'
      });
    }
    
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }
    
    // Mark as inactive instead of deleting
    chat.isActive = false;
    await chat.save();
    
    await createAuditLog(
      req,
      'delete',
      'chat',
      chatId,
      'Admin deleted a chat',
      true
    );
    
    res.json({
      success: true,
      message: 'Chat deleted successfully'
    });
  } catch (error) {
    logger.error(`Error deleting chat: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error deleting chat',
      error: error.message
    });
  }
});

/**
 * @desc    Get all chats (Admin only)
 * @route   GET /api/chats/admin
 * @access  Private/Admin
 */
const getAllChats = asyncHandler(async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can view all chats'
      });
    }
    
    const chats = await Chat.find({ isActive: true })
      .populate('participants', 'name email role')
      .sort('-lastMessage')
      .select('-messages');
    
    await createAuditLog(
      req,
      'read',
      'chat',
      null,
      'Admin viewed all chats',
      true
    );
    
    res.json({
      success: true,
      count: chats.length,
      chats
    });
  } catch (error) {
    logger.error(`Error getting all chats: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error retrieving all chats',
      error: error.message
    });
  }
});

module.exports = {
  getUserChats,
  getChatById,
  createChat,
  sendMessage,
  deleteChat,
  getAllChats
}; 