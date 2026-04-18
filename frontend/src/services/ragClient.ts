import axios from 'axios';

interface AuthUser {
  id?: string;
  role?: string;
}

const normalizeRagBaseUrl = (raw: string | undefined): string => {
  const fallback = '/rag/v1';
  const value = (raw || fallback).trim();
  const normalized = value.replace(/\/+$/, '');

  if (/\/v1$/i.test(normalized)) {
    return normalized;
  }

  return `${normalized}/v1`;
};

const RAG_BASE_URL = normalizeRagBaseUrl(import.meta.env.VITE_RAG_API_URL);

const ragApi = axios.create({
  baseURL: RAG_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

function getAuthUser(): AuthUser {
  const raw = localStorage.getItem('auth_user');
  if (!raw) {
    return {};
  }
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return {};
  }
}

ragApi.interceptors.request.use((config) => {
  const user = getAuthUser();
  if (user.id) {
    config.headers['X-User-ID'] = String(user.id);
  }
  if (user.role) {
    config.headers['X-User-Role'] = String(user.role);
  }
  return config;
});

export default ragApi;
