import axios from 'axios';

// API base URL - use relative URL
const API_URL = import.meta.env.VITE_API_URL || '/api';

// Simple in-memory cache
const cache = new Map();
const CACHE_DURATION = 60000; // 1 minute cache

// Request queue to control concurrency
const requestQueue = [];
const MAX_CONCURRENT_REQUESTS = 2;
let activeRequests = 0;

// Minimum delay between requests (in milliseconds)
const REQUEST_DELAY = 300;
let lastRequestTime = 0;

// Process the next request in the queue
const processNextRequest = () => {
  if (requestQueue.length === 0 || activeRequests >= MAX_CONCURRENT_REQUESTS) {
    return;
  }

  const now = Date.now();
  const timeToWait = Math.max(0, REQUEST_DELAY - (now - lastRequestTime));

  setTimeout(() => {
    if (requestQueue.length === 0 || activeRequests >= MAX_CONCURRENT_REQUESTS) {
      return;
    }

    const nextRequest = requestQueue.shift();
    activeRequests++;
    lastRequestTime = Date.now();

    nextRequest.execute()
      .then(response => {
        nextRequest.resolve(response);
        activeRequests--;
        processNextRequest();
      })
      .catch(error => {
        // Implement retry logic for 429 errors
        if (error.response && error.response.status === 429) {
          const retryAfter = error.response.headers['retry-after'] 
            ? parseInt(error.response.headers['retry-after'], 10) * 1000 
            : 1000;
          
          console.log(`Rate limited, retrying after ${retryAfter}ms`);
          
          setTimeout(() => {
            // Re-queue the request with higher priority
            requestQueue.unshift({
              execute: nextRequest.execute,
              resolve: nextRequest.resolve,
              reject: nextRequest.reject
            });
            activeRequests--;
            processNextRequest();
          }, retryAfter);
        } else {
          nextRequest.reject(error);
          activeRequests--;
          processNextRequest();
        }
      });
  }, timeToWait);
};

// Queue a request
const queueRequest = (requestFn) => {
  return new Promise((resolve, reject) => {
    requestQueue.push({
      execute: requestFn,
      resolve,
      reject
    });
    
    processNextRequest();
  });
};

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

// Create a throttled version of the API client
const throttledApiClient = {
  request(config) {
    const cacheKey = `${config.method}:${config.url}:${JSON.stringify(config.params || {})}`;
    
    // Check cache for GET requests
    if (config.method === 'get' && cache.has(cacheKey)) {
      const cachedData = cache.get(cacheKey);
      if (Date.now() - cachedData.timestamp < CACHE_DURATION) {
        console.log(`Using cached data for ${cacheKey}`);
        return Promise.resolve(cachedData.response);
      } else {
        cache.delete(cacheKey);
      }
    }
    
    return queueRequest(() => apiClient.request(config))
      .then(response => {
        // Cache GET responses
        if (config.method === 'get') {
          cache.set(cacheKey, {
            response,
            timestamp: Date.now()
          });
        }
        return response;
      });
  },
  
  get(url, config = {}) {
    return this.request({ ...config, method: 'get', url });
  },
  
  post(url, data, config = {}) {
    return this.request({ ...config, method: 'post', url, data });
  },
  
  put(url, data, config = {}) {
    return this.request({ ...config, method: 'put', url, data });
  },
  
  delete(url, config = {}) {
    return this.request({ ...config, method: 'delete', url });
  }
};

/*
 * Auth Services
 */
export const authService = {
  login: (credentials) => throttledApiClient.post('/users/login', credentials),
  register: (userData) => throttledApiClient.post('/users/register', userData),
  getProfile: () => throttledApiClient.get('/users/profile'),
  updateProfile: (userData) => throttledApiClient.put('/users/profile', userData),
  forgotPassword: (email) => throttledApiClient.post('/users/forgot-password', { email }),
  resetPassword: (token, password) => throttledApiClient.post(`/users/reset-password/${token}`, { password }),
  updateConsent: (consentAccepted) => throttledApiClient.put('/users/consent', { consentAccepted }),
};

