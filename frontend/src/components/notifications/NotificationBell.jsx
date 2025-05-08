import React, { useState, useEffect } from 'react';
import { 
  Badge, 
  IconButton, 
  Menu, 
  MenuItem, 
  Typography, 
  Box, 
  Divider, 
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Tooltip,
  Paper,
  Alert
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { Link } from 'react-router-dom';
import moment from 'moment';
import { useNotifications } from '../../context/NotificationContext';

// Notification type icons
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const NotificationBell = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const { 
    notifications, 
    unreadCount, 
    loading, 
    error, 
    fetchNotifications,
    markAsRead, 
    markAllAsRead 
  } = useNotifications();

  // Refresh notifications on initial load
  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleRetry = () => {
    fetchNotifications();
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification._id);
    }
    handleClose();
    // Navigate or handle click based on notification type if needed
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    // Keep menu open
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'info':
        return <InfoIcon color="info" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'success':
        return <CheckCircleIcon color="success" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  // Get the display notifications (max 5 most recent)
  const displayNotifications = notifications.slice(0, 5);

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton 
          color="inherit" 
          onClick={handleClick}
          aria-label={`${unreadCount} unread notifications`}
        >
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          style: {
            width: '350px',
            maxHeight: '70vh',
          },
        }}
      >
        <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Button 
              size="small" 
              variant="text" 
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </Box>
        
        <Divider />
        
        {/* Loading state */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={24} />
          </Box>
        )}
        
        {/* Error state */}
        {error && !loading && (
          <Box sx={{ p: 2 }}>
            <Alert 
              severity="error" 
              action={
                <Button color="inherit" size="small" onClick={handleRetry}>
                  Retry
                </Button>
              }
            >
              {error}
            </Alert>
          </Box>
        )}
        
        {/* Empty state */}
        {!loading && !error && notifications.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="textSecondary">
              No notifications
            </Typography>
          </Box>
        )}
        
        {/* Notifications list */}
        {!loading && !error && notifications.length > 0 && (
          <List sx={{ p: 0 }}>
            {displayNotifications.map((notification) => (
              <ListItem 
                key={notification._id} 
                button 
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  bgcolor: notification.read ? 'transparent' : 'action.hover',
                  borderLeft: notification.read ? 'none' : '3px solid',
                  borderColor: 'primary.main',
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'background.paper' }}>
                    {getNotificationIcon(notification.type)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary={
                    <Typography variant="subtitle2" noWrap>
                      {notification.title}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" color="textSecondary" noWrap>
                        {notification.message}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {moment(notification.createdAt).fromNow()}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))}
            
            {notifications.length > 5 && (
              <Box sx={{ p: 1, textAlign: 'center' }}>
                <Button
                  component={Link}
                  to="/notifications"
                  size="small"
                  onClick={handleClose}
                >
                  View all ({notifications.length})
                </Button>
              </Box>
            )}
          </List>
        )}
      </Menu>
    </>
  );
};

export default NotificationBell; 