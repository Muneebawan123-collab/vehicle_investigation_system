import { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Link,
  Grid,
  Box,
  Typography,
  InputAdornment,
  IconButton,
  Alert,
} from '@mui/material';
import { motion } from 'framer-motion';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Avatar from '@mui/material/Avatar';
import { useAuth } from '../../context/AuthContext';

const LoginPage = () => {
  const { login, loading, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Always redirect to dashboard after login
  const from = '/';
  
  // Redirect if already authenticated
  useEffect(() => {
    // Check auth context
    if (user || isAuthenticated) {
      console.log('User already authenticated, redirecting to dashboard');
      navigate('/', { replace: true });
      return;
    }
    
    // Fallback check for local storage
    const localStorageUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (localStorageUser && token) {
      console.log('Found user data in localStorage, redirecting to dashboard');
      navigate('/', { replace: true });
    }
    
    // Add global redirect handler for login success
    window.__redirectToDashboard = () => {
      console.log('Global redirect handler called');
      navigate('/', { replace: true });
    };
    
    return () => {
      // Clean up
      delete window.__redirectToDashboard;
    };
  }, [user, isAuthenticated, navigate]);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [localError, setLocalError] = useState(null);
  
  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    
    setFormData({
      ...formData,
      [name]: name === 'rememberMe' ? checked : value,
    });
    
    // Clear field-specific error when user starts typing
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: '',
      });
    }
  };
  
  const validateForm = () => {
    const errors = {};
    
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    
    if (!validateForm()) return;
    
    try {
      console.log('Logging in with:', formData.email);
      const result = await login({ email: formData.email, password: formData.password });
      console.log('Login successful, user:', result);
      
      // Add more diagnostic logging
      const authToken = localStorage.getItem('token');
      console.log('Auth token stored:', authToken ? `${authToken.substring(0, 20)}...` : 'None');
      console.log('User data stored:', localStorage.getItem('user'));
      
      // Force navigation to dashboard using multiple approaches
      console.log('Navigating to dashboard at:', from);
      
      // Approach 1: Direct navigation
      navigate('/', { replace: true });
      
      // Approach 2: Timeout navigation as backup
      setTimeout(() => {
        console.log('Executing delayed navigation to dashboard');
        navigate('/', { replace: true });
      }, 200);
      
      // Approach 3: Global handler
      if (window.__redirectToDashboard) {
        setTimeout(() => {
          console.log('Executing global redirect handler');
          window.__redirectToDashboard();
        }, 300);
      }
      
      // Approach 4: Direct window location (most drastic)
      setTimeout(() => {
        console.log('Executing direct window location change');
        window.location.href = '/';
      }, 400);
    } catch (err) {
      console.error("Login failed:", err);
      setLocalError(err.message || "Login failed. Please check your credentials.");
    }
  };
  
  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{ width: '100%' }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
          Sign In
        </Typography>
        
        {localError && (
          <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
            {localError}
          </Alert>
        )}
        
        {location.state?.message && (
          <Alert severity="info" sx={{ mb: 2, width: '100%' }}>
            {location.state.message}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={formData.email}
            onChange={handleChange}
            error={!!formErrors.email}
            helperText={formErrors.email}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
            error={!!formErrors.password}
            helperText={formErrors.password}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={toggleShowPassword}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <FormControlLabel
            control={
              <Checkbox 
                name="rememberMe" 
                color="primary" 
                checked={formData.rememberMe}
                onChange={handleChange}
              />
            }
            label="Remember me"
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2, py: 1.5 }}
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
          <Grid container>
            <Grid item xs>
              <Link component={RouterLink} to="/forgot-password" variant="body2">
                Forgot password?
              </Link>
            </Grid>
            <Grid item>
              <Link component={RouterLink} to="/register" variant="body2">
                {"Don't have an account? Sign Up"}
              </Link>
            </Grid>
          </Grid>
        </Box>
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Link component={RouterLink} to="/home" variant="body2">
            Return to Home Page
          </Link>
        </Box>
      </Box>
    </motion.div>
  );
};

export default LoginPage; 