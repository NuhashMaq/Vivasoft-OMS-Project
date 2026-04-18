import React from 'react';
import { useAuth } from '../auth/AuthContext';
import { hasRole } from '../auth/rbac';

interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  breakTime: number; // in minutes
  workingHrs: number;
  extraHrs: number;
  status: 'Present' | 'Late' | 'Absent' | 'Half-Day';
}

const STANDARD_SHIFT_HOURS = 8;

/**
 * Calculate working hours based on check in/out times
 */
const calculateWorkingHours = (checkIn: string | null, checkOut: string | null, breakTime: number): number => {
  if (!checkIn || !checkOut) return 0;
  
  const checkInDate = new Date(`2026-03-02 ${checkIn}`);
  const checkOutDate = new Date(`2026-03-02 ${checkOut}`);
  
  const diffMs = checkOutDate.getTime() - checkInDate.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const breakHours = breakTime / 60;
  
  return Math.max(0, diffHours - breakHours);
};

/**
 * Calculate extra hours (overtime)
 */
const calculateExtraHours = (workingHrs: number): number => {
  return Math.max(0, workingHrs - STANDARD_SHIFT_HOURS);
};

/**
 * Determine attendance status
 */
const determineStatus = (checkIn: string | null, checkOut: string | null, workingHrs: number): 'Present' | 'Late' | 'Absent' | 'Half-Day' => {
  if (!checkIn) return 'Absent';
  
  // Check if late (after 9:00 AM)
  const checkInTime = checkIn.split(':');
  const checkInHour = parseInt(checkInTime[0]);
  const checkInMinute = parseInt(checkInTime[1]);
  const isLate = checkInHour > 9 || (checkInHour === 9 && checkInMinute > 0);
  
  if (!checkOut) return isLate ? 'Late' : 'Present';
  
  // Half day if less than 4 hours worked
  if (workingHrs < 4) return 'Half-Day';
  
  return isLate ? 'Late' : 'Present';
};