/*
 * Vehicle Services
 */
export const vehicleService = {
  getAllVehicles: (params) => throttledApiClient.get('/vehicles', { params }),
  getVehicleById: (id) => throttledApiClient.get(`/vehicles/${id}`),
  registerVehicle: (vehicleData) => throttledApiClient.post('/vehicles', vehicleData),
  updateVehicle: (id, vehicleData) => throttledApiClient.put(`/vehicles/${id}`, vehicleData),
  deleteVehicle: (id) => throttledApiClient.delete(`/vehicles/${id}`),
  uploadVehicleImages: (id, formData) => apiClient.post(`/vehicles/${id}/images`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  setMainVehicleImage: (id, imageUrl) => throttledApiClient.put(`/vehicles/${id}/main-image`, { imageUrl }),
  removeVehicleImage: (id, imageId) => throttledApiClient.delete(`/vehicles/${id}/images/${imageId}`),
  searchVehicles: (query) => throttledApiClient.get('/vehicles/search', { params: { query } }),
  updateVehicleLocation: (id, location) => throttledApiClient.put(`/vehicles/${id}/location`, { location }),
  addVehicleNote: (id, note) => throttledApiClient.post(`/vehicles/${id}/notes`, { note }),
  getVehicleNotes: (id) => throttledApiClient.get(`/vehicles/${id}/notes`),
  addVehicleFlag: (id, flagData) => throttledApiClient.post(`/vehicles/${id}/flags`, flagData),
  resolveVehicleFlag: (id, flagId) => throttledApiClient.put(`/vehicles/${id}/flags/${flagId}/resolve`),
  getVehicleFlags: (id) => throttledApiClient.get(`/vehicles/${id}/flags`),
  checkDuplicateVIN: (vin) => throttledApiClient.post('/vehicles/check-vin', { vin }),
  checkVehicleCompliance: (id) => throttledApiClient.get(`/vehicles/${id}/compliance-check`),
  getVehiclesByOwner: (ownerName) => throttledApiClient.get(`/vehicles/owner/${ownerName}`),
  getVehiclesByStatus: (status) => throttledApiClient.get(`/vehicles/status/${status}`),
  updateComplianceDetails: (id, complianceDetails) => throttledApiClient.put(`/vehicles/${id}/compliance`, complianceDetails),
};

/*
 * Incident Services
 */
export const incidentService = {
  getAllIncidents: () => throttledApiClient.get('/incidents'),
  getIncidentById: (id) => throttledApiClient.get(`/incidents/${id}`),
  createIncident: (incidentData) => throttledApiClient.post('/incidents', incidentData),
  updateIncident: (id, incidentData) => throttledApiClient.put(`/incidents/${id}`, incidentData),
  deleteIncident: (id) => throttledApiClient.delete(`/incidents/${id}`),
  addEvidence: (id, formData) => apiClient.post(`/incidents/${id}/evidence`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  removeEvidence: (id, evidenceId) => throttledApiClient.delete(`/incidents/${id}/evidence/${evidenceId}`),
  addTimelineEvent: (id, eventData) => throttledApiClient.post(`/incidents/${id}/timeline`, eventData),
  assignIncident: (id, assignmentData) => throttledApiClient.post(`/incidents/${id}/assign`, assignmentData),
  addIncidentNote: (id, noteData) => throttledApiClient.post(`/incidents/${id}/notes`, noteData),
  getIncidentsByDateRange: (startDate, endDate) => throttledApiClient.get('/incidents/date-range', { 
    params: { startDate, endDate } 
  }),
  getIncidentsByType: (type) => throttledApiClient.get(`/incidents/type/${type}`),
  getIncidentsByStatus: (status) => throttledApiClient.get(`/incidents/status/${status}`),
  getIncidentsByVehicle: (vehicleId) => throttledApiClient.get(`/incidents/vehicle/${vehicleId}`),
  getIncidentsByUser: (userId) => throttledApiClient.get(`/incidents/user/${userId}`),
  searchIncidents: (query) => throttledApiClient.get('/incidents/search', { params: { query } }),
  getIncidentStatistics: () => throttledApiClient.get('/incidents/statistics'),
  createCaseFromIncident: (id) => throttledApiClient.post(`/incidents/${id}/create-case`),
  updateCaseDetails: (id, caseData) => throttledApiClient.put(`/incidents/${id}/case`, caseData),
  updateCaseStatus: (id, status) => throttledApiClient.put(`/incidents/${id}/case/status`, { status }),
  exportIncidentReport: (id) => throttledApiClient.get(`/incidents/${id}/export`, { responseType: 'blob' }),
  submitInvestigationReport: (id, reportData) => throttledApiClient.post(`/incidents/${id}/report`, reportData),
  reviewInvestigationReport: (id, reviewData) => throttledApiClient.post(`/incidents/${id}/review`, reviewData)
};

/*
 * Document Services
 */
export const documentService = {
  getAllDocuments: () => throttledApiClient.get('/documents'),
  
  getDocumentById: (id) => throttledApiClient.get(`/documents/${id}`),
  
  uploadDocument: (formData) => throttledApiClient.post('/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  
  deleteDocument: (id) => {
    // Remove the 'vehicle_documents/' prefix if it exists
    const documentId = id.replace('vehicle_documents/', '');
    return throttledApiClient.delete(`/documents/${documentId}`);
  },
  
  searchDocuments: (query) => throttledApiClient.get(`/documents/search?q=${encodeURIComponent(query)}`),
  
  downloadDocument: (id) => {
    // Remove the 'vehicle_documents/' prefix if it exists
    const documentId = id.replace('vehicle_documents/', '');
    return throttledApiClient.get(`/documents/${documentId}/download`, {
      responseType: 'blob'
    });
  }
};

/*
 * Admin Services
 */
export const adminService = {
  getAllUsers: () => throttledApiClient.get('/users'),
  getUserById: (id) => throttledApiClient.get(`/users/${id}`),
  getUsersByRole: (role) => throttledApiClient.get(`/users/role/${role}`),
  updateUser: (id, userData) => throttledApiClient.put(`/users/${id}`, userData),
  deleteUser: (id) => throttledApiClient.delete(`/users/${id}`),
  updateUserRole: (id, role) => {
    console.log(`Making API request to update role for user ${id} to ${role}`);
    return throttledApiClient.put(`/users/${id}/role`, { role }, {
      headers: {
        'X-Debug-Info': 'Role update request from frontend'
      }
    })
    .then(response => {
      console.log('Role update successful:', response.data);
      return response;
    })
    .catch(error => {
      console.error('Role update error details:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        userId: id,
        newRole: role
      });
      throw error;
    });
  },
  getSystemLogs: (params) => throttledApiClient.get('/admin/logs', { params }),
  getSystemStatistics: () => throttledApiClient.get('/admin/statistics'),
  getSystemSettings: () => throttledApiClient.get('/admin/settings'),
  updateSystemSettings: (settings) => throttledApiClient.put('/admin/settings', settings),
};

/*
 * Notification Services
 */
export const notificationService = {
  getNotifications: () => throttledApiClient.get('/notifications'),
  getUnreadCount: () => throttledApiClient.get('/notifications/unread'),
  markAsRead: (id) => throttledApiClient.put(`/notifications/${id}/read`),
  markAllAsRead: () => throttledApiClient.put('/notifications/read-all'),
  deleteNotification: (id) => throttledApiClient.delete(`/notifications/${id}`),
  clearAllNotifications: () => throttledApiClient.delete('/notifications/clear-all'),
}; 