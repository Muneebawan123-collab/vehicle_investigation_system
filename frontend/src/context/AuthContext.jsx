import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// Define the backend API base URL - change port if your backend runs on a different port
const API_BASE_URL = 'http://localhost:5000';

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
      const response = await axios.get(`${API_BASE_URL}/api/users/profile`);
      console.log('User profile received:', response.data);
      setUser(response.data);
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
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, credentials);
      const { token, user } = response.data;
      console.log('Login successful, token received');
      
      // Store token and user info
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      setIsAuthenticated(true);
      
      // Validate the new token
      isTokenValid(token);
      
      return user;
    } catch (error) {
      console.error('Login error:', error.response?.data || error);
      throw error.response?.data || error;
    }
  };

  const updateProfile = async (profileData) => {
    try {
      console.log('Updating user profile...', profileData);
      
      // Check if we have a valid token
      if (!token) {
        throw new Error('Authentication required to update profile');
      }
      
      // Convert name field to firstName/lastName for backend compatibility
      const formattedData = { ...profileData };
      
      if (profileData.name) {
        // Split the name into firstName and lastName
        const nameParts = profileData.name.split(' ');
        formattedData.firstName = nameParts[0] || '';
        formattedData.lastName = nameParts.slice(1).join(' ') || '';
        // Keep name for our frontend
        formattedData.name = profileData.name;
      }
      
      // Make the API call
      const response = await axios.put(
        `${API_BASE_URL}/api/users/profile`, 
        formattedData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log('Profile update response:', response.data);
      
      // Update the user state with the new data
      if (response.data && response.data.user) {
        setUser(response.data.user);
      } else if (response.data) {
        // Combine firstName and lastName into name if they exist
        const userData = { ...response.data };
        if (response.data.firstName || response.data.lastName) {
          userData.name = `${response.data.firstName || ''} ${response.data.lastName || ''}`.trim();
        }
        
        setUser(userData);
      }
      
      return response.data;
    } catch (error) {
      console.error('Profile update error:', error.response?.data || error);
      throw error.response?.data || error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
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
        url: `${API_BASE_URL}/api/users/register`,
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
