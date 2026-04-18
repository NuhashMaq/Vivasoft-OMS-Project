import axios from 'axios';
import { getToken } from './tokenStore';

const normalizeApiBaseUrl = (raw: string | undefined): string => {
  const fallback = '/api/v1';
  const value = (raw || fallback).trim();
  const normalized = value.replace(/\/+$/, '');

  if (/\/v1$/i.test(normalized)) {
    return normalized;
  }

  return `${normalized}/v1`;
};

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to all requests
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
