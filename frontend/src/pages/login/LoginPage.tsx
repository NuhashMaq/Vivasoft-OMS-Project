import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import './LoginPage.css';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string>('');

  const demoProjects = [
    'Northwind Launchpad',
    'Retail Ops Sprint',
    'KPI Dashboard Refresh',
  ];

  const demoTasks = [
    'Finalize Q2 rollout scope',
    'Backlog grooming for mobile sync',
    'QA: timezone + daily updates',
  ];

  const demoEmployees = [
    'Nadia Islam — PM',
    'Rafi Ahmed — Engineer',
    'Maya Chowdhury — Analyst',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!email || !password) {
      setLocalError('Please enter both email and password');
      return;
    }

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setLocalError(errorMsg);
    }
  };

  const displayError = localError || error;

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1>Sign in</h1>
          </div>

          {displayError && (
            <div className="error-banner">
              {displayError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="name@oms2.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="signup-panel">
            <span>Need an account?</span>
            <a className="signup-button" href="mailto:superadmin@oms2.local">
              Request Access
            </a>
          </div>

          <p className="login-footer">
            Demo Credentials:<br/>
            <strong>superadmin@oms2.local</strong> / <strong>password</strong><br/>
            <strong>admin@oms2.local</strong> / <strong>password</strong><br/>
            <strong>demo.employee.01@oms2.local</strong> / <strong>password</strong>
          </p>
        </div>
        <div className="demo-panel">
          <div className="demo-card">
            <h2>Demo Projects</h2>
            <ul>
              {demoProjects.map((project) => (
                <li key={project}>{project}</li>
              ))}
            </ul>
          </div>
          <div className="demo-card">
            <h2>Demo Tasks</h2>
            <ul>
              {demoTasks.map((task) => (
                <li key={task}>{task}</li>
              ))}
            </ul>
          </div>
          <div className="demo-card">
            <h2>Demo Employees</h2>
            <ul>
              {demoEmployees.map((employee) => (
                <li key={employee}>{employee}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
