import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';

// Auth Pages
import Login from './pages/auth/Login';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageComplaints from './pages/admin/ManageComplaints';
import ComplaintDetails from './pages/admin/ComplaintDetails';
import ManageLocations from './pages/admin/ManageLocations';
import ManageEvents from './pages/admin/ManageEvents';
import ManageBookings from './pages/admin/ManageBookings';
import ManageLostFound from './pages/admin/ManageLostFound';
import ManageAnnouncements from './pages/admin/ManageAnnouncements';
import ManageUsers from './pages/admin/ManageUsers';
import Analytics from './pages/admin/Analytics';

// Faculty Pages
import FacultyDashboard from './pages/faculty/FacultyDashboard';

// Root Redirect helper
const RootRedirect = () => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="spinner-container" style={{ height: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role === 'admin') return <Navigate to="/admin" replace />;
  if (role === 'faculty') return <Navigate to="/faculty" replace />;
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RootRedirect />} />

          {/* Protected Administrator Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/complaints" element={<ManageComplaints />} />
              <Route path="/admin/complaints/:id" element={<ComplaintDetails />} />
              <Route path="/admin/locations" element={<ManageLocations />} />
              <Route path="/admin/events" element={<ManageEvents />} />
              <Route path="/admin/bookings" element={<ManageBookings />} />
              <Route path="/admin/lost-found" element={<ManageLostFound />} />
              <Route path="/admin/announcements" element={<ManageAnnouncements />} />
              <Route path="/admin/users" element={<ManageUsers />} />
              <Route path="/admin/analytics" element={<Analytics />} />
            </Route>
          </Route>

          {/* Protected Faculty Routes */}
          <Route element={<ProtectedRoute allowedRoles={['faculty', 'admin']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/faculty" element={<FacultyDashboard />} />
              <Route path="/faculty/events" element={<ManageEvents />} />
              <Route path="/faculty/complaints" element={<ManageComplaints />} />
              <Route path="/faculty/bookings" element={<ManageBookings />} />
              <Route path="/faculty/announcements" element={<ManageAnnouncements />} />
            </Route>
          </Route>

          {/* Fallback Catch-All */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

