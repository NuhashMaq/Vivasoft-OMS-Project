import React from "react";

type Props = {
  search: string;
  onSearchChange: (v: string) => void;
  department: string;
  onDepartmentChange: (v: string) => void;
  status: string;
  onStatusChange: (v: string) => void;
  departments: string[];
};

export const EmployeeFilter: React.FC<Props> = ({
  search,
  onSearchChange,
  department,
  onDepartmentChange,
  status,
  onStatusChange,
  departments,
}) => {
  return (
    <div className="emp-filters">
      <input
        className="emp-input"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search by name/email..."
      />

      <select
        className="emp-select"
        value={department}
        onChange={(e) => onDepartmentChange(e.target.value)}
      >
        <option value="">All Departments</option>
        {departments.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>

      <select
        className="emp-select"
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
      >
        <option value="">All Status</option>
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
      </select>
    </div>
  );
};