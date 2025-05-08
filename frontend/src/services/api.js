import axios from 'axios';
import { message } from 'antd';

// API base URL - use relative URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Ensure API_URL doesn't have trailing slash
const getApiUrl = (endpoint) => {
  const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};

// Simple in-memory cache
const cache = new Map();
const CACHE_DURATION = 300000; // Increased from 60000 (1 minute) to 300000 (5 minutes)

// Function to clean expired cache entries
const cleanCache = () => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      cache.delete(key);
    }
  }
};

// Clean cache every 5 minutes
setInterval(cleanCache, 300000);

// Request queue to control concurrency
const requestQueue = [];
const MAX_CONCURRENT_REQUESTS = 6;
let activeRequests = 0;

// Minimum delay between requests (in milliseconds)
const REQUEST_DELAY = 100;
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
            : 5000;
          
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
  // Add timeout and credentials
  timeout: 30000,
  withCredentials: true,
  // Add additional headers for download requests
  responseType: 'json',
  maxContentLength: 100 * 1024 * 1024, // 100MB max
  maxBodyLength: 100 * 1024 * 1024 // 100MB max
});

// Add request interceptor for JWT token and logging
apiClient.interceptors.request.use(
  (config) => {
    // For download requests, set responseType to blob
    if (config.url.includes('/download') || 
        config.url.includes('/binary') || 
        config.url.includes('/by-public-id')) {
      config.responseType = 'blob';
    }

    // Log request details
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      headers: {
        ...config.headers,
        Authorization: config.headers.Authorization ? 'Bearer [PRESENT]' : 'None'
      }
    });

    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling and logging
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API Response Success] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      status: response.status,
      statusText: response.statusText,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('[API Response Error]', {
      config: {
        method: error.config?.method,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullURL: error.config?.baseURL + error.config?.url,
        headers: error.config?.headers
      },
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });

    // Handle specific error cases
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
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
          const cacheableStatuses = [200, 304];
          if (cacheableStatuses.includes(response.status)) {
            console.log(`Caching response for ${cacheKey}`);
            cache.set(cacheKey, {
              response,
              timestamp: Date.now()
            });
          }
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
  getAllDocuments: (params) => throttledApiClient.get('/documents', { params }),
  
  getDocumentById: (id) => throttledApiClient.get(`/documents/${id}`),
  
  uploadDocument: (formData) => apiClient.post('/documents', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  
  deleteDocument: (id) => throttledApiClient.delete(`/documents/${id}`),
  
  async downloadDocument(documentId, options = {}) {
    try {
      console.log('Starting document download:', { documentId, options });
      
      if (options.showNotifications) {
        message.loading({ content: 'Preparing download...', key: 'download', duration: 0 });
      }

      // If we have a URL in options, try direct download first
      if (options.url) {
        try {
          console.log('Attempting direct URL download:', options.url);
          const response = await axios.get(options.url, {
            responseType: 'blob',
            timeout: 30000
          });

          if (response.status === 200) {
            const blob = new Blob([response.data], {
              type: response.headers['content-type'] || 'application/octet-stream'
            });
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = options.filename || documentId;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            if (options.showNotifications) {
              message.success({ content: 'Download completed', key: 'download' });
            }
            return true;
          }
        } catch (directError) {
          console.log('Direct URL download failed:', directError);
        }
      }

      // If direct download fails or no URL provided, try the backend download endpoint
      console.log('Attempting backend download endpoint');
      const response = await apiClient.get(`/documents/download/${encodeURIComponent(documentId)}`, {
        responseType: 'blob',
        headers: {
          'Accept': 'application/pdf,application/octet-stream,image/*'
        },
        timeout: 60000
      });

      if (response.status === 200) {
        const blob = new Blob([response.data], {
          type: response.headers['content-type'] || 'application/octet-stream'
        });
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = options.filename || documentId;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        if (options.showNotifications) {
          message.success({ content: 'Download completed', key: 'download' });
        }
        return true;
      }

      throw new Error('Failed to download document');
    } catch (error) {
      console.error('Document download failed:', error);
      
      if (options.showNotifications) {
        message.error({ 
          content: `Download failed: ${error.message}`, 
          key: 'download' 
        });
      }
      
      throw error;
    }
  },
  
  updateDocument: (id, data) => throttledApiClient.put(`/documents/${id}`, data),
  
  searchDocuments: (query) => throttledApiClient.get('/documents/search', { params: { query } }),
  
  logDocumentAccess: (id, accessType) => {
    console.log(`Logging document access: ${id}, type: ${accessType}`);
    return throttledApiClient.post(`/documents/${id}/access-log`, { 
      accessType,
      timestamp: new Date()
    });
  },
};

// Get a temporary download token
const getDownloadToken = async () => {
  try {
    const response = await throttledApiClient.get('/auth/download-token');
    return response.data.token;
  } catch (error) {
    console.error('Failed to get download token:', error);
    return '';
  }
};

// Helper function to get auth token
const getToken = () => {
  return localStorage.getItem('token') || '';
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
    return throttledApiClient.put(`/users/${id}/role`, { role })
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

// Add a function to download a file directly as binary data
export const downloadBinaryFile = async (documentId) => {
  try {
    if (!documentId) {
      throw new Error('Document ID is required');
    }
    
    // Create the URL for the binary download endpoint
    const downloadUrl = `${API_URL}/api/documents/binary/${documentId}`;
    console.log('Requesting binary download from:', downloadUrl);
    
    // Make a fetch request to get the binary data with proper headers
    const response = await fetch(downloadUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `HTTP error: ${response.status}`);
    }
    
    // Return the response for processing by the caller
    return response;
  } catch (error) {
    console.error('Error downloading binary file:', error);
    throw error;
  }
};

// Export the throttled API client for use in components
export { throttledApiClient };

// Update chat service to use getApiUrl
export const chatService = {
  getAllChats: () => throttledApiClient.get(getApiUrl('chats')),
  getChatById: (id) => throttledApiClient.get(getApiUrl(`chats/${id}`)),
  createChat: (data) => throttledApiClient.post(getApiUrl('chats'), data),
  updateChat: (id, data) => throttledApiClient.put(getApiUrl(`chats/${id}`), data),
  deleteChat: (id) => throttledApiClient.delete(getApiUrl(`chats/${id}`)),
  // Add any other chat-related endpoints
}; 