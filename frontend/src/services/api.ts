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
}

function getHostDerivedApiBaseURL(): string {
  const hostname = getCurrentHostIP();

  if (hostname === 'kusanyiko-frontend.onrender.com') {
    return 'https://kusanyiko-backend-g3je.onrender.com';
  }

  const port = window.location.port;
  const isDevServer = port === '3000' || port === '5173';
  if (isDevServer) {
    return '';
  }

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8000';
  }

  if (hostname.includes('netlify.app') || hostname.includes('vercel.app')) {
    const backendHost = hostname.replace(/^[^.]+\./, 'api.');
    return `https://${backendHost}`;
  }

  return `http://${hostname}:8000`;
}

// Initialize API with dynamic base URL
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

let isRefreshingToken = false;
let pendingRequests: Array<(token: string | null) => void> = [];
let isRedirectingToLogin = false;

const notifyPendingRequests = (token: string | null) => {
  pendingRequests.forEach((callback) => callback(token));
  pendingRequests = [];
};

const queuePendingRequest = (callback: (token: string | null) => void) => {
  pendingRequests.push(callback);
};

const clearAuthStorage = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

const quietRedirectToLogin = () => {
  if (isRedirectingToLogin) {
    return;
  }

  isRedirectingToLogin = true;
  clearAuthStorage();

  if (window.location.hash !== '#/login') {
    // Soft hash navigation avoids hard page reload behavior.
    window.location.replace('#/login');
  }

  setTimeout(() => {
    isRedirectingToLogin = false;
  }, 500);
};

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
  async (error) => {
    const originalRequest = error.config as any;

    const isAuthRefreshRequest = originalRequest?.url?.includes('/api/auth/token/refresh/');
    const isLoginRequest = originalRequest?.url?.includes('/api/auth/login/');

    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !isAuthRefreshRequest &&
      !isLoginRequest
    ) {
      const refreshToken = localStorage.getItem('refresh_token');

      if (!refreshToken) {
        quietRedirectToLogin();
        return Promise.reject(error);
      }

      if (isRefreshingToken) {
        return new Promise((resolve, reject) => {
          queuePendingRequest((newToken) => {
            if (!newToken) {
              reject(error);
              return;
            }

            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshingToken = true;

      try {
        const refreshResponse = await axios.post(
          `${api.defaults.baseURL || ''}/api/auth/token/refresh/`,
          { refresh: refreshToken },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000,
          }
        );

        const newAccessToken = refreshResponse.data?.access;
        if (!newAccessToken) {
          throw new Error('No access token returned from refresh endpoint');
        }

        localStorage.setItem('access_token', newAccessToken);
        notifyPendingRequests(newAccessToken);

        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        notifyPendingRequests(null);
        quietRedirectToLogin();
        return Promise.reject(refreshError);
      } finally {
        isRefreshingToken = false;
      }
    }

    // Handle authentication errors (401 Unauthorized)
    if (error.response?.status === 401) {
      quietRedirectToLogin();
      return Promise.reject(error);
    }
    
    // Handle forbidden access (403 Forbidden)
    if (error.response?.status === 403) {
      quietRedirectToLogin();
      return Promise.reject(error);
    }
    
    // Handle not found errors (404) - check if it's an auth-related 404
    if (error.response?.status === 404) {
      const isAuthEndpoint = error.config?.url?.includes('/auth/') || 
                             error.config?.url?.includes('/profile/');
      
      if (isAuthEndpoint) {
        quietRedirectToLogin();
        return Promise.reject(error);
      }
    }
    
    // Handle network errors or server unavailable
    if (!error.response) {
      console.warn('Network error - server might be unavailable');

      // Quietly recover when localStorage keeps a stale API endpoint.
      const savedURL = localStorage.getItem('REACT_APP_API_URL');
      const originalRequest = error.config as any;

      if (
        originalRequest &&
        !originalRequest._baseURLRetried &&
        savedURL &&
        api.defaults.baseURL === savedURL
      ) {
        const fallbackBaseURL = getHostDerivedApiBaseURL();
        if (fallbackBaseURL !== savedURL) {
          originalRequest._baseURLRetried = true;
          api.defaults.baseURL = fallbackBaseURL;
          localStorage.setItem('REACT_APP_API_URL', fallbackBaseURL);
          console.log(`🔁 Retrying request with fallback API endpoint: ${fallbackBaseURL || 'proxy'}`);
          return api(originalRequest);
        }
      }
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
  { value: 'kisukulu', label: 'Kisukulu' },
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
