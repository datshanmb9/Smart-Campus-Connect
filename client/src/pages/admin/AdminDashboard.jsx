import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  analyticsService,
  complaintService,
  eventService,
} from '../../services/api';
import {
  Users,
  AlertCircle,
  Calendar,
  Clock,
  CheckCircle2,
  Hourglass,
  ArrowRight,
  TrendingUp,
  MapPin,
  Sparkles,
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, complaintsRes, eventsRes] = await Promise.all([
        analyticsService.getAdminStats(),
        complaintService.getAllComplaints({ limit: 5 }),
        eventService.getAllEvents({ limit: 4 }),
      ]);

      if (statsRes.data?.data) {
        setStats(statsRes.data.data);
      }
      if (complaintsRes.data?.data) {
        setRecentComplaints(complaintsRes.data.data.complaints || []);
      }
      if (eventsRes.data?.data) {
        setUpcomingEvents(eventsRes.data.data.events || []);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch real-time dashboard data from MongoDB Atlas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          Loading real-time campus metrics from MongoDB Atlas...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ borderColor: 'var(--danger-border)', background: 'var(--danger-bg)' }}>
        <p style={{ color: 'var(--danger)', fontWeight: 600 }}>{error}</p>
        <button onClick={fetchDashboardData} className="btn btn-secondary btn-sm" style={{ marginTop: '10px' }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Top Banner / Welcome */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '24px 28px',
          color: '#fff',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.15)', padding: '3px 10px', borderRadius: '20px', fontSize: '11.5px', fontWeight: 600, marginBottom: '8px' }}>
            <Sparkles size={13} /> Active Cluster: SmartCampusConnect (MongoDB Atlas)
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.3px' }}>
            Campus Management Command Center
          </h2>
          <p style={{ fontSize: '13px', color: '#bfdbfe', maxWidth: '600px', marginTop: '3px' }}>
            Live triage of QR-based student issue tickets, seminar hall reservations, and campus events across Presidency University.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/admin/locations" className="btn btn-secondary btn-sm" style={{ background: '#fff', color: '#1e3a8a', border: 'none', fontWeight: 700 }}>
            <MapPin size={15} /> Add Campus Location
          </Link>
          <Link to="/admin/complaints" className="btn btn-primary btn-sm" style={{ background: '#3b82f6', border: 'none', fontWeight: 700 }}>
            Triage Complaints
          </Link>
        </div>
      </div>

      {/* Notice Banner for Pending Student Registrations */}
      {Boolean(stats?.users?.pendingStudents) && (
        <div
          style={{
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            border: '1px solid #fde68a',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 22px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                background: '#fef3c7',
                border: '1px solid #fde68a',
                borderRadius: '50%',
                width: '42px',
                height: '42px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Clock size={22} color="#b45309" />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '15px', color: '#92400e', fontWeight: 800 }}>
                {stats.users.pendingStudents} Student Registration{stats.users.pendingStudents > 1 ? 's' : ''} Awaiting Admin Approval
              </h4>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#b45309' }}>
                New student accounts cannot log in until approved. Verify university roll numbers and activate their profiles.
              </p>
            </div>
          </div>
          <Link
            to="/admin/users?tab=pending"
            className="btn btn-sm"
            style={{
              background: '#d97706',
              color: '#fff',
              border: 'none',
              fontWeight: 700,
              padding: '8px 18px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(217, 119, 6, 0.3)',
            }}
          >
            Review & Approve Students &rarr;
          </Link>
        </div>
      )}

      {/* KPI Stat Cards (Real MongoDB Atlas Data) */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats?.users?.totalStudents ?? 0}</div>
            <div className="stat-label">Enrolled Students</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats?.users?.totalFaculty ?? 0}</div>
            <div className="stat-label">Faculty Members</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon amber">
            <AlertCircle size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats?.complaints?.pending ?? 0}</div>
            <div className="stat-label">Pending Issues</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats?.complaints?.resolved ?? 0}</div>
            <div className="stat-label">Resolved Tickets</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">
            <Calendar size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats?.events?.upcoming ?? 0}</div>
            <div className="stat-label">Upcoming Events</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon rose">
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats?.bookings?.pending ?? 0}</div>
            <div className="stat-label">Pending Hall Bookings</div>
          </div>
        </div>
      </div>

      {/* Split Section: Complaints Triage & Events */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Left Column: Recent QR-Logged Complaints */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <AlertCircle size={18} style={{ color: 'var(--accent)' }} />
              Recent Smart QR Campus Complaints
            </div>
            <Link to="/admin/complaints" className="btn btn-secondary btn-sm">
              View All ({stats?.complaints?.total ?? 0}) <ArrowRight size={14} />
            </Link>
          </div>

          {recentComplaints.length === 0 ? (
            <div className="empty-state">
              <CheckCircle2 size={40} style={{ color: 'var(--success)', margin: '0 auto 10px' }} />
              <h3>All Systems Operational</h3>
              <p>No complaints are currently pending resolution.</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Ticket</th>
                    <th>Category</th>
                    <th>Venue / Room</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentComplaints.map((item) => (
                    <tr key={item._id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>
                        {item.ticketNumber}
                      </td>
                      <td style={{ fontWeight: 600 }}>{item.category}</td>
                      <td>
                        {item.locationId ? (
                          <span>
                            {item.locationId.roomNumber} ({item.locationId.block})
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>
                            {item.manualLocation?.roomNumber || 'Campus Landmark'}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`badge badge-${item.priority.toLowerCase()}`}>
                          {item.priority}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${item.status.toLowerCase().replace(/\s+/g, '')}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>
                        <Link
                          to={`/admin/complaints/${item._id}`}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px', fontSize: '11.5px' }}
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Upcoming Events & Quick Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Resolution Velocity Card */}
          <div className="card" style={{ marginBottom: 0 }}>
            <div className="card-header">
              <div className="card-title">
                <TrendingUp size={18} style={{ color: 'var(--success)' }} />
                Resolution Velocity
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '32px', fontWeight: 800, color: 'var(--success)' }}>
                {stats?.complaints?.resolutionRate || '100%'}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>of total complaints closed</span>
            </div>
            <div
              style={{
                width: '100%',
                height: '8px',
                background: '#e2e8f0',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: stats?.complaints?.resolutionRate || '100%',
                  height: '100%',
                  background: 'var(--success)',
                  borderRadius: '4px',
                  transition: 'width 0.5s ease',
                }}
              ></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '8px' }}>
              <span>{stats?.complaints?.resolved ?? 0} Resolved</span>
              <span>{stats?.complaints?.pending ?? 0} Open</span>
            </div>
          </div>

          {/* Upcoming Events Mini-List */}
          <div className="card" style={{ flex: 1, marginBottom: 0 }}>
            <div className="card-header">
              <div className="card-title">
                <Calendar size={18} style={{ color: 'var(--primary)' }} />
                Upcoming Events
              </div>
              <Link to="/admin/events" className="btn btn-secondary btn-sm" style={{ padding: '3px 8px', fontSize: '11px' }}>
                All
              </Link>
            </div>

            {upcomingEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '12.5px' }}>
                No events scheduled.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {upcomingEvents.map((evt) => (
                  <div
                    key={evt._id}
                    style={{
                      padding: '10px 12px',
                      background: '#f8fafc',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '3px' }}>
                      {evt.title}
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{evt.venue}</span>
                      <span>{new Date(evt.eventDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

