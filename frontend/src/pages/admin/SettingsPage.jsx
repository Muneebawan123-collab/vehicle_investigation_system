import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const SettingsPage = () => {
  const [settings, setSettings] = useState({
    systemName: 'Vehicle Investigation System',
    emailNotifications: true,
    smsNotifications: false,
    documentRetentionDays: 30,
    maxFileSize: 10,
    maintenanceMode: false,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const { token } = useAuth();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get('/api/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Ensure all boolean fields have default values if undefined
      const receivedSettings = response.data || {};
      const safeSettings = {
        ...settings, // Keep defaults
        ...receivedSettings,
        // Ensure boolean values are never undefined
        emailNotifications: receivedSettings.emailNotifications === undefined ? 
          settings.emailNotifications : Boolean(receivedSettings.emailNotifications),
        smsNotifications: receivedSettings.smsNotifications === undefined ? 
          settings.smsNotifications : Boolean(receivedSettings.smsNotifications),
        maintenanceMode: receivedSettings.maintenanceMode === undefined ? 
          settings.maintenanceMode : Boolean(receivedSettings.maintenanceMode),
      };
      
      setSettings(safeSettings);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (value || '') // Ensure non-checkbox values are never undefined
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await axios.put('/api/settings', settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess(true);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        System Settings
      </Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Settings updated successfully!
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="System Name"
                name="systemName"
                value={settings.systemName || ''}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Notification Settings
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(settings.emailNotifications)}
                    onChange={handleChange}
                    name="emailNotifications"
                  />
                }
                label="Email Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(settings.smsNotifications)}
                    onChange={handleChange}
                    name="smsNotifications"
                  />
                }
                label="SMS Notifications"
              />
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Document Settings
              </Typography>
              <TextField
                fullWidth
                type="number"
                label="Document Retention Period (days)"
                name="documentRetentionDays"
                value={settings.documentRetentionDays || 30}
                onChange={handleChange}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                type="number"
                label="Maximum File Size (MB)"
                name="maxFileSize"
                value={settings.maxFileSize || 10}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                System Status
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(settings.maintenanceMode)}
                    onChange={handleChange}
                    name="maintenanceMode"
                  />
                }
                label="Maintenance Mode"
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                sx={{ mt: 2 }}
              >
                {loading ? 'Saving...' : 'Save Settings'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default SettingsPage; 