import React from 'react';
import { Link } from 'react-router-dom';
import { useProjects } from '../../hooks/useProjects';

const getProjectChip = (status: string): string => {
  const normalized = status.toLowerCase();
  if (normalized === 'completed') return 'chip chip-status-completed';
  if (normalized === 'on hold') return 'chip chip-status-hold';
  return 'chip chip-status-active';
};

export const Projects: React.FC = () => {
  const { data: projects = [], isLoading, isError } = useProjects();

  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');

  const filteredProjects = React.useMemo(() => {
    return projects.filter((project) => {
      const searchValue = search.trim().toLowerCase();
      const matchesSearch =
        !searchValue ||
        project.name.toLowerCase().includes(searchValue) ||
        project.description.toLowerCase().includes(searchValue);

      const matchesStatus = statusFilter === 'all' || project.status.toLowerCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projects, search, statusFilter]);

  if (isLoading) {
    return (
      <div className="panel">
        <p className="muted">Loading projects...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="panel">
        <p className="muted">Failed to load projects.</p>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="page-headline">
        <div>
          <h2 className="page-title">Project Portfolio</h2>
          <p className="page-subtitle">
            Navigate all SRS-tracked projects, check lifecycle states, and open detailed workspaces.
          </p>
        </div>
      </div>

      <section className="panel">
        <div className="controls-row">
          <input
            className="field"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by project name or description"
          />

          <select
            className="field-select"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="on hold">On Hold</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </section>

      <section className="grid-cards stagger">
        {filteredProjects.map((project) => (
          <article key={project.id} className="card-soft">
            <div className="page-headline" style={{ alignItems: 'center' }}>
              <h3 style={{ fontSize: 17 }}>{project.name}</h3>
              <span className={getProjectChip(project.status)}>{project.status}</span>
            </div>

            <p className="muted" style={{ marginTop: 8, minHeight: 40 }}>
              {project.description || 'No description available.'}
            </p>

            <div style={{ marginTop: 10, display: 'grid', gap: 4 }}>
              <p className="kpi-foot">Type: {project.type || 'n/a'}</p>
              <p className="kpi-foot">Start: {project.start_date?.slice(0, 10) || '-'}</p>
              <p className="kpi-foot">End: {project.end_date?.slice(0, 10) || '-'}</p>
            </div>

            <div style={{ marginTop: 14 }}>
              <Link to={`/projects/${project.id}`} className="btn btn-primary" style={{ display: 'inline-flex' }}>
                Open Workspace
              </Link>
            </div>
          </article>
        ))}

        {filteredProjects.length === 0 && (
          <div className="panel" style={{ gridColumn: '1 / -1' }}>
            <p className="muted">No projects matched your filters.</p>
          </div>
        )}
      </section>
    </div>
  );
};