export const Attendance: React.FC = () => {
  const { user } = useAuth();
  const [attendanceData, setAttendanceData] = React.useState<AttendanceRecord[]>([
    {
      id: '1',
      employeeId: 'emp-001',
      employeeName: 'John Smith',
      date: '2026-03-02',
      checkIn: '09:00',
      checkOut: '17:30',
      breakTime: 60,
      workingHrs: 8.5,
      extraHrs: 0.5,
      status: 'Present'
    },
    {
      id: '2',
      employeeId: 'emp-002',
      employeeName: 'Sarah Johnson',
      date: '2026-03-02',
      checkIn: '08:45',
      checkOut: '17:15',
      breakTime: 60,
      workingHrs: 8.5,
      extraHrs: 0.5,
      status: 'Present'
    },
    {
      id: '3',
      employeeId: 'emp-003',
      employeeName: 'Mike Davis',
      date: '2026-03-02',
      checkIn: '09:15',
      checkOut: null,
      breakTime: 0,
      workingHrs: 0,
      extraHrs: 0,
      status: 'Late'
    },
    {
      id: '4',
      employeeId: 'emp-004',
      employeeName: 'Emma Wilson',
      date: '2026-03-02',
      checkIn: null,
      checkOut: null,
      breakTime: 0,
      workingHrs: 0,
      extraHrs: 0,
      status: 'Absent'
    },
    {
      id: '5',
      employeeId: 'emp-005',
      employeeName: 'David Brown',
      date: '2026-03-02',
      checkIn: '09:00',
      checkOut: '17:45',
      breakTime: 60,
      workingHrs: 8.75,
      extraHrs: 0.75,
      status: 'Present'
    },
  ]);

  const [selectedBreakTime, setSelectedBreakTime] = React.useState<{ [key: string]: number }>({});

  // Check role-based permissions
  const isEmployee = hasRole(user?.role, ['employee']);
  const isProjectManager = hasRole(user?.role, ['project_manager']);
  const isSuperAdmin = user?.role === 'super_admin';

  // Determine which records to show
  const displayRecords = getDisplayRecords();

  function getDisplayRecords(): AttendanceRecord[] {
    if (isSuperAdmin) return attendanceData; // Super Admin sees all
    if (isProjectManager) return attendanceData; // PM sees all for KPI (view-only likely)
    if (isEmployee && user?.id) {
      // Employee sees only their own
      return attendanceData.filter(record => record.employeeId === user.id);
    }
    return attendanceData;
  }

  const handleCheckIn = (recordId: string) => {
    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 5); // HH:MM format

    setAttendanceData(prev => prev.map(record => {
      if (record.id === recordId) {
        const updated = {
          ...record,
          checkIn: timeStr,
          workingHrs: calculateWorkingHours(timeStr, record.checkOut, record.breakTime),
          status: determineStatus(timeStr, record.checkOut, calculateWorkingHours(timeStr, record.checkOut, record.breakTime))
        };
        updated.extraHrs = calculateExtraHours(updated.workingHrs);
        return updated;
      }
      return record;
    }));

    // TODO: API call to save check-in timestamp
  };

  const handleCheckOut = (recordId: string) => {
    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 5);

    setAttendanceData(prev => prev.map(record => {
      if (record.id === recordId) {
        const updated = {
          ...record,
          checkOut: timeStr,
          workingHrs: calculateWorkingHours(record.checkIn, timeStr, record.breakTime),
          status: determineStatus(record.checkIn, timeStr, calculateWorkingHours(record.checkIn, timeStr, record.breakTime))
        };
        updated.extraHrs = calculateExtraHours(updated.workingHrs);
        return updated;
      }
      return record;
    }));

    // TODO: API call to save check-out timestamp
  };

  const handleBreakTimeChange = (recordId: string, minutes: number) => {
    setSelectedBreakTime(prev => ({
      ...prev,
      [recordId]: minutes
    }));

    setAttendanceData(prev => prev.map(record => {
      if (record.id === recordId) {
        const updated = {
          ...record,
          breakTime: minutes,
          workingHrs: calculateWorkingHours(record.checkIn, record.checkOut, minutes),
          status: determineStatus(record.checkIn, record.checkOut, calculateWorkingHours(record.checkIn, record.checkOut, minutes))
        };
        updated.extraHrs = calculateExtraHours(updated.workingHrs);
        return updated;
      }
      return record;
    }));

    // TODO: API call to save break time
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present':
        return { bg: '#d4edda', color: '#155724' };
      case 'Late':
        return { bg: '#fff3cd', color: '#856404' };
      case 'Absent':
        return { bg: '#f8d7da', color: '#721c24' };
      case 'Half-Day':
        return { bg: '#ffe6d5', color: '#d97706' };
      default:
        return { bg: '#e2e3e5', color: '#383d41' };
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ margin: '0 0 10px 0' }}>Attendance Tracking</h1>
        <p style={{ color: '#666', margin: 0 }}>
          {isEmployee && 'Check in and out, manage your break time'}
          {isProjectManager && 'View team attendance and performance metrics'}
          {isSuperAdmin && 'Attendance analytics for productivity and KPI calculation'}
        </p>
      </div>

      {/* Permission info */}
      {isProjectManager && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '15px', 
          background: '#e3f2fd', 
          borderRadius: '6px',
          fontSize: '14px',
          color: '#1976d2'
        }}>
          ✓ You can view team attendance and performance metrics
        </div>
      )}

      {isSuperAdmin && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '15px', 
          background: '#e8f5e9', 
          borderRadius: '6px',
          fontSize: '14px',
          color: '#2e7d32'
        }}>
          ✓ All attendance data for system analytics and KPI calculation (read-only)
        </div>
      )}

      {/* Quick Stats for Employee */}
      {isEmployee && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: '15px',
          marginBottom: '30px'
        }}>
          <div style={{
            padding: '15px',
            background: '#e8f5e9',
            borderRadius: '8px',
            textAlign: 'center',
            border: '1px solid #c8e6c9'
          }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#2e7d32', fontWeight: '600' }}>
              TODAY'S STATUS
            </p>
            <p style={{ 
              margin: 0, 
              fontSize: '18px', 
              fontWeight: 'bold',
              color: displayRecords[0]?.status === 'Present' ? '#2e7d32' : '#d97706'
            }}>
              {displayRecords[0]?.status || 'Absent'}
            </p>
          </div>
          <div style={{
            padding: '15px',
            background: '#f3e5f5',
            borderRadius: '8px',
            textAlign: 'center',
            border: '1px solid #e1bee7'
          }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#6a1b9a', fontWeight: '600' }}>
              WORKING HOURS
            </p>
            <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#6a1b9a' }}>
              {displayRecords[0]?.workingHrs.toFixed(1)}h
            </p>
          </div>
          <div style={{
            padding: '15px',
            background: '#fff3e0',
            borderRadius: '8px',
            textAlign: 'center',
            border: '1px solid #ffe0b2'
          }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#e65100', fontWeight: '600' }}>
              EXTRA HOURS
            </p>
            <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#e65100' }}>
              {displayRecords[0]?.extraHrs.toFixed(1)}h
            </p>
          </div>
        </div>
      )}

      {/* Attendance Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          background: '#fff',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          <thead>
            <tr style={{ background: '#f0f0f0', borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>Employee</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Check In</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Check Out</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Break (min)</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Working Hrs</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Extra Hrs</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
              {isEmployee && <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {displayRecords.map(record => {
              const statusColor = getStatusColor(record.status);
              const isToday = record.date === '2026-03-02';
              const canEdit = isEmployee && record.employeeId === user?.id;

              return (
                <tr key={record.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px'
                    }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: '#667eea',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '12px'
                      }}>
                        {record.employeeName.charAt(0)}
                      </div>
                      <span>{record.employeeName}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px' }}>{record.date}</td>
                  
                  {/* Check In */}
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {canEdit && !record.checkIn ? (
                      <button
                        onClick={() => handleCheckIn(record.id)}
                        style={{
                          background: '#22C55E',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        Check In
                      </button>
                    ) : (
                      <span style={{ fontWeight: '500', color: record.checkIn ? '#155724' : '#999' }}>
                        {record.checkIn || '-'}
                      </span>
                    )}
                  </td>
                  
                  {/* Check Out */}
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {canEdit && record.checkIn && !record.checkOut ? (
                      <button
                        onClick={() => handleCheckOut(record.id)}
                        style={{
                          background: '#EF4444',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        Check Out
                      </button>
                    ) : (
                      <span style={{ fontWeight: '500', color: record.checkOut ? '#155724' : '#999' }}>
                        {record.checkOut || '-'}
                      </span>
                    )}
                  </td>
                  
                  {/* Break Time */}
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {canEdit && record.checkIn ? (
                      <input
                        type="number"
                        min="0"
                        max="180"
                        value={selectedBreakTime[record.id] ?? record.breakTime}
                        onChange={(e) => handleBreakTimeChange(record.id, parseInt(e.target.value) || 0)}
                        style={{
                          width: '60px',
                          padding: '6px',
                          borderRadius: '4px',
                          border: '1px solid #ddd',
                          textAlign: 'center',
                          fontSize: '12px'
                        }}
                      />
                    ) : (
                      <span style={{ fontWeight: '500' }}>{record.breakTime}</span>
                    )}
                  </td>
                  
                  {/* Working Hours */}
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{ 
                      fontWeight: '600',
                      color: record.workingHrs >= STANDARD_SHIFT_HOURS ? '#22C55E' : '#F59E0B'
                    }}>
                      {record.workingHrs.toFixed(1)}h
                    </span>
                  </td>
                  
                  {/* Extra Hours */}
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{ 
                      fontWeight: '600',
                      color: record.extraHrs > 0 ? '#667eea' : '#999'
                    }}>
                      {record.extraHrs.toFixed(1)}h
                    </span>
                  </td>
                  
                  {/* Status */}
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      background: statusColor.bg,
                      color: statusColor.color,
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {record.status}
                    </span>
                  </td>
                  
                  {/* Actions for Employee */}
                  {isEmployee && (
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {canEdit && isToday ? (
                        <span style={{ fontSize: '12px', color: '#666' }}>
                          {record.checkOut ? 'Complete' : 'In Progress'}
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#999' }}>-</span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {displayRecords.length === 0 && (
        <div style={{
          marginTop: '30px',
          padding: '40px',
          textAlign: 'center',
          background: '#f9f9f9',
          borderRadius: '8px',
          color: '#666'
        }}>
          No attendance records available.
        </div>
      )}

      {/* Standards info */}
      <div style={{
        marginTop: '30px',
        padding: '15px',
        background: '#f0f7ff',
        borderRadius: '8px',
        fontSize: '13px',
        color: '#0c4a6e',
        borderLeft: '4px solid #0284c7'
      }}>
        <strong>Standard Shift Hours:</strong> {STANDARD_SHIFT_HOURS} hours/day<br />
        <strong>Status Calculation:</strong> Absent (no check-in) | Present/Late (based on check-in time) | Half-Day (&lt;4 hrs work)<br />
        <strong>Extra Hours:</strong> Working Hours - {STANDARD_SHIFT_HOURS} hours
      </div>
    </div>
  );
};
