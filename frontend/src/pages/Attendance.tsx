import React from 'react';
import { useAuth } from '../auth/AuthContext';
import { useEmployees } from '../hooks/useEmployees';

type AttendanceStatus = 'Present' | 'Late' | 'Absent';

interface AttendanceRecord {
  employee_id: string;
  employee_name: string;
  designation: string;
  department: string;
  check_in: string;
  check_out: string;
  break_minutes: number;
  working_hours: number;
  overtime_hours: number;
  status: AttendanceStatus;
}

const toTime = (hour: number, minute: number): string => {
  const hh = String(hour).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');
  return `${hh}:${mm}`;
};

const buildAttendance = (
  employeeId: string,
  employeeName: string,
  designation: string,
  department: string,
  employeeStatus: string,
  index: number
): AttendanceRecord => {
  if (employeeStatus === 'inactive') {
    return {
      employee_id: employeeId,
      employee_name: employeeName,
      designation,
      department,
      check_in: '-',
      check_out: '-',
      break_minutes: 0,
      working_hours: 0,
      overtime_hours: 0,
      status: 'Absent',
    };
  }

  const offset = index % 7;
  const checkInHour = 9 + (offset > 4 ? 1 : 0);
  const checkInMinute = (offset * 7) % 60;
  const checkOutHour = 17 + (offset % 3 === 0 ? 1 : 0);
  const checkOutMinute = 20 + ((offset * 5) % 30);
  const breakMinutes = 45 + (offset % 3) * 15;

  const totalHours = (checkOutHour + checkOutMinute / 60) - (checkInHour + checkInMinute / 60) - breakMinutes / 60;
  const workingHours = Number(Math.max(totalHours, 0).toFixed(2));
  const overtime = Number(Math.max(workingHours - 8, 0).toFixed(2));

  const status: AttendanceStatus =
    checkInHour > 9 || (checkInHour === 9 && checkInMinute > 10)
      ? 'Late'
      : 'Present';

  return {
    employee_id: employeeId,
    employee_name: employeeName,
    designation,
    department,
    check_in: toTime(checkInHour, checkInMinute),
    check_out: toTime(checkOutHour, checkOutMinute),
    break_minutes: breakMinutes,
    working_hours: workingHours,
    overtime_hours: overtime,
    status,
  };
};

const statusChip = (status: AttendanceStatus): string => {
  if (status === 'Present') return 'chip chip-status-done';
  if (status === 'Late') return 'chip chip-status-hold';
  return 'chip chip-status-completed';
};

export const Attendance: React.FC = () => {
  const { user } = useAuth();
  const { data, isLoading, isError } = useEmployees();

  const records = React.useMemo(() => {
    const employees = data?.rows || [];
    const base = employees.map((employee, index) =>
      buildAttendance(
        employee.id,
        employee.full_name,
        employee.designation,
        employee.department,
        employee.status,
        index
      )
    );

    if (user?.role === 'employee') {
      return base.filter((item) => item.employee_id === user.id);
    }

    return base;
  }, [data?.rows, user?.id, user?.role]);

  const metrics = React.useMemo(() => {
    const total = records.length;
    const present = records.filter((item) => item.status === 'Present').length;
    const late = records.filter((item) => item.status === 'Late').length;
    const absent = records.filter((item) => item.status === 'Absent').length;
    const avgHours = total === 0 ? 0 : Number((records.reduce((sum, row) => sum + row.working_hours, 0) / total).toFixed(2));
    const overtime = Number(records.reduce((sum, row) => sum + row.overtime_hours, 0).toFixed(2));

    return { total, present, late, absent, avgHours, overtime };
  }, [records]);

  if (isLoading) {
    return (
      <div className="panel">
        <p className="muted">Loading attendance view...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="panel">
        <p className="muted">Failed to load attendance analytics.</p>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="page-headline">
        <div>
          <h2 className="page-title">Attendance Operations</h2>
          <p className="page-subtitle">
            Daily presence, punctuality, and utilization snapshot for workforce planning and KPI context.
          </p>
        </div>
      </div>

      <section className="kpi-strip stagger">
        <article className="kpi-card">
          <p className="kpi-label">Records</p>
          <p className="kpi-value">{metrics.total}</p>
          <p className="kpi-foot">For today</p>
        </article>
        <article className="kpi-card">
          <p className="kpi-label">Present</p>
          <p className="kpi-value">{metrics.present}</p>
          <p className="kpi-foot">Late: {metrics.late}</p>
        </article>
        <article className="kpi-card">
          <p className="kpi-label">Absent</p>
          <p className="kpi-value">{metrics.absent}</p>
          <p className="kpi-foot">Active policy checks</p>
        </article>
        <article className="kpi-card">
          <p className="kpi-label">Average Hours</p>
          <p className="kpi-value">{metrics.avgHours}</p>
          <p className="kpi-foot">Overtime total: {metrics.overtime}h</p>
        </article>
      </section>

      <section className="panel data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Designation</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Break</th>
              <th>Hours</th>
              <th>Overtime</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.employee_id}>
                <td>{record.employee_name}</td>
                <td>{record.department || '-'}</td>
                <td>{record.designation || '-'}</td>
                <td>{record.check_in}</td>
                <td>{record.check_out}</td>
                <td>{record.break_minutes}m</td>
                <td>{record.working_hours}</td>
                <td>{record.overtime_hours}</td>
                <td>
                  <span className={statusChip(record.status)}>{record.status}</span>
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan={9} className="muted">No attendance records available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
};
