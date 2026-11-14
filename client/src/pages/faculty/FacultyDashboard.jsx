import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  analyticsService,
  announcementService,
  eventService,
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Calendar,
  Megaphone,
  Clock,
  Plus,
  ArrowRight,
  Sparkles,
  BookOpen,
} from 'lucide-react';

const FacultyDashboard = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFacultyData = async () => {
    try {
      setLoading(true);
      const [sumRes, annRes, evtRes] = await Promise.all([
        analyticsService.getFacultySummary(),
        announcementService.getAllAnnouncements({ limit: 4 }),
        eventService.getAllEvents({ limit: 4 }),
      ]);

      if (sumRes.data?.data) setSummary(sumRes.data.data);
      if (annRes.data?.data) setAnnouncements(annRes.data.data.announcements || []);
      if (evtRes.data?.data) setEvents(evtRes.data.data.events || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacultyData();
  }, []);

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading Faculty Portal...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
          color: '#fff',
          borderRadius: 'var(--radius-xl)',
          padding: '24px 28px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: '20px', fontSize: '11.5px', fontWeight: 600, marginBottom: '8px' }}>
            <Sparkles size={13} /> {user?.department || 'Academic Faculty'}
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800 }}>Welcome, {user?.fullName || 'Professor'}!</h2>
          <p style={{ fontSize: '13px', color: '#eff6ff', maxWidth: '600px', marginTop: '3px' }}>
            Coordinate academic events, review departmental notices, and manage laboratory reservations across Presidency University.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/faculty/events" className="btn btn-secondary btn-sm" style={{ background: '#fff', color: '#1e3a8a', border: 'none', fontWeight: 700 }}>
            <Plus size={15} /> Create Workshop
          </Link>
          <Link to="/faculty/bookings" className="btn btn-primary btn-sm" style={{ background: '#1e293b', border: 'none', fontWeight: 700 }}>
            <Clock size={15} /> Reserve Hall
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <Calendar size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{summary?.myEvents ?? 0}</div>
            <div className="stat-label">Events Organized by You</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{summary?.myBookings ?? 0}</div>
            <div className="stat-label">Your Facility Bookings</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon amber">
            <Megaphone size={24} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{summary?.totalAnnouncements ?? 0}</div>
            <div className="stat-label">Active Campus Circulars</div>
          </div>
        </div>
      </div>

      {/* Split Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        {/* Left Column: Official Notices */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Megaphone size={18} style={{ color: 'var(--primary)' }} />
              Official Campus Circulars
            </div>
            <Link to="/faculty/announcements" className="btn btn-secondary btn-sm">
              View All <ArrowRight size={14} />
            </Link>
          </div>

          {announcements.length === 0 ? (
            <div className="empty-state">No notices for your department.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {announcements.map((item) => (
                <div
                  key={item._id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    background: item.isImportant ? '#fffbfb' : '#f8fafc',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span className="badge badge-medium">{item.category}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '3px' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {item.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Campus Events */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Calendar size={18} style={{ color: 'var(--accent)' }} />
              Upcoming Academic Events
            </div>
            <Link to="/faculty/events" className="btn btn-secondary btn-sm">
              All <ArrowRight size={14} />
            </Link>
          </div>

          {events.length === 0 ? (
            <div className="empty-state">No scheduled events.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {events.map((evt) => (
                <div
                  key={evt._id}
                  style={{
                    padding: '12px',
                    background: '#f8fafc',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '2px' }}>
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
  );
};

export default FacultyDashboard;

