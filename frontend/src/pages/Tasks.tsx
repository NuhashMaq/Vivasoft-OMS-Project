import React, { useEffect, useState } from 'react';
import { useProjects } from '../hooks/useProjects';
import { ProjectTaskBoard } from '../components/task-board/ProjectTaskBoard';

export const Tasks: React.FC = () => {
  const { data: projects, isLoading: loadingProjects } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  useEffect(() => {
    const storedProject = localStorage.getItem('active_project_id');
    if (storedProject) {
      setSelectedProjectId(storedProject);
    }
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      localStorage.setItem('active_project_id', selectedProjectId);
    }
  }, [selectedProjectId]);

  if (loadingProjects) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
        Loading Workspace...
      </div>
    );
  }

  return (
    <div className="tasks-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h2 style={{ margin: '0 0 5px 0' }}>Task Management</h2>
          <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>
            Track your personal and team progress
          </p>
        </div>
      </div>

      <div style={{
        background: '#fff',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #ddd',
        marginBottom: '20px'
      }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', fontSize: '14px' }}>
          Active Project
        </label>
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '6px',
            border: '1px solid #ccc',
            outline: 'none',
            fontSize: '14px'
          }}
        >
          <option value="">Select a project to view tasks...</option>
          {projects?.map(project => (
            <option key={project.id} value={project.id}>{project.name}</option>
          ))}
        </select>
      </div>

      {selectedProjectId ? (
        <ProjectTaskBoard projectId={selectedProjectId} />
      ) : (
        <div style={{
          padding: '60px',
          textAlign: 'center',
          background: '#f9f9f9',
          borderRadius: '8px',
          border: '1px solid #ddd',
          color: '#666'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📋</div>
          <h3>Initialize Viewport</h3>
          <p>Please select a project from the dropdown above to manage its tasks.</p>
        </div>
      )}
    </div>
  );
};
