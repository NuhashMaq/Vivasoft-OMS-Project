/**
 * Token Storage Helpers
 * Provides secure token management for JWT authentication
 */

export const getToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

export const setToken = (token: string): void => {
  localStorage.setItem('auth_token', token);
};

export const clearToken = (): void => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
};

export const getUser = () => {
  const user = localStorage.getItem('auth_user');
  return user ? JSON.parse(user) : null;
};

export const setUser = (user: any): void => {
  localStorage.setItem('auth_user', JSON.stringify(user));
};
