import React from 'react';
import { useEmployees } from '../../hooks/useEmployees';

const statusChipClass = (status: string): string =>
  status === 'inactive' ? 'chip chip-status-hold' : 'chip chip-status-active';

export const Employees: React.FC = () => {
  const { data, isLoading, isError } = useEmployees();

  const [search, setSearch] = React.useState('');
  const [departmentFilter, setDepartmentFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');

  const rows = data?.rows || [];

  const departments = React.useMemo(
    () => Array.from(new Set(rows.map((row) => row.department).filter(Boolean))).sort(),
    [rows]
  );

  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((employee) => {
      const matchesSearch =
        !query ||
        employee.full_name.toLowerCase().includes(query) ||
        employee.email.toLowerCase().includes(query) ||
        employee.designation.toLowerCase().includes(query);

      const matchesDepartment = departmentFilter === 'all' || employee.department === departmentFilter;
      const matchesStatus = statusFilter === 'all' || employee.status === statusFilter;
      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [rows, search, departmentFilter, statusFilter]);

  const metrics = React.useMemo(() => {
    const total = rows.length;
    const active = rows.filter((row) => row.status === 'active').length;
    const inactive = rows.filter((row) => row.status === 'inactive').length;
    return { total, active, inactive, departments: departments.length };
  }, [rows, departments.length]);

  if (isLoading) {
    return (
      <div className="panel">
        <p className="muted">Loading employees...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="panel">
        <p className="muted">Failed to load employee directory.</p>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="page-headline">
        <div>
          <h2 className="page-title">Employee Directory</h2>
          <p className="page-subtitle">
            Review staffing, department distribution, and active-assignee readiness for task allocation.
          </p>
        </div>
      </div>

      <section className="kpi-strip stagger">
        <article className="kpi-card">
          <p className="kpi-label">Total Employees</p>
          <p className="kpi-value">{metrics.total}</p>
          <p className="kpi-foot">Across {metrics.departments} departments</p>
        </article>
        <article className="kpi-card">
          <p className="kpi-label">Active</p>
          <p className="kpi-value">{metrics.active}</p>
          <p className="kpi-foot">Ready for assignment</p>
        </article>
        <article className="kpi-card">
          <p className="kpi-label">Inactive</p>
          <p className="kpi-value">{metrics.inactive}</p>
          <p className="kpi-foot">Blocked from new tasks</p>
        </article>
      </section>

      <section className="panel">
        <div className="controls-row">
          <input
            className="field"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, email, or designation"
          />
          <select
            className="field-select"
            value={departmentFilter}
            onChange={(event) => setDepartmentFilter(event.target.value)}
          >
            <option value="all">All departments</option>
            {departments.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>
          <select
            className="field-select"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </section>

      <section className="panel data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Designation</th>
              <th>Joining Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((employee) => (
              <tr key={employee.id}>
                <td>{employee.full_name}</td>
                <td>{employee.email || '-'}</td>
                <td>{employee.department || '-'}</td>
                <td>{employee.designation || '-'}</td>
                <td>{employee.joining_date ? employee.joining_date.slice(0, 10) : '-'}</td>
                <td>
                  <span className={statusChipClass(employee.status)}>{employee.status}</span>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="muted">No employees matched your filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
};