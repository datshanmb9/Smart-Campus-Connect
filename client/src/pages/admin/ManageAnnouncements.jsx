import React, { useState, useEffect } from 'react';
import { announcementService } from '../../services/api';
import {
  Megaphone,
  Plus,
  Search,
  Trash2,
  AlertTriangle,
  Users,
  X,
  Pin,
  Calendar,
} from 'lucide-react';

const ManageAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [form, setForm] = useState({
    title: '',
    content: '',
    category: 'General',
    targetAudience: 'All',
    isImportant: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await announcementService.getAllAnnouncements({ search });
      if (res.data?.data) {
        setAnnouncements(res.data.data.announcements || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [search]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    try {
      setSubmitting(true);
      await announcementService.createAnnouncement(form);
      setShowCreateModal(false);
      setForm({
        title: '',
        content: '',
        category: 'General',
        targetAudience: 'All',
        isImportant: false,
      });
      fetchAnnouncements();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to publish announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this campus announcement?')) return;
    try {
      await announcementService.deleteAnnouncement(id);
      fetchAnnouncements();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete announcement');
    }
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-box">
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search circulars and notices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          <Plus size={16} /> Publish Circular / Notice
        </button>
      </div>

      {/* Announcements List */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Megaphone size={18} style={{ color: 'var(--primary)' }} />
            Official University Circulars ({announcements.length})
          </div>
        </div>

        {loading ? (
          <div className="spinner-container">
            <div className="spinner"></div>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading announcements...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="empty-state">
            <Megaphone size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 10px' }} />
            <h3>No Announcements Published</h3>
            <p>Publish a notice for students or faculty members.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {announcements.map((item) => (
              <div
                key={item._id}
                style={{
                  padding: '16px 18px',
                  borderRadius: 'var(--radius-md)',
                  border: item.isImportant ? '1.5px solid #fca5a5' : '1px solid var(--border-color)',
                  background: item.isImportant ? '#fffbfb' : '#fff',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '16px',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    {item.isImportant && (
                      <span className="badge badge-urgent" style={{ gap: '3px' }}>
                        <Pin size={11} /> Important
                      </span>
                    )}
                    <span className="badge badge-medium">{item.category}</span>
                    <span
                      style={{
                        fontSize: '11px',
                        background: '#f1f5f9',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        color: 'var(--text-muted)',
                        fontWeight: 600,
                      }}
                    >
                      Audience: {item.targetAudience}
                    </span>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-light)', marginLeft: 'auto' }}>
                      {new Date(item.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '15.5px', fontWeight: 800, color: 'var(--secondary)', marginBottom: '6px' }}>
                    {item.title}
                  </h4>

                  <p style={{ fontSize: '13px', color: 'var(--text-main)', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                    {item.content}
                  </p>

                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '8px' }}>
                    Published by: <strong>{item.author?.fullName || 'Campus Admin'}</strong> ({item.author?.department})
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(item._id)}
                  className="btn btn-secondary btn-sm"
                  style={{ color: 'var(--danger)', padding: '6px 8px', alignSelf: 'center' }}
                  title="Delete Circular"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE ANNOUNCEMENT MODAL */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-title">Publish University Notice</div>
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
                <label className="form-label">Notice Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Schedule for End-Semester MCA Project Defense"
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
                    <option value="General">General</option>
                    <option value="Academic">Academic</option>
                    <option value="Examinations">Examinations</option>
                    <option value="Events">Events</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Target Audience</label>
                  <select
                    className="form-select"
                    value={form.targetAudience}
                    onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                  >
                    <option value="All">All Campus Members</option>
                    <option value="Students">Students Only</option>
                    <option value="Faculty">Faculty Only</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Circular Content</label>
                <textarea
                  className="form-textarea"
                  rows="4"
                  placeholder="Enter notice text, schedule details, and instructions..."
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  required
                ></textarea>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <input
                  type="checkbox"
                  id="isImportant"
                  checked={form.isImportant}
                  onChange={(e) => setForm({ ...form, isImportant: e.target.checked })}
                  style={{ width: '16px', height: '16px' }}
                />
                <label htmlFor="isImportant" style={{ fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  Highlight as Urgent / Important Announcement
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Publishing...' : 'Publish Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageAnnouncements;

