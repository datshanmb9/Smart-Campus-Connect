import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="spinner-container" style={{ height: '100vh' }}>
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 500 }}>
          Authenticating Smart Campus Connect session...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // If faculty tries accessing admin routes, redirect to faculty dashboard
    if (role === 'faculty') {
      return <Navigate to="/faculty" replace />;
    }
    // If admin tries accessing student-only routes, redirect to admin
    if (role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;

