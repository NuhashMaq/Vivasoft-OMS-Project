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
      <div className="panel">
        <p className="muted">Loading task workspace...</p>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="page-headline">
        <div>
          <h2 className="page-title">Task Command Center</h2>
          <p className="page-subtitle">
            Drag tasks through delivery stages, inspect history, and keep execution transparent.
          </p>
        </div>
      </div>

      <section className="panel">
        <label className="kpi-label" style={{ marginBottom: 6, display: 'inline-block' }}>Active Project</label>
        <select
          className="field-select"
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
        >
          <option value="">Select a project to view tasks...</option>
          {projects?.map(project => (
            <option key={project.id} value={project.id}>{project.name}</option>
          ))}
        </select>
      </section>

      {selectedProjectId ? (
        <ProjectTaskBoard projectId={selectedProjectId} />
      ) : (
        <section className="panel">
          <h3 className="panel-title">Select a project to open kanban board</h3>
          <p className="muted">The board will show To Do, In Progress, and Done columns with drag-and-drop updates.</p>
        </section>
      )}
    </div>
  );
};
