import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  AlertCircle,
  QrCode,
  Calendar,
  Clock,
  HelpCircle,
  Megaphone,
  Users,
  BarChart3,
  LogOut,
  GraduationCap,
} from 'lucide-react';

const Sidebar = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const adminNav = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Complaints', path: '/admin/complaints', icon: AlertCircle },
    { label: 'Locations & QR', path: '/admin/locations', icon: QrCode },
    { label: 'Events', path: '/admin/events', icon: Calendar },
    { label: 'Resource Booking', path: '/admin/bookings', icon: Clock },
    { label: 'Lost & Found', path: '/admin/lost-found', icon: HelpCircle },
    { label: 'Announcements', path: '/admin/announcements', icon: Megaphone },
    { label: 'User Directory & Approvals', path: '/admin/users', icon: Users },
    { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
  ];

  const facultyNav = [
    { label: 'Faculty Dashboard', path: '/faculty', icon: LayoutDashboard },
    { label: 'Campus Events', path: '/faculty/events', icon: Calendar },
    { label: 'Student Complaints', path: '/faculty/complaints', icon: AlertCircle },
    { label: 'Facility Bookings', path: '/faculty/bookings', icon: Clock },
    { label: 'Announcements', path: '/faculty/announcements', icon: Megaphone },
  ];

  const links = role === 'admin' ? adminNav : facultyNav;

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo-icon">
          <GraduationCap size={22} />
        </div>
        <div>
          <div className="sidebar-title">Smart Campus</div>
          <div className="sidebar-subtitle">MERNOVA X 2026</div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        <div className="sidebar-category">
          {role === 'admin' ? 'Administration' : 'Faculty Portal'}
        </div>
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin' || item.path === '/faculty'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User & Logout Footer */}
      <div className="sidebar-footer">
        <div className="user-snippet">
          <img
            src={user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
            alt={user?.fullName || 'User'}
            className="user-avatar"
          />
          <div className="user-info">
            <div className="user-name">{user?.fullName || 'User'}</div>
            <span className="user-role-badge">{role}</span>
          </div>
          <button
            onClick={handleLogout}
            title="Log Out"
            className="btn btn-secondary btn-sm"
            style={{ padding: '6px', background: 'transparent', border: 'none', color: '#94a3b8' }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

