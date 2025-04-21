import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  Grid,
  CircularProgress,
  Divider
} from '@mui/material';
import { Settings as SettingsIcon, Save } from '@mui/icons-material';
import axios from 'axios';

// Configure axios baseURL
axios.defaults.baseURL = 'http://localhost:5000';

const SettingsPage = () => {
  const [settings, setSettings] = useState({
    systemName: '',
    emailNotifications: true,
    smsNotifications: false,
    maxFileSize: 10,
    allowedFileTypes: [],
    retentionPeriod: 30,
    autoArchive: false,
    maintenanceMode: false
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        setSettings(response.data.data);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError(err.response?.data?.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value, checked } = event.target;
    setSettings(prev => ({
      ...prev,
      [name]: event.target.type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await axios.put('/api/settings', settings, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setSuccess('Settings updated successfully');
        setSettings(response.data.data);
      }
    } catch (err) {
      console.error('Error updating settings:', err);
      setError(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Paper sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <SettingsIcon sx={{ mr: 2 }} />
          <Typography variant="h5">System Settings</Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="System Name"
                name="systemName"
                value={settings.systemName}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                System Status
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.maintenanceMode}
                    onChange={handleChange}
                    name="maintenanceMode"
                    color="warning"
                  />
                }
                label="Maintenance Mode"
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Notification Settings
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.emailNotifications}
                        onChange={handleChange}
                        name="emailNotifications"
                        color="primary"
                      />
                    }
                    label="Email Notifications"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.smsNotifications}
                        onChange={handleChange}
                        name="smsNotifications"
                        color="primary"
                      />
                    }
                    label="SMS Notifications"
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Document Settings
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Max File Size (MB)"
                    name="maxFileSize"
                    value={settings.maxFileSize}
                    onChange={handleChange}
                    inputProps={{ min: 1, max: 100 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Retention Period (days)"
                    name="retentionPeriod"
                    value={settings.retentionPeriod}
                    onChange={handleChange}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.autoArchive}
                        onChange={handleChange}
                        name="autoArchive"
                        color="primary"
                      />
                    }
                    label="Auto Archive Documents"
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>

          <Box mt={3} display="flex" justifyContent="flex-end">
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={saving}
              startIcon={saving ? <CircularProgress size={20} /> : <Save />}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default SettingsPage; 