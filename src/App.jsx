
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import ApplicantDashboard from './pages/ApplicantDashboard';
import Login from './pages/Login';
import OfficerDashboard from './pages/OfficerDashboard';
import Register from './pages/Register';
import { getDashboardPathForRole, readAuthSession } from './utils/auth';
import './App.css';

function ProtectedRoute({ allowedRoles, children }) {
  const auth = readAuthSession();
  const location = useLocation();

  if (!auth?.token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles && auth.role && !allowedRoles.includes(auth.role)) {
    return <Navigate to={getDashboardPathForRole(auth.role) || '/login'} replace />;
  }

  if (allowedRoles && !auth.role) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

function RedirectAuthenticatedUser() {
  const auth = readAuthSession();

  if (!auth?.token) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={getDashboardPathForRole(auth.role) || '/login'} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RedirectAuthenticatedUser />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/applicant"
          element={
            <ProtectedRoute allowedRoles={['APPLICANT']}>
              <ApplicantDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/officer"
          element={
            <ProtectedRoute allowedRoles={['OFFICER']}>
              <OfficerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
