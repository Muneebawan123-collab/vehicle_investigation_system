import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

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
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
      setIsAuthenticated(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users/profile`);
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error fetching user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, credentials);
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      setIsAuthenticated(true);
      return user;
    } catch (error) {
      throw error.response?.data || error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const register = async (userData) => {
    try {
      // Log data for debugging
      console.log('Registration data received in context:', userData);
      
      // Create a request object with both formats for maximum compatibility
      const [firstName, ...lastNameParts] = userData.name.split(' ');
      const lastName = lastNameParts.join(' ');
      
      const requestData = {
        // Include both formats
        name: userData.name,              // For models that use a single name field
        firstName: firstName,             // For models that use separate first/last name
        lastName: lastName,
        email: userData.email,
        password: userData.password,
        role: 'officer'                   // Use valid role from enum
      };
      
      console.log('Sending to server with both formats:', requestData);
      
      // Use full URL with explicit request configuration
      const response = await axios({
        method: 'post',
        url: `${API_BASE_URL}/api/users/register`,
        data: requestData,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Registration successful:', response.data);
      return response.data;
    } catch (error) {
      console.error("Registration error in context:", error.response?.data || error);
      
      if (error.response && error.response.data) {
        throw error.response.data;
      }
      throw error;
    }
  };

  // Add hasRole function
  const hasRole = (role) => {
    return user?.role === role;
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    logout,
    register,
    hasRole, // Add hasRole to the context value
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
