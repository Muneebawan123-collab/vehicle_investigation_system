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
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
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
  getAllDocuments: (params) => apiClient.get('/documents', { params }),
  getDocumentById: (id) => apiClient.get(`/documents/${id}`),
  uploadDocument: (formData) => apiClient.post('/documents', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
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