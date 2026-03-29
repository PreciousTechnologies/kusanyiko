import axios from "axios";

// Function to get the current frontend host IP
function getCurrentHostIP(): string {
  return window.location.hostname;
}

// Function to determine the API base URL dynamically
function getApiBaseURL(): string {
  // Check for environment variable first (production)
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  const savedURL = localStorage.getItem("REACT_APP_API_URL");
  if (savedURL) {
    return savedURL;
  }

  const hostname = getCurrentHostIP();

  // Explicit check for Render production deployment
  if (hostname === 'kusanyiko-frontend.onrender.com') {
    return 'https://kusanyiko-backend-g3je.onrender.com';
  }

  const isHttps = window.location.protocol === 'https:';
  const port = window.location.port;
  const isDevServer = port === '3000' || port === '5173';

  // For dev server, use proxy setup (relative URLs)
  if (isDevServer) {
    return '';  // Use relative URLs for proxy
  }

  // For other production deployments
  if (!isDevServer && (hostname.includes('netlify.app') || hostname.includes('vercel.app'))) {
    // For other production deployments, try to determine backend URL
    const backendHost = hostname.replace(/^[^.]+\./, 'api.');  // Replace subdomain with 'api'
    return `https://${backendHost}`;
  }

  // For production or direct access, determine backend URL
  const preferredProtocol = 'http';  // Backend always uses HTTP for now

  // If accessing via localhost or 127.0.0.1, use localhost for API
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${preferredProtocol}://localhost:8000`;
  }

  // If accessing via network IP, use the same IP for API
  return `${preferredProtocol}://${hostname}:8000`;
}// Initialize API with dynamic base URL
const apiBaseURL = getApiBaseURL();
console.log(`🌐 Frontend running on: ${window.location.origin}`);
console.log(`🔗 API endpoint set to: ${apiBaseURL || 'proxy'}`);

const api = axios.create({
  baseURL: apiBaseURL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Function to update API base URL
export function updateApiBaseURL(newBaseURL: string): void {
  api.defaults.baseURL = newBaseURL;
  localStorage.setItem('REACT_APP_API_URL', newBaseURL);
  console.log(`✅ API endpoint updated to: ${newBaseURL}`);
}

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle authentication errors (401 Unauthorized)
    if (error.response?.status === 401) {
      // Clear all authentication data
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      
      // Redirect to login page
      window.location.href = '#/login';
      return Promise.reject(error);
    }
    
    // Handle forbidden access (403 Forbidden)
    if (error.response?.status === 403) {
      // Clear authentication data and redirect to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      
      window.location.href = '#/login';
      return Promise.reject(error);
    }
    
    // Handle not found errors (404) - check if it's an auth-related 404
    if (error.response?.status === 404) {
      const isAuthEndpoint = error.config?.url?.includes('/auth/') || 
                             error.config?.url?.includes('/profile/');
      
      if (isAuthEndpoint) {
        // Session might be invalid, clear and redirect
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        
        window.location.href = '#/login';
        return Promise.reject(error);
      }
    }
    
    // Handle network errors or server unavailable
    if (!error.response) {
      console.warn('Network error - server might be unavailable');
    }
    
    return Promise.reject(error);
  }
);

// Tanzania regions data
export const TANZANIA_REGIONS = [
  { value: 'arusha', label: 'Arusha' },
  { value: 'dar_es_salaam', label: 'Dar es Salaam' },
  { value: 'dodoma', label: 'Dodoma' },
];

// Dar es Salaam areas data
export const DAR_ES_SALAAM_AREAS = [
  { value: 'ilala', label: 'Ilala' },
  { value: 'kinondoni', label: 'Kinondoni' },
  { value: 'temeke', label: 'Temeke' },
];

// Members API
export const membersAPI = {
  getMembers: (params?: any) => api.get('/api/members/', { params }),
  getMember: (id: number) => api.get(`/api/members/${id}/`),
  createMember: (memberData: any) => {
    if (memberData instanceof FormData) {
      // For FormData, we need to let the browser set the Content-Type header
      // with the correct boundary for multipart/form-data
      return api.post('/api/members/', memberData, {
        headers: {
          'Content-Type': undefined // This allows axios to set the correct Content-Type
        }
      });
    }
    return api.post('/api/members/', memberData);
  },
  updateMember: (id: number, memberData: any) => {
    if (memberData instanceof FormData) {
      return api.put(`/api/members/${id}/`, memberData, {
        headers: {
          'Content-Type': undefined,
        },
      });
    }
    return api.put(`/api/members/${id}/`, memberData);
  },
  deleteMember: (id: number) => api.delete(`/api/members/${id}/`),
  // Public search endpoint (no authentication required)
  searchMembers: (searchTerm: string) => {
    const baseURL = (api.defaults.baseURL || window.location.origin).replace(/\/$/, '');
    return axios.get(`${baseURL}/api/members/search/`, {
      params: { search: searchTerm },
      timeout: 10000
    });
  },
  // Exports use POST with payload to match backend (supports csv|excel|pdf)
  exportMembers: (format: 'csv' | 'excel' | 'pdf' = 'csv', filters: any = {}) =>
    api.post('/api/export/members/', { format, filters }, { responseType: 'blob' }),
};

