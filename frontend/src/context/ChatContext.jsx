import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import api from '../utils/api';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch user's chats
  const fetchChats = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/api/chats');
      setChats(response.data.chats);
      
      // Calculate unread count
      let count = 0;
      response.data.chats.forEach(chat => {
        if (chat.unreadCount) count += chat.unreadCount;
      });
      setUnreadCount(count);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not fetch chats');
      console.error('Error fetching chats:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch a specific chat with messages
  const fetchChat = useCallback(async (chatId) => {
    if (!user || !chatId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/api/chats/${chatId}`);
      setCurrentChat(response.data.chat);
      
      // Update this chat in the chats list
      setChats(prev => 
        prev.map(chat => 
          chat._id === chatId 
            ? { ...chat, unreadCount: 0 } 
            : chat
        )
      );
      
      // Recalculate unread count
      calculateUnreadCount();
      
      return response.data.chat;
    } catch (err) {
      setError(err.response?.data?.message || 'Could not fetch chat');
      console.error('Error fetching chat:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Create a new chat
  const createChat = useCallback(async (participants, title, initialMessage) => {
    if (!user) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/api/chats', {
        participants,
        title,
        initialMessage
      });
      
      // Add the new chat to the chats list
      setChats(prev => [response.data.chat, ...prev]);
      
      return response.data.chat;
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create chat');
      console.error('Error creating chat:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Send a message in current chat
  const sendMessage = useCallback(async (chatId, content) => {
    if (!user || !chatId) return null;
    
    setError(null);
    
    try {
      const response = await api.post(`/api/chats/${chatId}/messages`, { content });
      
      // Update current chat with the new message
      if (currentChat && currentChat._id === chatId) {
        const updatedMessages = [...currentChat.messages, response.data.chatMessage];
        setCurrentChat(prev => ({ ...prev, messages: updatedMessages }));
      }
      
      // Update last message timestamp in chats list
      setChats(prev => 
        prev.map(chat => 
          chat._id === chatId 
            ? { ...chat, lastMessage: new Date() } 
            : chat
        )
      );
      
      return response.data.chatMessage;
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send message');
      console.error('Error sending message:', err);
      return null;
    }
  }, [user, currentChat]);

  // Calculate total unread messages
  const calculateUnreadCount = useCallback(() => {
    let count = 0;
    chats.forEach(chat => {
      if (chat.unreadCount) count += chat.unreadCount;
    });
    setUnreadCount(count);
  }, [chats]);

  // Delete a chat (admin only)
  const deleteChat = useCallback(async (chatId) => {
    if (!user || !chatId) return false;
    
    setError(null);
    
    try {
      await api.delete(`/api/chats/${chatId}`);
      
      // Remove the chat from the chats list
      setChats(prev => prev.filter(chat => chat._id !== chatId));
      
      // Clear current chat if it's the deleted one
      if (currentChat && currentChat._id === chatId) {
        setCurrentChat(null);
      }
      
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete chat');
      console.error('Error deleting chat:', err);
      return false;
    }
  }, [user, currentChat]);

  // Fetch chats when user changes
  useEffect(() => {
    if (user) {
      fetchChats();
    } else {
      setChats([]);
      setCurrentChat(null);
      setUnreadCount(0);
    }
  }, [user, fetchChats]);

  // Set up polling for new messages
  useEffect(() => {
    if (!user) return;
    
    const intervalId = setInterval(() => {
      fetchChats();
      
      // Also refresh current chat if one is open
      if (currentChat) {
        fetchChat(currentChat._id);
      }
    }, 30000); // Poll every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [user, fetchChats, fetchChat, currentChat]);

  return (
    <ChatContext.Provider
      value={{
        chats,
        currentChat,
        loading,
        error,
        unreadCount,
        fetchChats,
        fetchChat,
        createChat,
        sendMessage,
        deleteChat,
        setCurrentChat
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);

export default ChatContext; 