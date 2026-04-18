/**
 * Shared TypeScript Types
 */

export type UserRole = 'employee' | 'project_manager' | 'admin' | 'super_admin';

/**
 * FR-012: Project-specific role
 */
export interface ProjectRole {
  projectId: string;
  role: 'project_manager' | 'team_member' | 'viewer';
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  projectRoles?: ProjectRole[]; // FR-012: User can have different roles per project
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}
