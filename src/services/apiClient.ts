/**
 * apiClient.ts
 * ─────────────────────────────────────────────────────────────────
 * Configured Axios instance for KSW Pathshala Admin Portal.
 *
 * • Base URL  : The external AWS API Gateway base URL from the Postman collection.
 * • Auth      : Bearer token is auto-injected from localStorage (set after login).
 * • Errors    : 401 responses clear the session and redirect to /login.
 * ─────────────────────────────────────────────────────────────────
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// ── Base URL ──────────────────────────────────────────────────────────────────
export const BASE_URL = 'https://g4zmqv1pti.execute-api.ap-south-1.amazonaws.com';

// ── Create Axios instance ───────────────────────────────────────────────────
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 s
});

// ── Request interceptor – attach Bearer token ───────────────────────────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const session = localStorage.getItem('user_session');
      if (session) {
        const parsed = JSON.parse(session);
        if (parsed?.token) {
          config.headers.Authorization = `Bearer ${parsed.token}`;
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor – handle arrays and 401 unauthorised ─────────────────────────
apiClient.interceptors.response.use(
  (response) => {
    // ── Global Array Wrapper ──────────────────────────────────────
    // If the AWS API returns a raw Array, wrap it into the expected object keys 
    // so that legacy UI components (which expect e.g. data.teachers.map) don't crash.
    if (Array.isArray(response.data)) {
      const url = response.config.url || '';
      
      if (url.includes('/teachers')) response.data = { teachers: response.data };
      else if (url.includes('/donations')) response.data = { donations: response.data };
      else if (url.includes('/activities')) response.data = { activities: response.data };
      else if (url.includes('/gps')) response.data = { logs: response.data, teachers: [] };
      else if (url.includes('/audit')) response.data = { logs: response.data };
      else if (url.includes('/students')) response.data = { students: response.data };
      else if (url.includes('/events')) response.data = { events: response.data };
      else if (url.includes('/campaigns')) response.data = { campaigns: response.data };
      else if (url.includes('/volunteers')) response.data = { volunteers: response.data };
      else if (url.includes('/sliders')) response.data = { sliders: response.data };
      else if (url.includes('/intro-videos')) response.data = { introVideos: response.data };
      else if (url.includes('/members')) response.data = { members: response.data };
      else response.data = { items: response.data };
    }
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Clear stale session and bounce to login
      localStorage.removeItem('user_session');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
