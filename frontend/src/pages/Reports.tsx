import React from 'react';
import { useAuth } from '../auth/AuthContext';
import { hasPermission } from '../auth/rbac';

export const Reports: React.FC = () => {
  const { user } = useAuth();
  const canGenerateReports = hasPermission(user?.role, 'canGenerateReports');

  const reports = [
    { 
      id: 1, 
      title: 'Employee Productivity Report', 
      type: 'Productivity',
      generatedDate: '2026-03-01',
      status: 'Ready'
    },
    { 
      id: 2, 
      title: 'Project Progress Summary', 
      type: 'Project',
      generatedDate: '2026-02-28',
      status: 'Ready'
    },
    { 
      id: 3, 
      title: 'Task Completion Analysis', 
      type: 'Tasks',
      generatedDate: '2026-02-25',
      status: 'Ready'
    },
    { 
      id: 4, 
      title: 'Team Performance Metrics', 
      type: 'Performance',
      generatedDate: '2026-02-20',
      status: 'Ready'
    },
  ];

  const stats = [
    { label: 'Total Reports', value: '24', icon: '📊' },
    { label: 'This Month', value: '8', icon: '📈' },
    { label: 'Pending', value: '2', icon: '⏳' },
    { label: 'Ready', value: '22', icon: '✓' },
  ];

  const handleGenerateReport = () => {
    // FR-013: Only Super Admin can generate reports
    if (!canGenerateReports) {
      alert('You do not have permission to generate reports.');
      return;
    }
    alert('Generate new report functionality (to be implemented)');
  };

  return (
    <div>
      <h2>Reports Dashboard</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        {/* FR-013: Super Admin can view all data and generate AI/KPI reports */}
        Generate and view system-wide reports and analytics
      </p>

      {/* FR-013: Show permission notice */}
      {user?.role === 'super_admin' && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '15px', 
          background: '#e8f5e9', 
          borderRadius: '6px',
          fontSize: '14px',
          color: '#2e7d32'
        }}>
          ✓ As Super Admin, you can view all data and generate AI/KPI reports across the entire system.
        </div>
      )}

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '20px',
        marginBottom: '40px'
      }}>
        {stats.map((stat, idx) => (
          <div key={idx} style={{
            background: '#fff',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>{stat.icon}</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>{stat.value}</div>
            <div style={{ fontSize: '14px', color: '#666' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0 }}>Available Reports</h3>
        {/* FR-013: Only Super Admin can generate reports */}
        {canGenerateReports && (
          <button 
            onClick={handleGenerateReport}
            style={{
              background: '#667eea',
              color: '#fff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            + Generate New Report
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gap: '15px' }}>
        {reports.map(report => (
          <div key={report.id} style={{
            background: '#fff',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 8px 0' }}>{report.title}</h4>
              <div style={{ fontSize: '14px', color: '#666' }}>
                <span style={{ 
                  background: '#e3f2fd', 
                  padding: '4px 10px', 
                  borderRadius: '4px',
                  marginRight: '10px'
                }}>
                  {report.type}
                </span>
                <span>Generated: {report.generatedDate}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={{
                background: '#f0f0f0',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}>
                👁️ View
              </button>
              <button style={{
                background: '#667eea',
                color: '#fff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}>
                ⬇️ Download
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
