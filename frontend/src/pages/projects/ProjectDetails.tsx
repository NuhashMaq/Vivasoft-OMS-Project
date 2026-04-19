import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchProjectById } from '../../api/projects';
import { useProjectMembers } from '../../hooks/useProjectMembers';
import { useProjectTasks } from '../../hooks/useProjectTasks';

const getProjectChip = (status: string): string => {
  const normalized = status.toLowerCase();
  if (normalized === 'completed') return 'chip chip-status-completed';
  if (normalized === 'on hold') return 'chip chip-status-hold';
  return 'chip chip-status-active';
};

export const ProjectDetails: React.FC = () => {
  const { id = '' } = useParams();

  const projectQuery = useQuery({
    queryKey: ['projects', id, 'detail'],
    queryFn: () => fetchProjectById(id),
    enabled: !!id,
  });

  const { data: members = [] } = useProjectMembers(id);
  const { data: tasks = [] } = useProjectTasks(id);

  const metrics = React.useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((task) => task.status === 'Done').length;
    const inProgress = tasks.filter((task) => task.status === 'In Progress').length;
    const todo = tasks.filter((task) => task.status === 'To Do').length;
    return {
      total,
      done,
      inProgress,
      todo,
      completion: total ? Math.round((done / total) * 100) : 0,
    };
  }, [tasks]);

  if (projectQuery.isLoading) {
    return (
      <div className="panel">
        <p className="muted">Loading project workspace...</p>
      </div>
    );
  }

  if (projectQuery.isError || !projectQuery.data) {
    return (
      <div className="panel">
        <p className="muted">Project could not be loaded.</p>
      </div>
    );
  }

  const project = projectQuery.data;

  return (
    <div className="page-shell">
      <div className="page-headline">
        <div>
          <h2 className="page-title">{project.name}</h2>
          <p className="page-subtitle">Project ID #{project.id} • {project.description || 'No description available.'}</p>
        </div>
        <span className={getProjectChip(project.status)}>{project.status}</span>
      </div>

      <section className="kpi-strip stagger">
        <article className="kpi-card">
          <p className="kpi-label">Members</p>
          <p className="kpi-value">{members.length}</p>
          <p className="kpi-foot">Cross-functional allocation</p>
        </article>
        <article className="kpi-card">
          <p className="kpi-label">Tasks</p>
          <p className="kpi-value">{metrics.total}</p>
          <p className="kpi-foot">{metrics.todo} to do • {metrics.inProgress} in progress</p>
        </article>
        <article className="kpi-card">
          <p className="kpi-label">Completion</p>
          <p className="kpi-value">{metrics.completion}%</p>
          <p className="kpi-foot">{metrics.done} done</p>
        </article>
        <article className="kpi-card">
          <p className="kpi-label">Timeline</p>
          <p className="kpi-value" style={{ fontSize: 20 }}>{project.start_date?.slice(0, 10) || '-'} </p>
          <p className="kpi-foot">to {project.end_date?.slice(0, 10) || '-'}</p>
        </article>
      </section>

      <div className="grid-2">
        <section className="panel">
          <h3 className="panel-title">Project Members</h3>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Project Role</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id}>
                    <td>{member.name || 'Unknown'}</td>
                    <td>{member.email || '-'}</td>
                    <td>{member.role}</td>
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr>
                    <td colSpan={3} className="muted">No members assigned yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel">
          <h3 className="panel-title">Recent Task Snapshot</h3>
          <div style={{ display: 'grid', gap: 8 }}>
            {tasks.slice(0, 8).map((task) => (
              <article key={task.id} className="card-soft" style={{ padding: 10 }}>
                <div className="page-headline" style={{ alignItems: 'center' }}>
                  <strong style={{ fontSize: 14 }}>{task.title}</strong>
                  <span className={`chip ${task.status === 'Done' ? 'chip-status-done' : task.status === 'In Progress' ? 'chip-status-progress' : 'chip-status-todo'}`}>
                    {task.status}
                  </span>
                </div>
                <p className="muted" style={{ marginTop: 6, fontSize: 13 }}>
                  Assignee #{task.assignee_id}
                </p>
              </article>
            ))}

            {tasks.length === 0 && <p className="muted">No tasks available for this project.</p>}
          </div>
        </section>
      </div>
    </div>
  );
};