/**
 * Axios instance for ArcAds API.
 * Sends X-User-Id from localStorage (set by AuthContext on login, cleared on logout).
 */
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const userId = localStorage.getItem('arcads_user_id'); // same key as AuthContext
  if (userId) config.headers['X-User-Id'] = userId;
  // Default JSON Content-Type breaks multipart: browser must set boundary for FormData
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

export default api;
