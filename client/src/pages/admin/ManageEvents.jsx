import React, { useState, useEffect } from 'react';
import { eventService } from '../../services/api';
import {
  Calendar,
  Plus,
  Search,
  Users,
  Clock,
  MapPin,
  Trash2,
  X,
  ExternalLink,
  CheckCircle,
} from 'lucide-react';

const ManageEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAttendeesModal, setShowAttendeesModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);

  // Form State
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Workshop',
    venue: '',
    eventDate: '',
    startTime: '10:00',
    endTime: '13:00',
    registrationDeadline: '',
    maxParticipants: 100,
    bannerImageUrl: '',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await eventService.getAllEvents({
        search,
        category: categoryFilter || undefined,
        status: 'All',
      });
      if (res.data?.data) {
        setEvents(res.data.data.events || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [search, categoryFilter]);

  const handleOpenAttendees = async (event) => {
    setSelectedEvent(event);
    setShowAttendeesModal(true);
    try {
      setLoadingAttendees(true);
      const res = await eventService.getEventAttendees(event._id);
      if (res.data?.data) {
        setAttendees(res.data.data.attendees || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAttendees(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    try {
      setFormSubmitting(true);
      await eventService.createEvent(form);
      setShowCreateModal(false);
      setForm({
        title: '',
        description: '',
        category: 'Workshop',
        venue: '',
        eventDate: '',
        startTime: '10:00',
        endTime: '13:00',
        registrationDeadline: '',
        maxParticipants: 100,
        bannerImageUrl: '',
      });
      fetchEvents();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create event');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event and all associated student registrations?')) return;
    try {
      await eventService.deleteEvent(id);
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete event');
    }
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="toolbar">
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div className="search-box">
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search events by title, venue..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ width: '180px' }}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="Technical">Technical</option>
            <option value="Cultural">Cultural</option>
            <option value="Sports">Sports</option>
            <option value="Workshop">Workshop</option>
            <option value="Seminar">Seminar</option>
          </select>
        </div>

        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          <Plus size={16} /> Schedule Campus Event
        </button>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading campus events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="empty-state card">
          <Calendar size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 10px' }} />
          <h3>No Events Found</h3>
          <p>Schedule a new workshop or symposium to get started.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {events.map((evt) => (
            <div key={evt._id} className="card" style={{ display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden', marginBottom: 0 }}>
              {/* Event Image Banner */}
              <div style={{ height: '140px', background: '#1e293b', position: 'relative' }}>
                <img
                  src={evt.bannerImageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80'}
                  alt={evt.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <span
                  className="badge badge-medium"
                  style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(15, 23, 42, 0.85)', color: '#fff', border: 'none' }}
                >
                  {evt.category}
                </span>
              </div>

              {/* Event Details */}
              <div style={{ padding: '18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px', lineHeight: 1.3 }}>
                  {evt.title}
                </h4>

                <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '14px', flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {evt.description}
                </p>

                <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px 12px', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={13} style={{ color: 'var(--primary)' }} />
                    <strong>Date:</strong> {new Date(evt.eventDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={13} style={{ color: 'var(--primary)' }} />
                    <span>{evt.startTime} – {evt.endTime}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={13} style={{ color: 'var(--primary)' }} />
                    <span>{evt.venue}</span>
                  </div>
                </div>

                {/* Quota Progress */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    <span>Registered: {evt.currentRegistrationsCount} / {evt.maxParticipants}</span>
                    <span>{Math.round((evt.currentRegistrationsCount / evt.maxParticipants) * 100)}%</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.min(100, Math.round((evt.currentRegistrationsCount / evt.maxParticipants) * 100))}%`,
                        height: '100%',
                        background: 'var(--accent)',
                        borderRadius: '3px',
                      }}
                    ></div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                  <button
                    onClick={() => handleOpenAttendees(evt)}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, gap: '6px' }}
                  >
                    <Users size={14} /> Attendees ({evt.currentRegistrationsCount})
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(evt._id)}
                    className="btn btn-secondary btn-sm"
                    style={{ color: 'var(--danger)', padding: '6px 10px' }}
                    title="Delete Event"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE EVENT MODAL */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-title">Schedule New Campus Event</div>
              <button onClick={() => setShowCreateModal(false)} className="close-btn">
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '10px', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '12.5px' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit}>
              <div className="form-group">
                <label className="form-label">Event Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. MERNOVA Cloud & AI Hackathon"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="Workshop">Workshop</option>
                    <option value="Technical">Technical</option>
                    <option value="Seminar">Seminar</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Sports">Sports</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Venue / Hall</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Sir MV Auditorium"
                    value={form.venue}
                    onChange={(e) => setForm({ ...form, venue: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Event Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.eventDate}
                    onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input
                    type="time"
                    className="form-input"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input
                    type="time"
                    className="form-input"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Registration Deadline</label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.registrationDeadline}
                    onChange={(e) => setForm({ ...form, registrationDeadline: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Participant Quota (Max)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={form.maxParticipants}
                    onChange={(e) => setForm({ ...form, maxParticipants: e.target.value })}
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  placeholder="Outline topics covered, keynotes, eligibility, and prizes..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={formSubmitting}>
                  {formSubmitting ? 'Creating...' : 'Publish Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ATTENDEES ROSTER MODAL */}
      {showAttendeesModal && selectedEvent && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div>
                <div className="modal-title">Registered Participants</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{selectedEvent.title}</div>
              </div>
              <button onClick={() => setShowAttendeesModal(false)} className="close-btn">
                <X size={20} />
              </button>
            </div>

            {loadingAttendees ? (
              <div className="spinner-container" style={{ padding: '30px' }}>
                <div className="spinner"></div>
                <p style={{ color: 'var(--text-muted)', fontSize: '12.5px' }}>Retrieving attendee roster...</p>
              </div>
            ) : attendees.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '13px' }}>
                No students have registered for this event yet.
              </div>
            ) : (
              <div className="table-container" style={{ maxHeight: '380px' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Ticket Code</th>
                      <th>Student Name</th>
                      <th>Registration #</th>
                      <th>Department</th>
                      <th>Date Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendees.map((att) => (
                      <tr key={att._id}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>
                          {att.ticketCode}
                        </td>
                        <td style={{ fontWeight: 600 }}>{att.studentId?.fullName}</td>
                        <td>{att.studentId?.registrationNumber || 'N/A'}</td>
                        <td style={{ fontSize: '12px' }}>{att.studentId?.department}</td>
                        <td style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                          {new Date(att.registrationDate).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageEvents;

