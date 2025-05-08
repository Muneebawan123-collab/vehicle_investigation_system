import axios from 'axios';

// Create an axios instance with default configuration
const api = axios.create({
  baseURL: 'http://localhost:5000/api',  // Use full URL for API
  headers: {
    'Content-Type': 'application/json'
  },
  // Add timeout
  timeout: 30000, // 30 seconds
  // Add withCredentials for cookies
  withCredentials: true
});

// Add request logging
api.interceptors.request.use(
  (config) => {
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      headers: {
        ...config.headers,
        Authorization: config.headers.Authorization ? 'Bearer [PRESENT]' : 'None'
      },
      data: config.data,
      params: config.params
    });
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // If token exists, add it to request headers
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

// Add response logging
api.interceptors.response.use(
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
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      // Clear local storage and redirect to login page
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Document API functions
const documentsApi = {
  // Download document using the unified route
  downloadDocument: async (publicId) => {
    try {
      console.log('Attempting to download document:', publicId);
      
      // Remove any prefix if it exists
      const cleanId = publicId.replace('vehicle_documents/', '');
      
      // Try the direct download endpoint first
      try {
        const response = await api.get(`/documents/${encodeURIComponent(cleanId)}/download`, {
          responseType: 'blob',
          headers: {
            'Accept': 'application/pdf,application/octet-stream,image/*'
          },
          timeout: 60000 // 60 seconds timeout
        });

        // Get filename from Content-Disposition header or use publicId
        const contentDisposition = response.headers['content-disposition'];
        let filename = cleanId;
        if (contentDisposition) {
          const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
          if (matches != null && matches[1]) {
            filename = matches[1].replace(/['"]/g, '');
          }
        }

        // Create and trigger download
        const blob = new Blob([response.data], { 
          type: response.headers['content-type'] || 'application/octet-stream' 
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        return true;
      } catch (error) {
        console.error('Direct download failed:', error);
        
        // If direct download fails, try mongo-binary endpoint
        try {
          const response = await api.get(`/documents/${encodeURIComponent(cleanId)}/mongo-binary`, {
            responseType: 'blob',
            headers: {
              'Accept': 'application/pdf,application/octet-stream,image/*'
            },
            timeout: 60000
          });

          const blob = new Blob([response.data], { 
            type: response.headers['content-type'] || 'application/octet-stream' 
          });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = cleanId;
          document.body.appendChild(a);
          a.click();
          
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          return true;
        } catch (mongoError) {
          console.error('MongoDB download failed:', mongoError);
          throw new Error('Failed to download document');
        }
      }
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  },

  // Get document info
  getDocument: async (id) => {
    try {
      const response = await api.get(`/documents/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error getting document:', error);
      throw error;
    }
  },

  // List all documents
  listDocuments: async (params = {}) => {
    try {
      const response = await api.get('/documents', { params });
      return response.data;
    } catch (error) {
      console.error('Error listing documents:', error);
      throw error;
    }
  }
};

export { documentsApi };
export default api; 