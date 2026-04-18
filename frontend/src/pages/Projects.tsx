import React from 'react';
import { useAuth } from '../auth/AuthContext';
import { canManageProject, canViewProject, getProjectRole } from '../auth/rbac';

interface Project {
  id: string;
  name: string;
  status: string;
  progress: number;
}

export const Projects: React.FC = () => {
  const { user } = useAuth();
  const [projects] = React.useState<Project[]>([
    { id: 'proj-1', name: 'Website Redesign', status: 'In Progress', progress: 65 },
    { id: 'proj-2', name: 'Mobile App', status: 'In Progress', progress: 45 },
    { id: 'proj-3', name: 'API Backend', status: 'In Progress', progress: 80 },
    { id: 'proj-4', name: 'Documentation', status: 'Pending', progress: 10 },
  ]);

  const userProjectRoles = user?.projectRoles || [];

  // FR-012: Check if user can manage a specific project
  const canUserManageProject = (projectId: string) => {
    return canManageProject(user?.role, projectId, userProjectRoles);
  };

  // FR-012: Check if user can view a specific project
  const canUserViewProject = (projectId: string) => {
    return canViewProject(user?.role, projectId, userProjectRoles);
  };

  // FR-012: Get user's role for a specific project
  const getUserProjectRole = (projectId: string) => {
    return getProjectRole(projectId, userProjectRoles);
  };

  const handleEditProject = (projectId: string) => {
    if (!canUserManageProject(projectId)) {
      alert('You do not have permission to manage this project.');
      return;
    }
    alert(`Edit project ${projectId} (to be implemented)`);
  };

  const handleCreateProject = () => {
    // Only project managers with appropriate role can create projects
    if (user?.role !== 'project_manager') {
      alert('Only Project Managers can create projects.');
      return;
    }
    alert('Create project functionality (to be implemented)');
  };

  // FR-012: Filter projects based on user access
  const accessibleProjects = projects.filter(project => {
    // Super Admin can view all projects
    if (user?.role === 'super_admin') return true;
    // Others need specific project access
    return canUserViewProject(project.id);
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Projects</h2>
        {/* FR-011, FR-012: Only project managers can create projects */}
        {user?.role === 'project_manager' && (
          <button
            onClick={handleCreateProject}
            style={{
              background: '#667eea',
              color: '#fff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            + Create Project
          </button>
        )}
      </div>

      {accessibleProjects.length === 0 && user?.role !== 'super_admin' && (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          background: '#f9f9f9', 
          borderRadius: '8px',
          color: '#666'
        }}>
          No projects available. You don't have access to any projects yet.
        </div>
      )}

      {user?.role === 'super_admin' && accessibleProjects.length === 0 && (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          background: '#f9f9f9', 
          borderRadius: '8px',
          color: '#666'
        }}>
          No projects in the system.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {accessibleProjects.map(project => {
          const projectRole = getUserProjectRole(project.id);
          const canManage = canUserManageProject(project.id);
          const isSuperAdmin = user?.role === 'super_admin';

          return (
            <div key={project.id} style={{ 
              padding: '20px', 
              border: '1px solid #ddd', 
              borderRadius: '8px',
              background: '#fff'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <h3 style={{ margin: 0 }}>{project.name}</h3>
                {/* FR-012: Show project role badge */}
                {projectRole && (
                  <span style={{
                    background: projectRole === 'project_manager' ? '#d4edda' : 
                                projectRole === 'team_member' ? '#fff3cd' : '#e3f2fd',
                    color: projectRole === 'project_manager' ? '#155724' :
                           projectRole === 'team_member' ? '#856404' : '#1976d2',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '600',
                    textTransform: 'uppercase'
                  }}>
                    {projectRole.replace('_', ' ')}
                  </span>
                )}
                {isSuperAdmin && (
                  <span style={{
                    background: '#f3e5f5',
                    color: '#6a1b9a',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '600',
                    textTransform: 'uppercase'
                  }}>
                    VIEW ONLY
                  </span>
                )}
              </div>
              
              <p style={{ margin: '10px 0' }}>Status: <strong>{project.status}</strong></p>
              
              <div style={{ background: '#f0f0f0', height: '8px', borderRadius: '4px', overflow: 'hidden', marginTop: '10px' }}>
                <div style={{ 
                  background: '#667eea', 
                  height: '100%', 
                  width: `${project.progress}%`,
                  transition: 'width 0.3s'
                }}></div>
              </div>
              
              <p style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>{project.progress}% Complete</p>

              {/* FR-012, FR-013: Show action buttons based on permissions */}
              <div style={{ marginTop: '15px', display: 'flex', gap: '8px' }}>
                <button
                  style={{
                    background: '#f0f0f0',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    flex: 1
                  }}
                >
                  👁️ View Details
                </button>
                
                {/* FR-012: Only show edit if user can manage this project */}
                {/* FR-013: Super Admin cannot manage projects */}
                {canManage && !isSuperAdmin && (
                  <button
                    onClick={() => handleEditProject(project.id)}
                    style={{
                      background: '#667eea',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      flex: 1
                    }}
                  >
                    ✏️ Edit
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* FR-013: Show info for Super Admin */}
      {user?.role === 'super_admin' && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          background: '#fff3cd', 
          borderRadius: '6px',
          fontSize: '14px'
        }}>
          ℹ️ As Super Admin, you have view-only access to all projects. You cannot modify project data.
        </div>
      )}

      {/* FR-012: Show info for users with limited project access */}
      {user?.role !== 'super_admin' && accessibleProjects.length > 0 && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          background: '#e3f2fd', 
          borderRadius: '6px',
          fontSize: '14px'
        }}>
          ℹ️ You can only see projects where you have been assigned a role. Your permissions vary by project.
        </div>
      )}
    </div>
  );
};
