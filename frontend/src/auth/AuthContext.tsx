import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ProjectRole } from './types';
import { API_BASE_URL } from './api';

export type UserRole = 'employee' | 'project_manager' | 'admin' | 'super_admin';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email?: string;
  projectRoles?: ProjectRole[];
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface LoginApiResponse {
  token?: string;
  user_id?: number;
  error?: string;
}

interface MeApiResponse {
  user_id?: number;
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  error?: string;
}

interface ProjectListApiResponse {
  data?: Array<{ id: string | number }>;
}

const mapBackendRole = (role: string | undefined): UserRole => {
  const normalized = (role || '').toLowerCase().trim();
  if (normalized === 'super_admin') return 'super_admin';
  if (normalized === 'admin') return 'admin';
  if (normalized === 'manager' || normalized === 'project_manager') return 'project_manager';
  return 'employee';
};

const ensureActiveProjectId = async (token: string): Promise<void> => {
  if (localStorage.getItem('active_project_id')) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/projects?page=1&page_size=1`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as ProjectListApiResponse;
    const firstProject = payload?.data?.[0];
    if (firstProject?.id !== undefined && firstProject?.id !== null) {
      localStorage.setItem('active_project_id', String(firstProject.id));
    }
  } catch {
    // Ignore non-critical project bootstrap errors.
  }
};

export { AuthContext };

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (err) {
        // Clear if parse fails
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      let loginData: LoginApiResponse = {};
      try {
        loginData = (await response.json()) as LoginApiResponse;
      } catch {
        loginData = {};
      }

      if (!response.ok || !loginData.token) {
        throw new Error(loginData.error || 'Invalid email or password');
      }

      const meResponse = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${loginData.token}`,
        },
      });

      let meData: MeApiResponse = {};
      try {
        meData = (await meResponse.json()) as MeApiResponse;
      } catch {
        meData = {};
      }

      if (!meResponse.ok) {
        throw new Error(meData.error || 'Failed to load user profile');
      }

      const fullName = `${meData.first_name || ''} ${meData.last_name || ''}`.trim();
      const userID = meData.user_id ?? loginData.user_id;
      if (!userID) {
        throw new Error('User session is invalid');
      }

      const normalizedUser: User = {
        id: String(userID),
        name: fullName || meData.email || email,
        email: meData.email || email,
        role: mapBackendRole(meData.role),
        projectRoles: [] as ProjectRole[],
      };

      // Store in localStorage
      localStorage.setItem('auth_token', loginData.token);
      localStorage.setItem('auth_user', JSON.stringify(normalizedUser));

      await ensureActiveProjectId(loginData.token);

      // Update state
      setToken(loginData.token);
      setUser(normalizedUser);
    } catch (err) {
      const isNetworkError =
        (err instanceof TypeError) ||
        (err instanceof Error && /failed to fetch|networkerror|network error/i.test(err.message));

      const errorMessage = isNetworkError
        ? `Unable to reach server at ${API_BASE_URL}. Please check deployment and try again.`
        : (err instanceof Error ? err.message : 'Login failed. Please try again.');
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    const currentToken = token || localStorage.getItem('auth_token');
    if (currentToken) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        });
      } catch {
        // Ignore logout transport errors and clear local state regardless.
      }
    }

    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
    setError(null);
  }, [token]);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    error,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
