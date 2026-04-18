import React, { useState } from 'react';
import './Filters.css';

interface FiltersProps {
  onApply?: (filters: FilterValues) => void;
}

interface FilterValues {
  startDate: string;
  endDate: string;
  employee: string;
  project: string;
}

export const Filters: React.FC<FiltersProps> = ({ onApply }) => {
  const [filters, setFilters] = useState<FilterValues>({
    startDate: '',
    endDate: '',
    employee: 'all',
    project: 'all',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.currentTarget;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApply = () => {
    onApply?.(filters);
  };

  return (
    <div className="filters">
      <input
        type="date"
        name="startDate"
        value={filters.startDate}
        onChange={handleChange}
        placeholder="Start Date"
      />
      <input
        type="date"
        name="endDate"
        value={filters.endDate}
        onChange={handleChange}
        placeholder="End Date"
      />
      <select
        name="employee"
        value={filters.employee}
        onChange={handleChange}
      >
        <option value="all">All Employees</option>
        <option value="emp1">Employee 1</option>
        <option value="emp2">Employee 2</option>
      </select>
      <select
        name="project"
        value={filters.project}
        onChange={handleChange}
      >
        <option value="all">All Projects</option>
        <option value="proj1">Project 1</option>
        <option value="proj2">Project 2</option>
      </select>
      <button onClick={handleApply} className="btn-apply">
        Apply
      </button>
    </div>
  );
};
