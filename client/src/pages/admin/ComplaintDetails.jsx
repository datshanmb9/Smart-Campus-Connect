import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { complaintService } from '../../services/api';
import {
  AlertCircle,
  ArrowLeft,
  UserCheck,
  CheckCircle,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  Camera,
  X,
  FileText,
  ShieldAlert,
} from 'lucide-react';

const ComplaintDetails = () => {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Form states
  const [assignForm, setAssignForm] = useState({
    staffName: '',
    staffPhone: '',
    department: 'Maintenance & Facilities',
  });
  const [statusForm, setStatusForm] = useState({
    status: 'In Progress',
    actionNotes: '',
    resolutionNotes: '',
    rejectionReason: '',
  });
  const [modalSubmitting, setModalSubmitting] = useState(false);

  const fetchComplaintDetails = async () => {
    try {
      setLoading(true);
      const res = await complaintService.getComplaintById(id);
      if (res.data?.data) {
        setComplaint(res.data.data.complaint);
        setHistory(res.data.data.history || []);
        setStatusForm((prev) => ({
          ...prev,
          status: res.data.data.complaint.status,
        }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load complaint details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaintDetails();
  }, [id]);

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    try {
      setModalSubmitting(true);
      await complaintService.assignStaff(id, assignForm);
      setShowAssignModal(false);
      fetchComplaintDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Assignment failed');
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    try {
      setModalSubmitting(true);
      await complaintService.updateStatus(id, statusForm);
      setShowStatusModal(false);
      fetchComplaintDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Status update failed');
    } finally {
      setModalSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading complaint record...</p>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="card" style={{ borderColor: 'var(--danger-border)', background: 'var(--danger-bg)' }}>
        <p style={{ color: 'var(--danger)', fontWeight: 600 }}>{error || 'Complaint not found'}</p>
        <Link to="/admin/complaints" className="btn btn-secondary btn-sm" style={{ marginTop: '12px' }}>
          <ArrowLeft size={14} /> Back to Complaints
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Top Navigation & Actions Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <Link to="/admin/complaints" className="btn btn-secondary btn-sm">
          <ArrowLeft size={14} /> Back to Complaints List
        </Link>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setShowAssignModal(true)} className="btn btn-secondary btn-sm">
            <UserCheck size={14} /> Assign Technician
          </button>
          <button onClick={() => setShowStatusModal(true)} className="btn btn-primary btn-sm">
            Update Ticket Status
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Left Column: Complaint & Hardware Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Overview Card */}
          <div className="card" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '18px',
                    fontWeight: 800,
                    color: 'var(--primary)',
                    background: 'var(--primary-light)',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  {complaint.ticketNumber}
                </span>
                <span className={`badge badge-${complaint.status.toLowerCase().replace(/\s+/g, '')}`}>
                  {complaint.status}
                </span>
                <span className={`badge badge-${complaint.priority.toLowerCase()}`}>
                  {complaint.priority} Priority
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Logged on {new Date(complaint.createdAt).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--secondary)', marginBottom: '8px' }}>
              {complaint.title}
            </h3>

            <div style={{ fontSize: '13.5px', color: 'var(--text-main)', lineHeight: 1.6, background: '#f8fafc', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '18px' }}>
              {complaint.description}
            </div>

            {/* Photo Evidence */}
            {complaint.imageUrl && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                  <Camera size={15} style={{ color: 'var(--accent)' }} /> Attached Photographic Evidence
                </div>
                <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden', maxWidth: '420px', background: '#000' }}>
                  <img
                    src={complaint.imageUrl.startsWith('http') ? complaint.imageUrl : `${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')}${complaint.imageUrl}`}
                    alt="Complaint Evidence"
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                  />
                </div>
              </div>
            )}

            {/* Resolution or Rejection Callouts */}
            {complaint.status === 'Resolved' && complaint.resolutionNotes && (
              <div style={{ marginTop: '18px', padding: '14px', background: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle size={16} /> Resolution Notes ({new Date(complaint.resolvedAt).toLocaleDateString()})
                </div>
                <div style={{ fontSize: '12.5px', color: '#065f46', marginTop: '4px' }}>
                  {complaint.resolutionNotes}
                </div>
              </div>
            )}

            {complaint.status === 'Rejected' && complaint.rejectionReason && (
              <div style={{ marginTop: '18px', padding: '14px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldAlert size={16} /> Rejection Reason
                </div>
                <div style={{ fontSize: '12.5px', color: '#991b1b', marginTop: '4px' }}>
                  {complaint.rejectionReason}
                </div>
              </div>
            )}
          </div>

          {/* Location & Reporter Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Location Specs */}
            <div className="card" style={{ marginBottom: 0 }}>
              <div className="card-header">
                <div className="card-title">
                  <MapPin size={16} style={{ color: 'var(--primary)' }} /> Venue Details
                </div>
              </div>
              {complaint.locationId ? (
                <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div><strong>Room:</strong> {complaint.locationId.roomNumber}</div>
                  <div><strong>Building:</strong> {complaint.locationId.buildingName}</div>
                  <div><strong>Block & Floor:</strong> {complaint.locationId.block} ({complaint.locationId.floor})</div>
                  <div><strong>QR Code:</strong> <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{complaint.locationId.qrCode}</code></div>
                  {complaint.locationId.facilities?.length > 0 && (
                    <div style={{ marginTop: '4px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>Installed Equipment:</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {complaint.locationId.facilities.map((fac, i) => (
                          <span key={i} style={{ fontSize: '10.5px', background: '#f1f5f9', padding: '1px 6px', borderRadius: '3px' }}>{fac}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: '13px' }}>
                  <div><strong>Room:</strong> {complaint.manualLocation?.roomNumber || 'N/A'}</div>
                  <div><strong>Building:</strong> {complaint.manualLocation?.buildingName || 'N/A'}</div>
                  <div><strong>Landmark:</strong> {complaint.manualLocation?.landmark || 'N/A'}</div>
                </div>
              )}
            </div>

            {/* Reporter Info */}
            <div className="card" style={{ marginBottom: 0 }}>
              <div className="card-header">
                <div className="card-title">
                  <User size={16} style={{ color: 'var(--accent)' }} /> Student Reporter
                </div>
              </div>
              <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div><strong>Name:</strong> {complaint.studentId?.fullName}</div>
                <div><strong>Reg Number:</strong> {complaint.studentId?.registrationNumber || 'N/A'}</div>
                <div><strong>Department:</strong> {complaint.studentId?.department}</div>
                <div><strong>Email:</strong> {complaint.studentId?.email}</div>
                <div><strong>Phone:</strong> {complaint.studentId?.phone || 'Not provided'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Assigned Staff & Visual Audit Trail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Assigned Technician Card */}
          <div className="card" style={{ marginBottom: 0 }}>
            <div className="card-header">
              <div className="card-title">
                <UserCheck size={16} style={{ color: 'var(--success)' }} /> Assigned Technician
              </div>
              <button onClick={() => setShowAssignModal(true)} className="btn btn-secondary btn-sm" style={{ padding: '3px 8px', fontSize: '11px' }}>
                Edit
              </button>
            </div>

            {complaint.assignedTo?.staffName ? (
              <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div><strong>Technician:</strong> {complaint.assignedTo.staffName}</div>
                <div><strong>Contact:</strong> {complaint.assignedTo.staffPhone || 'N/A'}</div>
                <div><strong>Department:</strong> {complaint.assignedTo.department}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Assigned on {new Date(complaint.assignedTo.assignedDate).toLocaleDateString()}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: '12.5px' }}>
                No technician assigned yet.
                <button onClick={() => setShowAssignModal(true)} className="btn btn-primary btn-sm" style={{ display: 'block', margin: '8px auto 0' }}>
                  Assign Now
                </button>
              </div>
            )}
          </div>

          {/* Visual Audit Trail Timeline */}
          <div className="card" style={{ flex: 1, marginBottom: 0 }}>
            <div className="card-header">
              <div className="card-title">
                <Clock size={16} style={{ color: 'var(--primary)' }} /> Ticket Lifecycle History
              </div>
            </div>

            <div className="timeline">
              {history.map((h, idx) => (
                <div key={idx} className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span className={`badge badge-${h.newStatus.toLowerCase().replace(/\s+/g, '')}`}>
                        {h.newStatus}
                      </span>
                      <span className="timeline-time">
                        {new Date(h.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-main)', marginTop: '4px' }}>
                      {h.actionNotes}
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Updated by {h.changedBy?.fullName || 'System'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ASSIGN TECHNICIAN MODAL */}
      {showAssignModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-title">Assign Maintenance Technician</div>
              <button onClick={() => setShowAssignModal(false)} className="close-btn">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit}>
              <div className="form-group">
                <label className="form-label">Staff / Technician Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Ramesh Kumar"
                  value={assignForm.staffName}
                  onChange={(e) => setAssignForm({ ...assignForm, staffName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Phone Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="+91 9845012345"
                  value={assignForm.staffPhone}
                  onChange={(e) => setAssignForm({ ...assignForm, staffPhone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Division / Department</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Electrical & AV Support"
                  value={assignForm.department}
                  onChange={(e) => setAssignForm({ ...assignForm, department: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px' }}>
                <button type="button" onClick={() => setShowAssignModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={modalSubmitting}>
                  {modalSubmitting ? 'Assigning...' : 'Assign Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE STATUS MODAL */}
      {showStatusModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-title">Advance Ticket Status</div>
              <button onClick={() => setShowStatusModal(false)} className="close-btn">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleStatusSubmit}>
              <div className="form-group">
                <label className="form-label">Target Status</label>
                <select
                  className="form-select"
                  value={statusForm.status}
                  onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                >
                  <option value="Pending">Pending</option>
                  <option value="Assigned">Assigned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              {statusForm.status === 'Resolved' && (
                <div className="form-group">
                  <label className="form-label">Resolution Notes (Actions taken)</label>
                  <textarea
                    className="form-textarea"
                    rows="3"
                    placeholder="e.g. Replaced faulty projector bulb with new 3600 ANSI unit. Verified HDMI output."
                    value={statusForm.resolutionNotes}
                    onChange={(e) => setStatusForm({ ...statusForm, resolutionNotes: e.target.value })}
                    required
                  ></textarea>
                </div>
              )}

              {statusForm.status === 'Rejected' && (
                <div className="form-group">
                  <label className="form-label">Rejection Reason</label>
                  <textarea
                    className="form-textarea"
                    rows="3"
                    placeholder="e.g. Duplicate issue already being serviced under ticket CMP-2026-0002"
                    value={statusForm.rejectionReason}
                    onChange={(e) => setStatusForm({ ...statusForm, rejectionReason: e.target.value })}
                    required
                  ></textarea>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Internal Action Notes (For audit log)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Work confirmed on-site by facilities supervisor"
                  value={statusForm.actionNotes}
                  onChange={(e) => setStatusForm({ ...statusForm, actionNotes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px' }}>
                <button type="button" onClick={() => setShowStatusModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={modalSubmitting}>
                  {modalSubmitting ? 'Saving...' : 'Update Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintDetails;

