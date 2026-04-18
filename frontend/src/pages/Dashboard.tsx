import React from 'react';
import { useAuth } from '../auth/AuthContext';
import './Dashboard.css';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // Role-based metrics
  const employeeMetrics = [
    { id: 1, title: 'Active Employee', value: '245', change: '+12%', color: '#22C55E', icon: '👤' },
    { id: 2, title: 'Total Employee', value: '1,234', change: '+5%', color: '#3B82F6', icon: '👥' },
    { id: 3, title: 'Total Task', value: '567', change: '+8%', color: '#F59E0B', icon: '✓' },
    { id: 4, title: 'Attendance', value: '94%', change: '+2%', color: '#8B5CF6', icon: '📅' },
  ];

  // Super Admin KPI Metrics
  const superAdminMetrics = [
    { id: 1, title: 'AI KPI Score', value: '87.5', change: '+3.2%', color: '#6366F1', icon: '🤖' },
    { id: 2, title: 'Productivity Index', value: '92%', change: '+5.1%', color: '#22C55E', icon: '📈' },
    { id: 3, title: 'Task Completion Rate', value: '78.4%', change: '+2.8%', color: '#F59E0B', icon: '✓' },
    { id: 4, title: 'Late Tasks Count', value: '23', change: '-4', color: '#EF4444', icon: '⚠️' },
  ];

  const statCards = user?.role === 'super_admin' ? superAdminMetrics : employeeMetrics;

  const departments = [
    { id: 1, name: 'HR Department', icon: '👥', employees: 24, lastUpdate: '2 hours ago' },
    { id: 2, name: 'IT Department', icon: '💻', employees: 45, lastUpdate: '1 hour ago' },
    { id: 3, name: 'Finance', icon: '💰', employees: 18, lastUpdate: '30 min ago' },
    { id: 4, name: 'Sales', icon: '📊', employees: 32, lastUpdate: '45 min ago' },
    { id: 5, name: 'Marketing', icon: '📢', employees: 15, lastUpdate: '1 hour ago' },
    { id: 6, name: 'Operations', icon: '⚙️', employees: 28, lastUpdate: '2 hours ago' },
  ];

  return (
    <div className="dashboard">
      {/* Role-based Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '28px' }}>Welcome, {user?.name}!</h1>
        <p style={{ color: '#666', margin: 0 }}>
          {user?.role === 'super_admin' 
            ? 'AI-Powered Insights & System Analytics' 
            : 'Your Tasks and Team Overview'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        {statCards.map((card) => (
          <div key={card.id} className="stat-card">
            <div className="stat-icon" style={{ color: card.color }}>
              {card.icon}
            </div>
            <div className="stat-content">
              <p className="stat-title">{card.title}</p>
              <h3 className="stat-value">{card.value}</h3>
              <p className="stat-change" style={{ color: card.color }}>
                {card.change}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Super Admin: AI Insights Section */}
      {user?.role === 'super_admin' && (
        <div className="section">
          <h2 className="section-title">📊 Productivity Trends</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px'
          }}>
            <div style={{
              padding: '20px',
              background: '#f0f9ff',
              borderRadius: '8px',
              border: '1px solid #bfdbfe'
            }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#1e40af' }}>Weekly Average</h3>
              <p style={{ margin: '0', fontSize: '24px', fontWeight: 'bold', color: '#1e40af' }}>78.4%</p>
              <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#3b82f6' }}>+2.8% from last week</p>
            </div>
            <div style={{
              padding: '20px',
              background: '#f0fdf4',
              borderRadius: '8px',
              border: '1px solid #bbf7d0'
            }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#166534' }}>On-Time Delivery</h3>
              <p style={{ margin: '0', fontSize: '24px', fontWeight: 'bold', color: '#166534' }}>92.1%</p>
              <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#22c55e' }}>+5.1% from last month</p>
            </div>
            <div style={{
              padding: '20px',
              background: '#fef2f2',
              borderRadius: '8px',
              border: '1px solid #fecaca'
            }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#991b1b' }}>Critical Issues</h3>
              <p style={{ margin: '0', fontSize: '24px', fontWeight: 'bold', color: '#991b1b' }}>7</p>
              <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#ef4444' }}>Require attention</p>
            </div>
          </div>
        </div>
      )}

      {/* Department Cards - Only for Employee/PM */}
      {user?.role !== 'super_admin' && (
        <div className="section">
          <h2 className="section-title">Departments</h2>
        <div className="department-grid">
          {departments.map((dept) => (
            <div key={dept.id} className="department-card">
              <div className="dept-icon">{dept.icon}</div>
              <h3 className="dept-name">{dept.name}</h3>
              <div className="dept-info">
                <p className="dept-employees">👥 {dept.employees} Employees</p>
                <p className="dept-update">Updated {dept.lastUpdate}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      )}

      {/* Super Admin: Historical Data */}
      {user?.role === 'super_admin' && (
        <div className="section">
          <h2 className="section-title">📈 Historical Task Completion</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '15px'
          }}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} style={{
                padding: '15px',
                background: '#f9fafb',
                borderRadius: '8px',
                textAlign: 'center',
                border: '1px solid #e5e7eb'
              }}>
                <p style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: '600', color: '#666' }}>{day}</p>
                <div style={{
                  width: '100%',
                  height: '40px',
                  background: '#e5e7eb',
                  borderRadius: '4px',
                  marginBottom: '8px',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${60 + Math.random() * 40}%`,
                    background: '#3b82f6',
                    transition: 'width 0.3s'
                  }}></div>
                </div>
                <p style={{ margin: 0, fontSize: '12px', fontWeight: 'bold', color: '#1f2937' }}>{60 + Math.floor(Math.random() * 40)}%</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
