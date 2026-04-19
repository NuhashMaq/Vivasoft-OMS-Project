import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext';
import { useProjects } from '../hooks/useProjects';
import { useProjectTasks } from '../hooks/useProjectTasks';
import { fetchDailyCompliance, fetchMyDailyUpdates } from '../api/tasks';

const toDateInput = (date: Date): string => date.toISOString().slice(0, 10);

const getStatusChip = (status: string): string => {
  const normalized = status.toLowerCase();
  if (normalized === 'done') return 'chip chip-status-done';
  if (normalized === 'in progress') return 'chip chip-status-progress';
  if (normalized === 'to do') return 'chip chip-status-todo';
  if (normalized === 'active') return 'chip chip-status-active';
  if (normalized === 'on hold') return 'chip chip-status-hold';
  if (normalized === 'completed') return 'chip chip-status-completed';
  return 'chip chip-status-todo';
};

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: projects = [], isLoading: loadingProjects } = useProjects();

  const today = React.useMemo(() => toDateInput(new Date()), []);
  const defaultFrom = React.useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 14);
    return toDateInput(date);
  }, []);

  const [activeProjectId, setActiveProjectId] = React.useState<string>(() => localStorage.getItem('active_project_id') || '');

  React.useEffect(() => {
    if (projects.length === 0) return;
    if (!activeProjectId) {
      const first = projects[0]?.id;
      if (first) {
        setActiveProjectId(first);
        localStorage.setItem('active_project_id', first);
      }
    }
  }, [projects, activeProjectId]);

  const { data: projectTasks = [] } = useProjectTasks(activeProjectId);

  const updatesQuery = useQuery({
    queryKey: ['dashboard', 'updates', defaultFrom, today],
    queryFn: () => fetchMyDailyUpdates(defaultFrom, today),
  });

  const complianceQuery = useQuery({
    queryKey: ['dashboard', 'compliance', defaultFrom, today],
    queryFn: () => fetchDailyCompliance(defaultFrom, today),
  });

  const taskStats = React.useMemo(() => {
    const total = projectTasks.length;
    const done = projectTasks.filter((task) => task.status === 'Done').length;
    const inProgress = projectTasks.filter((task) => task.status === 'In Progress').length;
    const todo = projectTasks.filter((task) => task.status === 'To Do').length;
    const completionRate = total === 0 ? 0 : Math.round((done / total) * 100);
    return { total, done, inProgress, todo, completionRate };
  }, [projectTasks]);

  const projectStats = React.useMemo(() => {
    const total = projects.length;
    const active = projects.filter((project) => project.status === 'Active').length;
    const onHold = projects.filter((project) => project.status === 'On Hold').length;
    const completed = projects.filter((project) => project.status === 'Completed').length;
    return { total, active, onHold, completed };
  }, [projects]);

  const activeProject = React.useMemo(
    () => projects.find((project) => project.id === activeProjectId),
    [projects, activeProjectId]
  );

  const lastUpdateLabel = updatesQuery.data?.[0]?.update_date
    ? updatesQuery.data[0].update_date.slice(0, 10)
    : 'No updates yet';

  if (loadingProjects) {
    return (
      <div className="panel">
        <p className="muted">Loading dashboard workspace...</p>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="page-headline">
        <div>
          <h2 className="page-title">Welcome back, {user?.name || 'Team'}</h2>
          <p className="page-subtitle">
            Track project health, task flow, and daily-update compliance from one mission-control panel.
          </p>
        </div>
      </div>

      <div className="kpi-strip stagger">
        <article className="kpi-card">
          <p className="kpi-label">Projects</p>
          <p className="kpi-value">{projectStats.total}</p>
          <p className="kpi-foot">{projectStats.active} active, {projectStats.onHold} on hold</p>
        </article>

        <article className="kpi-card">
          <p className="kpi-label">Focus Completion</p>
          <p className="kpi-value">{taskStats.completionRate}%</p>
          <p className="kpi-foot">{taskStats.done} done out of {taskStats.total} tasks</p>
        </article>

        <article className="kpi-card">
          <p className="kpi-label">In Progress</p>
          <p className="kpi-value">{taskStats.inProgress}</p>
          <p className="kpi-foot">{taskStats.todo} waiting in backlog</p>
        </article>

        <article className="kpi-card">
          <p className="kpi-label">Daily Update Gaps</p>
          <p className="kpi-value">{complianceQuery.data?.missing_weekdays ?? 0}</p>
          <p className="kpi-foot">Last update: {lastUpdateLabel}</p>
        </article>
      </div>

      <div className="grid-2">
        <section className="panel">
          <div className="page-headline" style={{ marginBottom: '12px' }}>
            <div>
              <h3 className="panel-title">Focus Project</h3>
              <p className="muted">Switch project context for task metrics and kanban overview</p>
            </div>

            <select
              className="field-select"
              value={activeProjectId}
              onChange={(event) => {
                setActiveProjectId(event.target.value);
                localStorage.setItem('active_project_id', event.target.value);
              }}
              style={{ minWidth: 220 }}
            >
              <option value="">Select project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {activeProject ? (
            <div className="grid-3 stagger">
              <article className="card-soft">
                <p className="kpi-label">Status</p>
                <p style={{ marginTop: 8 }}>
                  <span className={getStatusChip(activeProject.status)}>{activeProject.status}</span>
                </p>
              </article>

              <article className="card-soft">
                <p className="kpi-label">Done</p>
                <p className="kpi-value" style={{ fontSize: 24 }}>{taskStats.done}</p>
              </article>

              <article className="card-soft">
                <p className="kpi-label">In Progress</p>
                <p className="kpi-value" style={{ fontSize: 24 }}>{taskStats.inProgress}</p>
              </article>

              <article className="card-soft">
                <p className="kpi-label">Backlog</p>
                <p className="kpi-value" style={{ fontSize: 24 }}>{taskStats.todo}</p>
              </article>

              <article className="card-soft">
                <p className="kpi-label">Completion</p>
                <p className="kpi-value" style={{ fontSize: 24 }}>{taskStats.completionRate}%</p>
              </article>

              <article className="card-soft">
                <p className="kpi-label">Lifecycle</p>
                <p className="muted" style={{ marginTop: 8 }}>
                  {activeProject.type || 'Project'} • started {activeProject.start_date?.slice(0, 10) || 'n/a'}
                </p>
              </article>
            </div>
          ) : (
            <p className="muted">Select a project to view execution metrics.</p>
          )}
        </section>

        <section className="panel">
          <h3 className="panel-title">Recent Daily Updates</h3>
          {updatesQuery.isLoading && <p className="muted">Loading updates...</p>}

          {!updatesQuery.isLoading && (updatesQuery.data?.length || 0) === 0 && (
            <p className="muted">No daily updates submitted in the selected window.</p>
          )}

          <div style={{ display: 'grid', gap: 10 }}>
            {updatesQuery.data?.slice(0, 6).map((update) => (
              <article key={update.id} className="card-soft">
                <div className="page-headline" style={{ alignItems: 'center' }}>
                  <p className="kpi-label">{update.update_date.slice(0, 10)}</p>
                  <p className="kpi-foot">{update.hours_worked ?? 0}h</p>
                </div>
                <p style={{ marginTop: 8 }}>{update.summary || 'No summary provided'}</p>
                <p className="muted" style={{ marginTop: 6 }}>
                  {update.items.length} item(s) logged
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="panel">
        <h3 className="panel-title">Portfolio Snapshot</h3>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Status</th>
                <th>Type</th>
                <th>Start</th>
                <th>End</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id}>
                  <td>{project.name}</td>
                  <td>
                    <span className={getStatusChip(project.status)}>{project.status}</span>
                  </td>
                  <td>{project.type || 'n/a'}</td>
                  <td>{project.start_date?.slice(0, 10) || '-'}</td>
                  <td>{project.end_date?.slice(0, 10) || '-'}</td>
                </tr>
              ))}

              {projects.length === 0 && (
                <tr>
                  <td colSpan={5} className="muted">No projects available yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
