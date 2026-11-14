import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const getHeaderInfo = (pathname) => {
  if (pathname === '/admin') return { title: 'Executive Operations Dashboard', subtitle: 'Real-time campus infrastructure & service analytics' };
  if (pathname.includes('/admin/complaints')) return { title: 'Campus Issue & Complaint Triage', subtitle: 'Smart QR-reported classroom and facility maintenance tickets' };
  if (pathname.includes('/admin/locations')) return { title: 'Campus Locations & QR Codes', subtitle: 'Manage academic blocks, lecture halls, and physical QR codes' };
  if (pathname.includes('/admin/events')) return { title: 'Campus Events & Workshops', subtitle: 'Manage conferences, hackathons, and participant quotas' };
  if (pathname.includes('/admin/bookings')) return { title: 'Resource & Venue Bookings', subtitle: 'Approve seminar halls, meeting rooms, and conflict checks' };
  if (pathname.includes('/admin/lost-found')) return { title: 'Lost & Found Recovery Network', subtitle: 'Review reported items, claims, and returned assets' };
  if (pathname.includes('/admin/announcements')) return { title: 'University Circulars & Notices', subtitle: 'Publish campus-wide or role-scoped announcements' };
  if (pathname.includes('/admin/users')) return { title: 'Campus User Directory & Approvals', subtitle: 'Manage campus users, verify admissions, and approve registered students' };
  if (pathname.includes('/admin/analytics')) return { title: 'Campus Performance Analytics', subtitle: 'Service level agreements, resolution velocity, and trends' };

  if (pathname === '/faculty') return { title: 'Faculty Academic Portal', subtitle: 'Departmental activities, schedules, and event monitoring' };
  if (pathname.includes('/faculty/events')) return { title: 'Department Events Management', subtitle: 'Create workshops, technical talks, and review student rosters' };
  if (pathname.includes('/faculty/complaints')) return { title: 'Departmental Maintenance Status', subtitle: 'Monitor lab and classroom grievances' };
  if (pathname.includes('/faculty/bookings')) return { title: 'Faculty Venue Reservations', subtitle: 'Reserve halls for academic sessions' };
  if (pathname.includes('/faculty/announcements')) return { title: 'Academic Circulars & Circulars', subtitle: 'Official notices for students and staff' };

  return { title: 'Smart Campus Connect', subtitle: 'Presidency University' };
};

const DashboardLayout = () => {
  const location = useLocation();
  const { title, subtitle } = getHeaderInfo(location.pathname);

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Navbar title={title} subtitle={subtitle} />
        <main className="page-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

