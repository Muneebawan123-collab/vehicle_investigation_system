import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { formatFileUrl } from '../utils/imageUtils';

// Define the backend API base URL
const API_BASE_URL = '';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tokenInfo, setTokenInfo] = useState(null);

  // Check if token is valid with detailed diagnostics
  const isTokenValid = (token) => {
    if (!token) {
      console.log('Token validation failed: No token provided');
      return false;
    }
    
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      const isValid = decoded.exp > currentTime;
      
      // Create diagnostic info
      const diagnosticInfo = {
        id: decoded.id,
        role: decoded.role,
        issuedAt: decoded.iat ? new Date(decoded.iat * 1000).toISOString() : 'Unknown',
        expiresAt: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'Unknown',
        remainingTime: decoded.exp ? `${Math.floor((decoded.exp - currentTime) / 60)} minutes` : 'Unknown',
        isValid
      };
      
      console.log('Token validation result:', diagnosticInfo);
      setTokenInfo(diagnosticInfo);
      
      if (!isValid) {
        console.log(`Token expired at ${diagnosticInfo.expiresAt}`);
      }
      
      return isValid;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  };

  useEffect(() => {
    if (token && isTokenValid(token)) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      if (token) {
        console.log('Invalid or expired token, logging out');
      }
      logout();
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      console.log('Fetching user profile...');
      const response = await axios.get(`/api/users/profile`);
      console.log('User profile received:', response.data);
      
      // Store user data in state and localStorage
      const userData = response.data;
      
      // Log specific fields to diagnose the issue
      console.log('User name from API:', userData.name);
      console.log('User address from API:', userData.address);
      
      // Ensure user data has name and address properly set
      if (!userData.name) {
        console.warn('Name field is missing from user data');
      }
      
      if (!userData.address) {
        console.warn('Address field is missing from user data');
      }
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error fetching user:', error.response || error);
      if (error.response?.status === 401) {
        console.log('Unauthorized response when fetching user profile, logging out');
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      console.log('Attempting login...');
      const response = await axios.post(`/api/auth/login`, credentials);
      const { token, user } = response.data;
      console.log('Login successful, token received');
      
      // Store token and user info
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Update state
      setToken(token);
      setUser(user);
      setIsAuthenticated(true);
      
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Validate the new token
      isTokenValid(token);
      
      console.log('Authentication state updated', { isAuthenticated: true, user });
      
      return user;
    } catch (error) {
      console.error('Login error:', error.response?.data || error);
      throw error.response?.data || error;
    }
  };

  // Add function to format image URL
  const formatImageUrl = (url) => {
    return formatFileUrl(url);
  };

  // Helper function to format user data including profile image URL
  const formatUserData = (userData) => {
    if (!userData) return null;
    
    const formattedUser = { ...userData };
    
    if (formattedUser.profileImage) {
      formattedUser.profileImage = formatImageUrl(formattedUser.profileImage);
    }
    
    return formattedUser;
  };

  const updateProfile = async (profileData) => {
    try {
      console.log('Updating user profile...', profileData);
      setLoading(true);
      
      // Check if we have a valid token
      if (!token) {
        throw new Error('Authentication required to update profile');
      }
      
      // Check if profileData is FormData (for file uploads) or regular object
      const isFormData = profileData instanceof FormData;
      
      // Log form data contents for debugging
      if (isFormData) {
        console.log('Form data contents:');
        for (let [key, value] of profileData.entries()) {
          if (key !== 'profileImage') { // Don't log the entire image data
            console.log(key, ':', value);
          } else {
            console.log('profileImage: [File data]');
          }
        }
        
        // Ensure critical fields are present
        const name = profileData.get('name');
        const address = profileData.get('address');
        console.log('Direct formData access - name:', name);
        console.log('Direct formData access - address:', address);
      }
      
      // Make the API call with appropriate headers
      const response = await axios.put(
        `/api/users/profile`, 
        profileData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            ...(isFormData ? {
              'Content-Type': 'multipart/form-data'
            } : {
              'Content-Type': 'application/json'
            })
          }
        }
      );
      
      console.log('Profile update response:', response.data);
      
      // After getting the response, format the user data
      let updatedUser = null;
      
      if (response.data?.success && response.data?.user) {
        // Standard format with success flag and user object
        updatedUser = response.data.user;
      } else if (response.data?._id) {
        // Just the user object directly
        updatedUser = response.data;
      } else if (response.data?.user && response.data.user._id) {
        // Another possible format
        updatedUser = response.data.user;
      }
      
      if (updatedUser) {
        // Format and update the user data
        const formattedUser = formatUserData(updatedUser);
        
        // Make sure name and address are properly set (fallback to form data if missing)
        if (isFormData) {
          // Direct fallbacks from form data
          if (!formattedUser.name || formattedUser.name === 'undefined') {
            const formName = profileData.get('name');
            if (formName) {
              console.log('Setting name from form data:', formName);
              formattedUser.name = formName;
            }
          }
          
          if (!formattedUser.address || formattedUser.address === 'undefined') {
            const formAddress = profileData.get('address');
            if (formAddress) {
              console.log('Setting address from form data:', formAddress);
              formattedUser.address = formAddress;
            }
          }
        }
        
        console.log('Setting updated user data:', formattedUser);
        setUser(formattedUser);
        localStorage.setItem('user', JSON.stringify(formattedUser));
        
        // Force a refresh of user data from server to ensure we have the latest
        setTimeout(() => fetchUser(), 500);
        
        return {
          success: true,
          user: formattedUser
        };
      }
      
      // If we get here, the response format is unexpected
      console.error('Unexpected response format:', response.data);
      throw new Error('Invalid response format from server');
    } catch (error) {
      console.error('Profile update error:', error.response?.data || error);
      
      // Handle specific error cases
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setTokenInfo(null);
    console.log('User logged out, auth state cleared');
  };

  const register = async (userData) => {
    try {
      const [firstName, ...lastNameParts] = userData.name.split(' ');
      const lastName = lastNameParts.join(' ');
      
      const requestData = {
        name: userData.name,
        firstName: firstName,
        lastName: lastName,
        email: userData.email,
        password: userData.password,
        role: 'officer'
      };
      
      const response = await axios({
        method: 'post',
        url: `/api/users/register`,
        data: requestData,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error("Registration error in context:", error.response?.data || error);
      throw error.response?.data || error;
    }
  };

  const hasRole = (role) => {
    return user?.role === role;
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    tokenInfo,
    login,
    logout,
    register,
    updateProfile,
    hasRole,
    isTokenValid,
    currentUser: user, // Add alias for consistency
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
