import React, { useState } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Button, 
  Grid, 
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  FormControlLabel,
  Checkbox,
  Snackbar,
  Alert,
  Card,
  CardContent,
  Divider,
  Chip
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';

const TestNotificationsPage = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  const [notificationData, setNotificationData] = useState({
    title: 'Test Notification',
    message: 'This is a test notification sent from the admin panel.',
    type: 'info',
    isUrgent: false,
    resourceType: 'system'
  });
  
  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setNotificationData(prev => ({
      ...prev,
      [name]: name === 'isUrgent' ? checked : value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      await axios.post('/notifications/test', notificationData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess(true);
      // Optionally reset form values here
    } catch (err) {
      console.error('Failed to send test notification:', err);
      setError(err.response?.data?.message || 'Failed to send notification');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSuccessClose = () => {
    setSuccess(false);
  };
  
  const handleErrorClose = () => {
    setError(null);
  };
  
  const predefinedNotifications = [
    {
      title: 'New Vehicle Registration',
      message: 'A new vehicle has been registered in the system.',
      type: 'info',
      resourceType: 'vehicle'
    },
    {
      title: 'Urgent Incident Report',
      message: 'An urgent incident has been reported and requires immediate attention.',
      type: 'error',
      isUrgent: true,
      resourceType: 'incident'
    },
    {
      title: 'Document Updated',
      message: 'A document has been updated and requires your review.',
      type: 'warning',
      resourceType: 'document'
    },
    {
      title: 'Investigation Completed',
      message: 'An investigation has been completed successfully.',
      type: 'success',
      resourceType: 'incident'
    }
  ];
  
  const loadPredefinedNotification = (notification) => {
    setNotificationData({
      ...notification
    });
  };
  
  return (
    <Container maxWidth="lg">
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <NotificationsActiveIcon sx={{ mr: 2, fontSize: 30, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Test Notifications
          </Typography>
        </Box>
        
        <Typography variant="body1" paragraph>
          Use this page to send test notifications to yourself for testing purposes. 
          The notifications will appear in real-time in the notification bell and will be stored in your notification history.
        </Typography>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h6" gutterBottom>
          Predefined Notifications
        </Typography>
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {predefinedNotifications.map((notification, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-3px)' },
                  borderLeft: notification.isUrgent ? '4px solid red' : 'none'
                }}
                onClick={() => loadPredefinedNotification(notification)}
              >
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    {notification.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {notification.message}
                  </Typography>
                  <Box sx={{ display: 'flex', mt: 2, justifyContent: 'space-between' }}>
                    <Chip 
                      label={notification.type.toUpperCase()} 
                      color={
                        notification.type === 'success' ? 'success' :
                        notification.type === 'error' ? 'error' :
                        notification.type === 'warning' ? 'warning' : 'info'
                      }
                      size="small"
                    />
                    {notification.isUrgent && (
                      <Chip label="URGENT" color="error" size="small" />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h6" gutterBottom>
          Custom Notification
        </Typography>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Title"
                name="title"
                value={notificationData.title}
                onChange={handleChange}
                fullWidth
                required
                variant="outlined"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="type-label">Notification Type</InputLabel>
                <Select
                  labelId="type-label"
                  name="type"
                  value={notificationData.type}
                  onChange={handleChange}
                  label="Notification Type"
                >
                  <MenuItem value="info">Information</MenuItem>
                  <MenuItem value="success">Success</MenuItem>
                  <MenuItem value="warning">Warning</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Message"
                name="message"
                value={notificationData.message}
                onChange={handleChange}
                fullWidth
                required
                multiline
                rows={3}
                variant="outlined"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="resource-type-label">Resource Type</InputLabel>
                <Select
                  labelId="resource-type-label"
                  name="resourceType"
                  value={notificationData.resourceType}
                  onChange={handleChange}
                  label="Resource Type"
                >
                  <MenuItem value="system">System</MenuItem>
                  <MenuItem value="vehicle">Vehicle</MenuItem>
                  <MenuItem value="incident">Incident</MenuItem>
                  <MenuItem value="document">Document</MenuItem>
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="chat">Chat</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="isUrgent"
                      checked={notificationData.isUrgent}
                      onChange={handleChange}
                      color="error"
                    />
                  }
                  label="Mark as Urgent"
                />
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Test Notification'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
      
      <Snackbar open={success} autoHideDuration={5000} onClose={handleSuccessClose}>
        <Alert onClose={handleSuccessClose} severity="success">
          Test notification sent successfully!
        </Alert>
      </Snackbar>
      
      <Snackbar open={!!error} autoHideDuration={5000} onClose={handleErrorClose}>
        <Alert onClose={handleErrorClose} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default TestNotificationsPage; 