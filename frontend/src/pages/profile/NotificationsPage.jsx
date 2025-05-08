import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon, 
  ListItemSecondaryAction, 
  IconButton, 
  Divider, 
  Button, 
  Chip, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  TextField,
  InputAdornment,
  Grid,
  Alert,
  Tooltip,
  CircularProgress
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import ErrorIcon from '@mui/icons-material/Error';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import { format } from 'date-fns';
import { useNotifications } from '../../context/NotificationContext';
import { motion } from 'framer-motion';

const NotificationsPage = () => {
  const { 
    notifications, 
    isLoading, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    clearAllNotifications 
  } = useNotifications();
  
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  
  // Apply filters, search, and sorting to notifications
  useEffect(() => {
    let result = [...notifications];
    
    // Apply type filter
    if (filter !== 'all') {
      result = result.filter((notification) => notification.type === filter);
    }
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (notification) =>
          notification.title.toLowerCase().includes(query) ||
          notification.message.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date-asc':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'date-desc':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'unread-first':
          return b.isRead - a.isRead;
        case 'read-first':
          return a.isRead - b.isRead;
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
    
    setFilteredNotifications(result);
  }, [notifications, filter, searchQuery, sortBy]);
  
  const handleFilterChange = (event) => {
    setFilter(event.target.value);
  };
  
  const handleSortChange = (event) => {
    setSortBy(event.target.value);
  };
  
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };
  
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon color="success" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return <InfoIcon color="info" />;
    }
  };
  
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'PPpp');
    } catch (error) {
      return 'Unknown date';
    }
  };
  
  return (
    <Container maxWidth="lg">
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Notifications
        </Typography>
        
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              variant="outlined"
              label="Search notifications"
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="filter-label">Filter by Type</InputLabel>
              <Select
                labelId="filter-label"
                value={filter}
                onChange={handleFilterChange}
                label="Filter by Type"
                startAdornment={
                  <InputAdornment position="start">
                    <FilterListIcon />
                  </InputAdornment>
                }
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="info">Information</MenuItem>
                <MenuItem value="success">Success</MenuItem>
                <MenuItem value="warning">Warning</MenuItem>
                <MenuItem value="error">Error</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="sort-label">Sort by</InputLabel>
              <Select
                labelId="sort-label"
                value={sortBy}
                onChange={handleSortChange}
                label="Sort by"
                startAdornment={
                  <InputAdornment position="start">
                    <SortIcon />
                  </InputAdornment>
                }
              >
                <MenuItem value="date-desc">Newest first</MenuItem>
                <MenuItem value="date-asc">Oldest first</MenuItem>
                <MenuItem value="unread-first">Unread first</MenuItem>
                <MenuItem value="read-first">Read first</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <Box sx={{ display: 'flex', height: '100%' }}>
              <Button
                variant="outlined"
                color="primary"
                fullWidth
                onClick={markAllAsRead}
                disabled={notifications.length === 0 || notifications.every(n => n.isRead)}
                sx={{ height: '100%' }}
              >
                Mark All Read
              </Button>
            </Box>
          </Grid>
        </Grid>
        
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {filteredNotifications.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <NotificationsOffIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No notifications found
                  </Typography>
                  {searchQuery || filter !== 'all' ? (
                    <Typography variant="body2" color="text.secondary">
                      Try adjusting your search or filters
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      You're all caught up!
                    </Typography>
                  )}
                </Box>
              </motion.div>
            ) : (
              <>
                <List sx={{ width: '100%' }}>
                  {filteredNotifications.map((notification) => (
                    <React.Fragment key={notification._id}>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ListItem
                          alignItems="flex-start"
                          sx={{
                            py: 2,
                            px: 2,
                            borderLeft: notification.isUrgent ? '4px solid red' : 'none',
                            bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                            '&:hover': {
                              bgcolor: 'action.hover',
                            },
                          }}
                          onClick={() => {
                            if (!notification.isRead) {
                              markAsRead(notification._id);
                            }
                          }}
                        >
                          <ListItemIcon>
                            {getNotificationIcon(notification.type)}
                          </ListItemIcon>
                          
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                <Typography variant="subtitle1" component="div" sx={{ fontWeight: 600 }}>
                                  {notification.title}
                                </Typography>
                                {!notification.isRead && (
                                  <Chip 
                                    label="NEW" 
                                    size="small" 
                                    color="primary" 
                                    sx={{ ml: 1, height: 20 }} 
                                  />
                                )}
                                {notification.isUrgent && (
                                  <Chip 
                                    label="URGENT" 
                                    size="small" 
                                    color="error" 
                                    sx={{ ml: 1, height: 20 }} 
                                  />
                                )}
                              </Box>
                            }
                            secondary={
                              <>
                                <Typography variant="body2" color="text.primary" sx={{ mb: 1 }}>
                                  {notification.message}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {formatDate(notification.createdAt)}
                                </Typography>
                                {notification.resourceType && notification.resourceId && (
                                  <Chip
                                    label={`${notification.resourceType.charAt(0).toUpperCase() + notification.resourceType.slice(1)}`}
                                    size="small"
                                    variant="outlined"
                                    sx={{ ml: 1, height: 20 }}
                                  />
                                )}
                              </>
                            }
                          />
                          
                          <ListItemSecondaryAction>
                            <Tooltip title="Delete notification">
                              <IconButton 
                                edge="end" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification._id);
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </ListItemSecondaryAction>
                        </ListItem>
                      </motion.div>
                      <Divider component="li" />
                    </React.Fragment>
                  ))}
                </List>
                
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                  <Button 
                    variant="outlined" 
                    color="error" 
                    startIcon={<DeleteIcon />}
                    onClick={clearAllNotifications}
                  >
                    Clear All Notifications
                  </Button>
                </Box>
              </>
            )}
          </>
        )}
      </Paper>
    </Container>
  );
};

export default NotificationsPage; 