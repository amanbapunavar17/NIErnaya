import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';

// Public 3D environment
import { HeroCanvas } from './three/scenes/HeroCanvas';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
// Layouts
import { StudentLayout } from './layouts/StudentLayout';
import { FacultyLayout } from './layouts/FacultyLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { TeamRegistrationPage } from './pages/student/TeamRegistrationPage';
import { SubmissionPage } from './pages/student/SubmissionPage';

// Faculty Pages
import { FacultyDashboard } from './pages/faculty/FacultyDashboard';
import { FacultyTeamsPage } from './pages/faculty/FacultyTeamsPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminTeamsPage } from './pages/admin/AdminTeamsPage';
import { AdminStudentsPage } from './pages/admin/AdminStudentsPage';
import { AdminFacultyPage } from './pages/admin/AdminFacultyPage';
import { AdminAllocationPage } from './pages/admin/AdminAllocationPage';
import { AdminPhase1FormsPage } from './pages/admin/AdminPhase1FormsPage';
import { AdminSubmissionsPage } from './pages/admin/AdminSubmissionsPage';
import { AdminPhasesPage } from './pages/admin/AdminPhasesPage';
import { AdminCMSPage } from './pages/admin/AdminCMSPage';
import { AdminResultsPage } from './pages/admin/AdminResultsPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';
import { AdminCertificatesPage } from './pages/admin/AdminCertificatesPage';
import { AdminAuditPage } from './pages/admin/AdminAuditPage';

/**
 * Public landing page gets the persistent 3D environment.
 *
 * The 3D scene:
 * - exists only on the public landing page
 * - remains behind the complete landing page
 * - does not interfere with scrolling or clicking
 * - does not appear inside student/faculty/admin portals
 */
const AppContent: React.FC = () => {
  const location = useLocation();

  const isPublicLanding = location.pathname === '/';

  return (
    <div className="app-shell">
      {isPublicLanding && (
        <div
          className="global-3d-background"
          aria-hidden="true"
        >
          <HeroCanvas />
        </div>
      )}

      <div
        className="global-atmosphere"
        aria-hidden="true"
      />

      <div className="app-content">
        <Routes>

          {/* =====================================================
              PUBLIC WEBSITE
          ====================================================== */}

          <Route
            path="/"
            element={<LandingPage />}
          />

          {/* =====================================================
              AUTHENTICATION
          ====================================================== */}

          {/* Existing account login */}
          <Route
            path="/login"
            element={<LoginPage />}
          />

          {/* New team leader account */}
          <Route
            path="/register"
            element={<RegisterPage />}
          />

          {/* Forgot password */}
          <Route
            path="/forgot-password"
            element={<ForgotPasswordPage />}
          />

          {/* Set new password after recovery email */}
          <Route
            path="/reset-password"
            element={<ResetPasswordPage />}
          />

          {/* =====================================================
              STUDENT / TEAM LEADER PORTAL
          ====================================================== */}

          <Route
            path="/student"
            element={<StudentLayout />}
          >
            <Route
              index
              element={
                <Navigate
                  to="/student/dashboard"
                  replace
                />
              }
            />

            <Route
              path="dashboard"
              element={<StudentDashboard />}
            />

            <Route
              path="team"
              element={<TeamRegistrationPage />}
            />

            <Route
              path="submission"
              element={<SubmissionPage />}
            />
          </Route>

          {/* =====================================================
              FACULTY PORTAL
          ====================================================== */}

          <Route
            path="/faculty"
            element={<FacultyLayout />}
          >
            <Route
              index
              element={
                <Navigate
                  to="/faculty/dashboard"
                  replace
                />
              }
            />

            <Route
              path="dashboard"
              element={<FacultyDashboard />}
            />

            <Route
              path="teams"
              element={<FacultyTeamsPage />}
            />
          </Route>

          {/* =====================================================
              ADMIN CONTROL ROOM
          ====================================================== */}

          <Route
            path="/admin"
            element={<AdminLayout />}
          >
            <Route
              index
              element={
                <Navigate
                  to="/admin/dashboard"
                  replace
                />
              }
            />

            <Route
              path="dashboard"
              element={<AdminDashboard />}
            />

            <Route
              path="teams"
              element={<AdminTeamsPage />}
            />

            <Route
              path="students"
              element={<AdminStudentsPage />}
            />

            <Route
              path="faculty"
              element={<AdminFacultyPage />}
            />

            <Route
              path="allocation"
              element={<AdminAllocationPage />}
            />

            <Route
              path="submissions"
              element={<AdminSubmissionsPage />}
            />

            <Route
              path="phases"
              element={<AdminPhasesPage />}
            />

            <Route
              path="phase1-forms"
              element={<AdminPhase1FormsPage />}
            />

            <Route
              path="content"
              element={<AdminCMSPage />}
            />

            <Route
              path="results"
              element={<AdminResultsPage />}
            />

            <Route
              path="reports"
              element={<AdminReportsPage />}
            />

            <Route
              path="certificates"
              element={<AdminCertificatesPage />}
            />

            <Route
              path="audit"
              element={<AdminAuditPage />}
            />
          </Route>

          {/* =====================================================
              UNKNOWN ROUTES
          ====================================================== */}

          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />

        </Routes>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;