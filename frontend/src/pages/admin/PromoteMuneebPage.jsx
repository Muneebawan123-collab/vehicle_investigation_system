import React, { useState, useEffect } from 'react';
import { Container, Typography, Button, Paper, Alert, CircularProgress, Box, Divider } from '@mui/material';
import { AdminPanelSettings, BugReport, Login } from '@mui/icons-material';
import { promoteMuneebToAdmin, ensureMuneebLoggedIn } from '../../utils/updateUserRole';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

// API base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const PromoteMuneebPage = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const { currentUser, logout } = useAuth();
  const [emailChecked, setEmailChecked] = useState(false);
  
  // Check if user has the correct email
  const isMuneeb = currentUser?.email === 'muneeb@123.com';
  const isAdmin = currentUser?.role === 'admin';
  const canPromote = isAdmin || isMuneeb;

  // Check real user email from the server
  useEffect(() => {
    const checkCurrentUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await axios.get(`${API_URL}/users/profile`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          setEmailChecked(true);
          
          if (response.data && response.data.email === 'muneeb@123.com') {
            console.log('Verified login as Muneeb via API');
            setDebugInfo(prev => ({
              ...prev,
              verifiedEmail: 'muneeb@123.com',
              userId: response.data._id
            }));
            
            // Store the ID for reference
            localStorage.setItem('muneebUserId', response.data._id);
          }
        }
      } catch (err) {
        console.error('Error checking user profile:', err);
      }
    };
    
    checkCurrentUser();
  }, []);
  
  // Handles login as Muneeb
  const handleLoginAsMuneeb = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const success = await ensureMuneebLoggedIn();
      if (success) {
        setError('Successfully logged in as Muneeb. Please reload the page.');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setError('Failed to login as Muneeb. Please try again.');
      }
    } catch (err) {
      setError('Error during login: ' + (err.message || 'Unknown error'));
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePromoteClick = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      setDebugInfo(null);
      
      // Collect diagnostic information
      const token = localStorage.getItem('token');
      const diagnosticData = {
        user: {
          id: currentUser?._id,
          email: currentUser?.email,
          role: currentUser?.role,
          name: currentUser?.name
        },
        token: token ? {
          present: true,
          length: token.length,
        } : 'No token found'
      };
      
      setDebugInfo(diagnosticData);
      
      await promoteMuneebToAdmin();
      setSuccess(true);
      
    } catch (err) {
      console.error('Failed to promote Muneeb to admin:', err);
      
      // Extract detailed error information
      let errorMessage = 'There was an error promoting the user to admin. Please try again or contact support.';
      let debugData = {
        status: err.response?.status,
        statusText: err.response?.statusText,
        url: err.config?.url,
        method: err.config?.method,
        data: err.response?.data,
        headers: {
          ...err.config?.headers,
          Authorization: err.config?.headers?.Authorization ? 'Bearer [REDACTED]' : 'None'
        }
      };
      
      // Set detailed error message if available
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
        if (err.response.data.detail) {
          errorMessage += `: ${err.response.data.detail}`;
        }
      }
      
      setError(errorMessage);
      setDebugInfo(prev => ({...prev, error: debugData}));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <AdminPanelSettings color="primary" fontSize="large" sx={{ mr: 2 }} />
          <Typography variant="h4" component="h1">
            Promote Muneeb Awan to Admin
          </Typography>
        </Box>
        
        <Typography paragraph>
          This page allows you to promote the user 'Muneeb Awan' to the admin role. 
          After promotion, this user will have full administrative privileges to manage
          all aspects of the system, including other users, vehicles, incidents, and documents.
        </Typography>
        
        {emailChecked && !isMuneeb && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            You are not logged in as Muneeb (muneeb@123.com). Current email: {currentUser?.email || 'Not logged in'}
            <Box mt={1}>
              <Button 
                variant="outlined" 
                size="small" 
                startIcon={<Login />} 
                onClick={handleLoginAsMuneeb}
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login as Muneeb'}
              </Button>
            </Box>
          </Alert>
        )}
        
        {!canPromote && (
          <Alert severity="error" sx={{ mb: 3 }}>
            You don't have permission to perform this action. Only administrators or the user 'Muneeb' can access this functionality.
          </Alert>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Success! Muneeb Awan has been promoted to admin role. This change takes effect immediately.
          </Alert>
        )}
        
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={handlePromoteClick}
          disabled={loading || !canPromote || success}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AdminPanelSettings />}
          sx={{ mt: 2, mr: 2 }}
        >
          {loading ? 'Promoting...' : success ? 'Promoted Successfully' : 'Promote to Admin'}
        </Button>
        
        <Button
          variant="outlined"
          color="secondary"
          size="large"
          onClick={handleLoginAsMuneeb}
          disabled={loading || success}
          startIcon={<Login />}
          sx={{ mt: 2 }}
        >
          Login as Muneeb
        </Button>
        
        {success && (
          <Typography sx={{ mt: 3 }} color="text.secondary">
            You may need to log out and log back in for all changes to take effect.
          </Typography>
        )}
        
        {/* Debug Information */}
        {(debugInfo || currentUser) && (
          <>
            <Divider sx={{ my: 4 }} />
            <Box>
              <Box display="flex" alignItems="center" mb={2}>
                <BugReport color="action" sx={{ mr: 1 }} />
                <Typography variant="h6">Debug Information</Typography>
              </Box>
              
              <Typography variant="subtitle2" sx={{ mt: 2 }}>Current User:</Typography>
              <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
                <pre style={{ margin: 0, overflow: 'auto' }}>
                  {JSON.stringify({
                    id: currentUser?._id,
                    name: currentUser?.name,
                    email: currentUser?.email,
                    role: currentUser?.role
                  }, null, 2)}
                </pre>
              </Paper>
              
              {debugInfo && (
                <>
                  <Typography variant="subtitle2">Last Request Details:</Typography>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                    <pre style={{ margin: 0, overflow: 'auto' }}>
                      {JSON.stringify(debugInfo, null, 2)}
                    </pre>
                  </Paper>
                </>
              )}
            </Box>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default PromoteMuneebPage; 