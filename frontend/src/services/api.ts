import axios from 'axios';

// Resolve API base URL dynamically:
// In production on decoupled hosts (e.g. Vercel), reads VITE_API_URL (e.g. https://haztrack-api.onrender.com)
// In local development or monolithic deployment, defaults to '/api' (matching Vite proxy or local host)
const getApiBaseUrl = (): string => {
  const envUrl = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '').trim();
  if (envUrl) {
    const clean = envUrl.replace(/\/+$/, '');
    return clean.endsWith('/api') ? clean : `${clean}/api`;
  }
  return '/api';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('haztrack_token') || 'DEMO_JWT_SESSION_ACTIVE';
  const rawUser = localStorage.getItem('haztrack_user');
  
  if (config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
    if (rawUser) {
      try {
        const parsed = JSON.parse(rawUser);
        if (parsed.role) config.headers['x-demo-role'] = parsed.role;
        if (parsed.userId) config.headers['x-demo-userid'] = parsed.userId;
      } catch {
        // ignore
      }
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // In demo mode, suppress redirect loops
    console.warn('[API RESPONSE WARNING]', error.response?.status, error.response?.data?.message || error.message);
    return Promise.reject(error);
  }
);

export default api;
