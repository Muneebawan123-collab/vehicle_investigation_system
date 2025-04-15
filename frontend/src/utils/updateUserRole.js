import { adminService } from '../services/api';
import axios from 'axios';

// API base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Updates a user's role to the specified role
 * @param {string} userId - The user's ID
 * @param {string} role - The new role ('admin', 'officer', or 'investigator')
 * @returns {Promise} - Promise that resolves when the role is updated
 */
export const updateUserRole = async (userId, role) => {
  try {
    console.log(`Updating user ${userId} to role: ${role}`);
    const response = await adminService.updateUserRole(userId, role);
    console.log('User role updated successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to update user role:', error);
    throw error;
  }
};

/**
 * Updates a specified user to admin role
 * @param {string} userId - The user's ID
 * @returns {Promise} - Promise that resolves when the role is updated
 */
export const promoteUserToAdmin = async (userId) => {
  return updateUserRole(userId, 'admin');
};

/**
 * Ensures Muneeb account is logged in
 * If not currently logged in as Muneeb, this will attempt to login
 * @returns {Promise<boolean>} - Returns true if login successful
 */
export const ensureMuneebLoggedIn = async () => {
  // Check current logged in user
  const token = localStorage.getItem('token');
  let isMuneebLoggedIn = false;
  
  if (token) {
    try {
      // Check if token is for Muneeb by email
      const decoded = JSON.parse(atob(token.split('.')[1]));
      
      // Check if we can get user info to verify email
      try {
        const response = await axios.get(`${API_URL}/users/profile`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data && response.data.email === 'muneeb@123.com') {
          console.log('Already logged in as Muneeb');
          return true;
        }
      } catch (err) {
        console.log('Could not verify current user, will try to login');
      }
      
      console.log('Logged in as another user, not as Muneeb');
    } catch (e) {
      console.error('Error checking token:', e);
    }
  }
  
  // If not logged in as Muneeb, attempt to login
  if (!isMuneebLoggedIn) {
    try {
      console.log('Attempting to login as Muneeb');
      
      // Call login API
      const response = await axios.post(`${API_URL}/users/login`, {
        email: 'muneeb@123.com',
        password: 'password123'
      });
      
      if (response.data && response.data.token) {
        // Store token and user
        localStorage.setItem('token', response.data.token);
        console.log('Successfully logged in as Muneeb');
        
        // Store Muneeb's ID if returned
        if (response.data._id) {
          localStorage.setItem('muneebUserId', response.data._id);
        }
        
        return true;
      }
    } catch (loginError) {
      console.error('Failed to login as Muneeb:', loginError);
      return false;
    }
  }
  
  return isMuneebLoggedIn;
};

/**
 * Updates a specific user to the admin role (Muneeb Awan)
 * @returns {Promise} - Promise that resolves when the operation is complete
 */
export const promoteMuneebToAdmin = async () => {
  // Use a fixed ID for API URL, but this isn't crucial - we're finding by email on the backend
  const MUNEEB_ID = '67fdfab1c5f4f06ad5dced30';
  
  try {
    // Try to ensure we're logged in as Muneeb first - very important
    try {
      const loginSuccess = await ensureMuneebLoggedIn();
      if (loginSuccess) {
        console.log('Successfully ensured Muneeb is logged in');
      } else {
        console.warn('Could not ensure Muneeb login, continuing anyway');
      }
    } catch (loginError) {
      console.error('Error during Muneeb login attempt:', loginError);
    }
    
    // Debug: Log authentication state
    const token = localStorage.getItem('token');
    console.log('Current auth token:', token ? 'Present (length: ' + token.length + ')' : 'Missing');
    
    // Use the direct promotion route first
    console.log('Using direct promotion route for Muneeb');
    
    try {
      const directResponse = await axios.post(`${API_URL}/users/promote-muneeb`);
      console.log('Direct promotion response:', directResponse.data);
      
      // If we get a response with the user data, store the ID
      if (directResponse.data.user && directResponse.data.user._id) {
        localStorage.setItem('muneebUserId', directResponse.data.user._id);
        console.log(`Stored Muneeb's real ID: ${directResponse.data.user._id}`);
      }
      
      return directResponse.data;
    } catch (directError) {
      console.error('Direct promotion failed:', directError);
      
      if (directError.code === 'ERR_NETWORK') {
        throw new Error('Network error. Please ensure the backend server is running and try again.');
      }
      
      // Try the standard route as a fallback
      console.log('Falling back to standard promotion method...');
      
      try {
        // Use real ID if we have it stored
        const storedId = localStorage.getItem('muneebUserId');
        const idToUse = storedId || MUNEEB_ID;
        
        console.log(`Using ID for promotion: ${idToUse}`);
        return await promoteUserToAdmin(idToUse);
      } catch (standardError) {
        console.error('Standard promotion method also failed:', standardError);
        throw standardError;
      }
    }
  } catch (error) {
    console.error('Failed to promote Muneeb to admin:', error);
    throw error;
  }
}; 