// User Management API
export const userManagementAPI = {
  getUsers: (params?: any) => api.get('/api/users/', { params }),
  getUser: (id: number) => api.get(`/api/users/${id}/`),
  createUser: (userData: any) => api.post('/api/users/', userData),
  updateUser: (id: number, userData: any) => api.put(`/api/users/${id}/`, userData),
  deleteUser: (id: number) => api.delete(`/api/users/${id}/`),
  // Profile endpoints live under /api/auth/profile/ in backend
  getCurrentUser: () => api.get('/api/auth/profile/'),
  updateProfile: (profileData: any) => api.patch('/api/auth/profile/', profileData),
  updateUserStatus: (id: number, status: string) => api.patch(`/api/users/${id}/status/`, { status }),
  // Custom actions use underscores in DRF paths
  resetUserPassword: (id: number) => api.post(`/api/users/${id}/reset_password/`),
  unlockAccount: (id: number) => api.post(`/api/users/${id}/unlock_account/`),
  getUserActivity: (id: number) => api.get(`/api/users/${id}/activity/`),
};

// Export API
export const exportAPI = {
  // All export endpoints are mounted under /api/export/ and expect POST with payload
  exportMembers: (format: 'csv' | 'excel' | 'pdf' = 'csv', filters: any = {}) =>
    api.post('/api/export/members/', { format, filters }, { responseType: 'blob' }),
  exportAnalytics: (format: 'csv' | 'excel' | 'pdf' = 'pdf', options: any = {}) =>
    api.post('/api/export/analytics/', { format, ...options }, { responseType: 'blob' }),
  exportUserActivity: (format: 'csv' | 'excel' = 'csv', options: any = {}) =>
    api.post('/api/export/user-activity/', { format, ...options }, { responseType: 'blob' }),
  exportFinancial: (format: 'excel' | 'pdf' = 'excel', options: any = {}) =>
    api.post('/api/export/financial/', { format, ...options }, { responseType: 'blob' }),
};

// Auth API
export const authAPI = {
  login: (credentials: any) => api.post('/api/auth/login/', credentials),
  // Backend uses 'signup/' not 'register/'
  register: (userData: any) => api.post('/api/auth/signup/', userData),
  signup: (userData: any) => api.post('/api/auth/signup/', userData),
  // No logout endpoint on backend; client clears tokens locally elsewhere
  // logout: () => api.post('/api/auth/logout/'),
  refreshToken: (refresh: string) => api.post('/api/auth/token/refresh/', { refresh }),
  resetPassword: (data: any) => api.post('/api/auth/reset-password/', data),
  forgotPassword: (data: { email: string }) => api.post('/api/auth/forgot-password/', data),
  getProfile: () => api.get('/api/auth/profile/'),
};

// Stats API
export const statsAPI = {
  getAdminStats: () => api.get('/api/stats/admin/'),
  getRegistrantStats: () => api.get('/api/stats/registrant/'),
};

// Branding API
export const brandingAPI = {
  getBranding: () => api.get('/api/stats/branding/'),
  updateBranding: (brandingData: any) => api.patch('/api/stats/branding/', brandingData),
};

// Function to test connection to an endpoint
export async function testConnection(endpoint: string): Promise<boolean> {
  // Skip connection test in development mode to avoid 400 errors
  const port = window.location.port;
  const isDevServer = port === '3000' || port === '5173';
  
  if (isDevServer) {
    return true; // Assume connection is working in dev mode
  }

  try {
    const url = endpoint ? `${endpoint}/api/health/` : '/api/health/';
    const response = await axios.get(url, {
      timeout: 5000,
    });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

// Auto-detect and update API endpoint
export async function autoDetectEndpoint(): Promise<boolean> {
  const port = window.location.port;
  const isDevServer = port === '3000' || port === '5173';

  if (isDevServer) {
    console.log('� Using dev server proxy; skipping endpoint auto-detection.');
    return true;
  }

  const isHttps = window.location.protocol === 'https:';
  const protocolPreferences = isHttps ? ['https', 'http'] : ['http'];
  const candidates = new Set<string>();

  const savedURL = localStorage.getItem('REACT_APP_API_URL');
  if (savedURL) {
    candidates.add(savedURL);
  }

  const hostnames = new Set<string>(['localhost', '127.0.0.1']);
  const currentHost = window.location.hostname;
  if (currentHost) {
    hostnames.add(currentHost);
  }

  hostnames.forEach((host) => {
    protocolPreferences.forEach((protocol) => {
      const endpoint = `${protocol}://${host}:8000`;
      candidates.add(endpoint);
    });
  });

  for (const endpoint of Array.from(candidates)) {
    const isConnected = await testConnection(endpoint);
    if (isConnected) {
      updateApiBaseURL(endpoint);
      return true;
    }
  }

  console.log('⚠️ No working endpoint found');
  return false;
}

// Initialize auto-detection on startup (only for non-dev environments)
// DISABLED: Auto-detection causes issues in production with explicit API URL configuration
// if (process.env.NODE_ENV === 'production') {
//   autoDetectEndpoint().catch(console.error);
// }

export default api;
