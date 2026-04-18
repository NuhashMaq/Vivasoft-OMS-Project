import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { Layout } from './layout/Layout';

import { LoginPage } from './pages/login/LoginPage';
import { Dashboard } from './pages/Dashboard';
 

import { Employees } from './pages/employees/Employees';

import { ProjectDetails } from './pages/projects/ProjectDetails';


import { Projects } from './pages/projects/Projects';
import { ReportingPage } from './pages/Reporting';
import { KpiPage } from './pages/Kpi';
import { WikiPage } from './pages/Wiki';
import { Tasks } from './pages/Tasks';
import { DailyUpdates } from './pages/DailyUpdates';
import { Attendance } from './pages/Attendance';

import './styles.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={<Navigate to="/" replace />}
          />

          <Route
            path="/employees"
            element={
              <ProtectedRoute>
                <Layout>
                  <Employees />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <Layout>
                  <Projects />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/projects/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <ProjectDetails />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/tasks"
            element={
              <ProtectedRoute>
                <Layout>
                  <Tasks />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/daily-updates"
            element={
              <ProtectedRoute>
                <Layout>
                  <DailyUpdates />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/attendance"
            element={
              <ProtectedRoute>
                <Layout>
                  <Attendance />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/reporting"
            element={
              <ProtectedRoute>
                <Layout>
                  <ReportingPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports"
            element={<Navigate to="/reporting" replace />}
          />

          <Route
            path="/kpi"
            element={
              <ProtectedRoute>
                <Layout>
                  <KpiPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/wiki"
            element={
              <ProtectedRoute>
                <Layout>
                  <WikiPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/ai-wiki"
            element={<Navigate to="/wiki" replace />}
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;