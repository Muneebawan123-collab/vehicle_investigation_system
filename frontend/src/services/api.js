import axios from 'axios';

// API base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with defaults
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      console.log(`Adding authorization header for ${config.url}`);
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn(`No token available for request to ${config.url}`);
    }
    
    // For debugging authorization issues
    if (config.url?.includes('/users/') && config.url?.includes('/role')) {
      console.log('Role update request details:', {
        url: config.url,
        method: config.method,
        headers: {
          ...config.headers,
          Authorization: config.headers.Authorization ? 'Bearer [PRESENT]' : 'None'
        },
        data: config.data
      });
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Add more detailed logging for auth failures
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.error('Authorization error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        message: error.response.data?.message || 'No message',
        detail: error.response.data?.detail || 'No detail',
        url: error.config.url,
        method: error.config.method
      });
      
      // Log auth header presence
      console.log('Authorization header was ' + 
        (error.config.headers.Authorization ? 'present' : 'missing'));
    }
    
    // Handle session expiration
    if (error.response?.status === 401) {
      // Optionally, you could redirect to login page here
      // or this could be handled by the auth context
    }
    return Promise.reject(error);
  }
);

/*
 * Auth Services
 */
export const authService = {
  login: (credentials) => apiClient.post('/users/login', credentials),
  register: (userData) => apiClient.post('/users/register', userData),
  getProfile: () => apiClient.get('/users/profile'),
  updateProfile: (userData) => apiClient.put('/users/profile', userData),
  forgotPassword: (email) => apiClient.post('/users/forgot-password', { email }),
  resetPassword: (token, password) => apiClient.post(`/users/reset-password/${token}`, { password }),
  updateConsent: (consentAccepted) => apiClient.put('/users/consent', { consentAccepted }),
};

/*
 * Vehicle Services
 */
