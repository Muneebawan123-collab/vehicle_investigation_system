import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import io from 'socket.io-client';
import axios from 'axios';

// Create notification context
const NotificationContext = createContext();

// Create provider component
export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  
  // API_BASE_URL should be derived from environment or fixed
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  // Remove duplicate '/api' if already in API_BASE_URL
  const API_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;
  const SOCKET_URL = API_BASE_URL;
  
  // Connect to socket
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    
    console.log(`Connecting to socket at: ${SOCKET_URL}`);
    
    try {
      // Fix socket connection
      const newSocket = io(SOCKET_URL, {
        withCredentials: true,
        transports: ['websocket'],
        auth: {
          token: localStorage.getItem('token')
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
      });
      
      setSocket(newSocket);
      
      // Socket event handlers
      newSocket.on('connect', () => {
        console.log('Socket connected');
        newSocket.emit('authenticate', user._id);
      });
      
      newSocket.on('notification', (notification) => {
        console.log('New notification received:', notification);
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      });
      
      newSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        setError('Failed to connect to notification service');
      });
      
      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
      });
      
      // Setup cleanup
      return () => {
        if (newSocket) {
          console.log('Disconnecting socket');
          newSocket.disconnect();
        }
      };
    } catch (error) {
      console.error('Socket initialization error:', error);
      setError('Failed to initialize notification service');
    }
  }, [isAuthenticated, user, SOCKET_URL]);
  
  // Fetch notifications on initial load
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications();
    }
  }, [isAuthenticated, user]);
  
  // Function to fetch notifications
  const fetchNotifications = async () => {
    if (!isAuthenticated || !user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching notifications from: ${API_URL}/notifications`);
      
      const response = await axios.get(`${API_URL}/notifications`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Notifications fetched:', response.data);
      
      if (Array.isArray(response.data)) {
        setNotifications(response.data);
        setUnreadCount(response.data.filter(notif => !notif.read).length);
      } else {
        console.error('Invalid notification data format:', response.data);
        setError('Received invalid notification data format');
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`${API_URL}/notifications/${notificationId}/read`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification._id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError('Failed to mark notification as read');
    }
  };
  
  // Function to mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await axios.put(`${API_URL}/notifications/read-all`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({ ...notification, read: true }))
      );
      
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      setError('Failed to mark all notifications as read');
    }
  };
  
  // Function to delete notification
  const deleteNotification = async (notificationId) => {
    try {
      await axios.delete(`${API_URL}/notifications/${notificationId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setNotifications(prevNotifications => 
        prevNotifications.filter(notification => notification._id !== notificationId)
      );
      
      // Recalculate unread count
      setUnreadCount(notifications
        .filter(notification => notification._id !== notificationId && !notification.read)
        .length
      );
    } catch (err) {
      console.error('Error deleting notification:', err);
      setError('Failed to delete notification');
    }
  };
  
  // Expose context values
  const contextValue = {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    setError,
  };
  
  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use the notification context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext; 