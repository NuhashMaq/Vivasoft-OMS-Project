/**
 * Role-Based Access Control (RBAC) Utilities
 * FR-010, FR-011, FR-012, FR-013 Implementation
 */

import { UserRole } from './types';

/**
 * Project-specific role for a user
 * FR-012: Users can have different roles in different projects
 */
export interface ProjectRole {
  projectId: string;
  role: 'project_manager' | 'team_member' | 'viewer';
}

/**
 * Permission definitions for each role
 */
export const ROLE_PERMISSIONS = {
  employee: {
    canViewOwnTasks: true,
    canUpdateOwnTasks: true,
    canSubmitDailyUpdates: true,
    canViewProjects: false,
    canManageProjects: false,
    canManageTasks: false,
    canAssignRoles: false,
    canGenerateReports: false,
    canViewReports: false,
    canAccessAIWiki: false,
  },
  project_manager: {
    canViewOwnTasks: true,
    canUpdateOwnTasks: true,
    canSubmitDailyUpdates: true,
    canViewProjects: true,
    canManageProjects: true,
    canManageTasks: true,
    canAssignRoles: false,
    canGenerateReports: false,
    canViewReports: false,
    canAccessAIWiki: false,
  },
  admin: {
    canViewOwnTasks: true,
    canUpdateOwnTasks: true,
    canSubmitDailyUpdates: true,
    canViewProjects: true,
    canManageProjects: true,
    canManageTasks: true,
    canAssignRoles: false,
    canGenerateReports: true,
    canViewReports: true,
    canAccessAIWiki: true,
  },
  super_admin: {
    canViewOwnTasks: true,
    canUpdateOwnTasks: false, // FR-013: Super Admin cannot modify tasks
    canSubmitDailyUpdates: false,
    canViewProjects: true,
    canManageProjects: false,
    canManageTasks: false, // FR-013: Super Admin cannot create/update/delete tasks
    canAssignRoles: true, // FR-011: Only Super Admin can assign roles
    canGenerateReports: true,
    canViewReports: true,
    canAccessAIWiki: true,
  },
};

/**
 * FR-010: Check if user has permission for an action
 */
export const hasPermission = (
  userRole: UserRole | null | undefined,
  permission: keyof typeof ROLE_PERMISSIONS.employee
): boolean => {
  if (!userRole) return false;
  return ROLE_PERMISSIONS[userRole]?.[permission] ?? false;
};

/**
 * FR-010: Check if user has any of the specified roles
 */
export const hasRole = (
  userRole: UserRole | null | undefined,
  allowedRoles: UserRole[]
): boolean => {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
};

/**
 * FR-011: Check if user can assign/change system roles
 */
export const canAssignSystemRoles = (userRole: UserRole | null | undefined): boolean => {
  return userRole === 'super_admin';
};

/**
 * FR-013: Check if user can modify tasks
 */
export const canModifyTasks = (userRole: UserRole | null | undefined): boolean => {
  // Super Admin cannot modify tasks
  if (userRole === 'super_admin') return false;
  return hasPermission(userRole, 'canManageTasks') || hasPermission(userRole, 'canUpdateOwnTasks');
};

/**
 * FR-013: Check if user can create tasks
 */
export const canCreateTasks = (userRole: UserRole | null | undefined): boolean => {
  // Super Admin cannot create tasks
  if (userRole === 'super_admin') return false;
  return hasPermission(userRole, 'canManageTasks');
};

/**
 * FR-013: Check if user can delete tasks
 */
export const canDeleteTasks = (userRole: UserRole | null | undefined): boolean => {
  // Super Admin cannot delete tasks
  if (userRole === 'super_admin') return false;
  return hasPermission(userRole, 'canManageTasks');
};

/**
 * FR-012: Check if user has permission for a specific project
 */
export const hasProjectPermission = (
  projectId: string,
  userProjectRoles: ProjectRole[],
  requiredRole: ProjectRole['role']
): boolean => {
  const projectRole = userProjectRoles.find(pr => pr.projectId === projectId);
  if (!projectRole) return false;
  
  // Role hierarchy: project_manager > team_member > viewer
  const roleHierarchy = {
    viewer: 1,
    team_member: 2,
    project_manager: 3,
  };
  
  return roleHierarchy[projectRole.role] >= roleHierarchy[requiredRole];
};

/**
 * FR-012: Check if user can manage a specific project
 */
export const canManageProject = (
  userRole: UserRole | null | undefined,
  projectId: string,
  userProjectRoles: ProjectRole[]
): boolean => {
  if (userRole === 'admin') {
    return true;
  }

  // Global project managers can manage projects
  if (userRole === 'project_manager') {
    return hasProjectPermission(projectId, userProjectRoles, 'project_manager');
  }
  
  // Super Admin can view but not manage
  return false;
};

/**
 * FR-012: Check if user can view a specific project
 */
export const canViewProject = (
  userRole: UserRole | null | undefined,
  projectId: string,
  userProjectRoles: ProjectRole[]
): boolean => {
  // Super Admin can view all projects
  if (userRole === 'super_admin') return true;
  if (userRole === 'admin') return true;
  
  // Project managers and employees with project role can view
  if (userRole === 'project_manager' || userRole === 'employee') {
    return userProjectRoles.some(pr => pr.projectId === projectId);
  }
  
  return false;
};

/**
 * Get user's role for a specific project
 */
export const getProjectRole = (
  projectId: string,
  userProjectRoles: ProjectRole[]
): ProjectRole['role'] | null => {
  const projectRole = userProjectRoles.find(pr => pr.projectId === projectId);
  return projectRole?.role ?? null;
};