export const vehicleService = {
  getAllVehicles: (params) => apiClient.get('/vehicles', { params }),
  getVehicleById: (id) => apiClient.get(`/vehicles/${id}`),
  registerVehicle: (vehicleData) => apiClient.post('/vehicles', vehicleData),
  updateVehicle: (id, vehicleData) => apiClient.put(`/vehicles/${id}`, vehicleData),
  deleteVehicle: (id) => apiClient.delete(`/vehicles/${id}`),
  uploadVehicleImages: (id, formData) => apiClient.post(`/vehicles/${id}/images`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  setMainVehicleImage: (id, imageUrl) => apiClient.put(`/vehicles/${id}/main-image`, { imageUrl }),
  removeVehicleImage: (id, imageId) => apiClient.delete(`/vehicles/${id}/images/${imageId}`),
  searchVehicles: (query) => apiClient.get('/vehicles/search', { params: { query } }),
  updateVehicleLocation: (id, location) => apiClient.put(`/vehicles/${id}/location`, { location }),
  addVehicleNote: (id, note) => apiClient.post(`/vehicles/${id}/notes`, { note }),
  getVehicleNotes: (id) => apiClient.get(`/vehicles/${id}/notes`),
  addVehicleFlag: (id, flagData) => apiClient.post(`/vehicles/${id}/flags`, flagData),
  resolveVehicleFlag: (id, flagId) => apiClient.put(`/vehicles/${id}/flags/${flagId}/resolve`),
  getVehicleFlags: (id) => apiClient.get(`/vehicles/${id}/flags`),
  checkDuplicateVIN: (vin) => apiClient.post('/vehicles/check-vin', { vin }),
  checkVehicleCompliance: (id) => apiClient.get(`/vehicles/${id}/compliance-check`),
  getVehiclesByOwner: (ownerName) => apiClient.get(`/vehicles/owner/${ownerName}`),
  getVehiclesByStatus: (status) => apiClient.get(`/vehicles/status/${status}`),
  updateComplianceDetails: (id, complianceDetails) => apiClient.put(`/vehicles/${id}/compliance`, complianceDetails),
};

/*
 * Incident Services
 */
export const incidentService = {
  getAllIncidents: (params) => apiClient.get('/incidents', { params }),
  getIncidentById: (id) => apiClient.get(`/incidents/${id}`),
  createIncident: (incidentData) => apiClient.post('/incidents', incidentData),
  updateIncident: (id, incidentData) => apiClient.put(`/incidents/${id}`, incidentData),
  deleteIncident: (id) => apiClient.delete(`/incidents/${id}`),
  addEvidence: (id, formData) => apiClient.post(`/incidents/${id}/evidence`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  removeEvidence: (id, evidenceId) => apiClient.delete(`/incidents/${id}/evidence/${evidenceId}`),
  addTimelineEvent: (id, eventData) => apiClient.post(`/incidents/${id}/timeline`, eventData),
  assignIncident: (id, assignedTo) => apiClient.put(`/incidents/${id}/assign`, { assignedTo }),
  addIncidentNote: (id, noteData) => apiClient.post(`/incidents/${id}/notes`, noteData),
  getIncidentsByDateRange: (startDate, endDate) => apiClient.get('/incidents/date-range', { 
    params: { startDate, endDate } 
  }),
  getIncidentsByType: (type) => apiClient.get(`/incidents/type/${type}`),
  getIncidentsByStatus: (status) => apiClient.get(`/incidents/status/${status}`),
  getIncidentsByVehicle: (vehicleId) => apiClient.get(`/incidents/vehicle/${vehicleId}`),
  searchIncidents: (query) => apiClient.get('/incidents/search', { params: { query } }),
  getIncidentStatistics: () => apiClient.get('/incidents/statistics'),
  createCaseFromIncident: (id) => apiClient.post(`/incidents/${id}/create-case`),
  updateCaseDetails: (id, caseData) => apiClient.put(`/incidents/${id}/case`, caseData),
  updateCaseStatus: (id, status) => apiClient.put(`/incidents/${id}/case/status`, { status }),
  exportIncidentReport: (id) => apiClient.get(`/incidents/${id}/export`, { responseType: 'blob' }),
};

/*
 * Document Services
 */
export const documentService = {
  getAllDocuments: (params) => {
    console.log('Fetching all documents with params:', params);
    return apiClient.get('/documents', { params })
      .then(response => {
        console.log('Documents API response:', response);
        return response;
      })
      .catch(error => {
        console.error('Error fetching documents:', error);
        throw error;
      });
  },
  getDocumentById: (id) => apiClient.get(`/documents/${id}`),
  uploadDocument: (formData) => {
    // Verify formData is valid
    if (!(formData instanceof FormData)) {
      console.error('uploadDocument: formData is not a FormData instance');
      return Promise.reject(new Error('Invalid FormData object'));
    }
    
    // Check if the file is present in FormData
    let hasFile = false;
    try {
      // Check formData entries
      for (let pair of formData.entries()) {
        if (pair[0] === 'file' && pair[1]) {
          hasFile = true;
          break;
        }
      }
    } catch (error) {
      console.error('Error checking FormData entries:', error);
    }
    
    if (!hasFile) {
      console.error('uploadDocument: No file found in FormData');
      return Promise.reject(new Error('No file found in form data'));
    }
    
    // Ensure we're not setting JSON content type for file uploads
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      // Add timeout value
      timeout: 30000,
    };
    console.log('Calling upload document API with multipart form data');
    return apiClient.post('/documents', formData, config);
  },
  // Test basic upload functionality without authentication
  testUpload: (formData) => {
    // Verify formData is valid
    if (!(formData instanceof FormData)) {
      console.error('testUpload: formData is not a FormData instance');
      return Promise.reject(new Error('Invalid FormData object'));
    }
    
    // Ensure we're not setting JSON content type for file uploads
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      // Add timeout value
      timeout: 30000,
    };
    console.log('Calling test upload API with multipart form data');
    return apiClient.post('/documents/test-upload', formData, config);
  },
  updateDocument: (id, documentData) => apiClient.put(`/documents/${id}`, documentData),
  deleteDocument: (id) => apiClient.delete(`/documents/${id}`),
  getDocumentsByVehicle: (vehicleId) => apiClient.get(`/documents/vehicle/${vehicleId}`),
  getDocumentsByType: (type) => apiClient.get(`/documents/type/${type}`),
  searchDocuments: (query) => apiClient.get('/documents/search', { params: { query } }),
  verifyDocument: (id) => apiClient.put(`/documents/${id}/verify`),
  addDocumentNote: (id, noteData) => apiClient.post(`/documents/${id}/notes`, noteData),
  watermarkDocument: (id) => apiClient.post(`/documents/${id}/watermark`),
  signDocument: (id) => apiClient.post(`/documents/${id}/sign`),
  getExpiringDocuments: () => apiClient.get('/documents/expiring'),
  logDocumentAccess: (id, action) => apiClient.post(`/documents/${id}/access-log`, { action }),
  getDocumentVersions: (id) => apiClient.get(`/documents/${id}/versions`),
  replaceDocument: (id, formData) => apiClient.post(`/documents/${id}/replace`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
};

/*
 * Admin Services
 */
export const adminService = {
  getAllUsers: () => apiClient.get('/users'),
  getUserById: (id) => apiClient.get(`/users/${id}`),
  updateUser: (id, userData) => apiClient.put(`/users/${id}`, userData),
  deleteUser: (id) => apiClient.delete(`/users/${id}`),
  updateUserRole: (id, role) => apiClient.put(`/users/${id}/role`, { role }),
  getSystemLogs: (params) => apiClient.get('/admin/logs', { params }),
  getSystemStatistics: () => apiClient.get('/admin/statistics'),
  getSystemSettings: () => apiClient.get('/admin/settings'),
  updateSystemSettings: (settings) => apiClient.put('/admin/settings', settings),
}; 