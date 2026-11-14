import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { userService } from '../../services/api';
import {
  Users,
  Search,
  Filter,
  UserCheck,
  UserX,
  Mail,
  GraduationCap,
  Briefcase,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  X,
  FileCheck,
  ArrowRight,
} from 'lucide-react';

const ManageUsers = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'pending' ? 'pending' : 'directory';
  const [activeTab, setActiveTab] = useState(initialTab); // 'directory' | 'pending'
  const [users, setUsers] = useState([]);
  const [pendingStudents, setPendingStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'pending' || tab === 'directory') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams(newTab === 'pending' ? { tab: 'pending' } : {});
  };

  // Modal states
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [viewDetailsModal, setViewDetailsModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const [allRes, pendingRes] = await Promise.all([
        userService.getAllUsers({
          role: roleFilter || undefined,
          search,
        }),
        userService.getPendingStudents({ search }),
      ]);

      if (allRes.data?.data) {
        setUsers(allRes.data.data.users || []);
        setTotal(allRes.data.data.total || 0);
      }

      if (pendingRes.data?.data) {
        setPendingStudents(pendingRes.data.data.students || []);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, search]);

  const handleToggleStatus = async (user) => {
    const action = user.isActive ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} ${user.fullName}'s account?`)) return;

    try {
      await userService.updateUserStatus(user._id, { isActive: !user.isActive });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleApprove = async (student) => {
    if (!window.confirm(`Approve registration for ${student.fullName} (${student.registrationNumber || student.email})?`)) return;
    try {
      setActionLoading(true);
      await userService.approveStudent(student._id);
      setActionFeedback({ type: 'success', message: `Student ${student.fullName} approved successfully!` });
      setTimeout(() => setActionFeedback(null), 4000);
      fetchUsers();
    } catch (err) {
      setActionFeedback({ type: 'error', message: err.response?.data?.message || 'Approval failed' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReject = (student) => {
    setSelectedStudent(student);
    setRejectionReason('');
    setRejectModal(true);
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      alert('Please enter a rejection reason.');
      return;
    }
    try {
      setActionLoading(true);
      await userService.rejectStudent(selectedStudent._id, { reason: rejectionReason.trim() });
      setRejectModal(false);
      setActionFeedback({ type: 'success', message: `Registration for ${selectedStudent.fullName} rejected.` });
      setTimeout(() => setActionFeedback(null), 4000);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Rejection failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDetails = (student) => {
    setSelectedStudent(student);
    setViewDetailsModal(true);
  };

  return (
    <div>
      {/* Feedback Alert */}
      {actionFeedback && (
        <div
          style={{
            background: actionFeedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
            color: actionFeedback.type === 'success' ? '#065f46' : '#991b1b',
            border: `1px solid ${actionFeedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13.5px',
            fontWeight: 500,
          }}
        >
          {actionFeedback.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{actionFeedback.message}</span>
        </div>
      )}

      {/* Primary Tab Navigation */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '2px solid #e2e8f0', marginBottom: '20px' }}>
        <button
          type="button"
          onClick={() => handleTabChange('directory')}
          style={{
            padding: '11px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'directory' ? '3px solid var(--primary)' : '3px solid transparent',
            fontWeight: 700,
            fontSize: '14px',
            color: activeTab === 'directory' ? 'var(--primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '-2px',
          }}
        >
          <Users size={16} />
          Campus Directory ({total})
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('pending')}
          style={{
            padding: '11px 20px',
            background: activeTab === 'pending' ? '#fef3c7' : 'transparent',
            borderRadius: activeTab === 'pending' ? '8px 8px 0 0' : '0',
            border: 'none',
            borderBottom: activeTab === 'pending' ? '3px solid var(--warning)' : '3px solid transparent',
            fontWeight: 700,
            fontSize: '14px',
            color: activeTab === 'pending' ? 'var(--warning-dark, #b45309)' : '#b45309',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '-2px',
          }}
        >
          <Clock size={16} />
          Pending Student Approvals
          {pendingStudents.length > 0 && (
            <span
              style={{
                background: '#dc2626',
                color: '#fff',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.3px',
              }}
            >
              {pendingStudents.length} ACTION REQUIRED
            </span>
          )}
        </button>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div className="search-box">
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder={activeTab === 'pending' ? "Search pending applicants..." : "Search by name, email, reg number..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {activeTab === 'directory' && (
            <select
              className="form-select"
              style={{ width: '160px' }}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="student">Students</option>
              <option value="faculty">Faculty</option>
              <option value="admin">Administrators</option>
            </select>
          )}
        </div>

        <button onClick={fetchUsers} className="btn btn-secondary btn-sm">
          Refresh Data
        </button>
      </div>

      {/* TAB CONTENT: PENDING STUDENT APPROVALS */}
      {activeTab === 'pending' && (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="card-title">
              <Clock size={18} style={{ color: 'var(--warning-dark, #b45309)' }} />
              Pending Student Registration Approvals ({pendingStudents.length})
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              ℹ️ Manual Verification: Compare roll number with university admissions roster before approving.
            </div>
          </div>

          {loading ? (
            <div className="spinner-container">
              <div className="spinner"></div>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading pending applicants...</p>
            </div>
          ) : pendingStudents.length === 0 ? (
            <div className="empty-state">
              <FileCheck size={44} style={{ color: '#10b981', margin: '0 auto 10px' }} />
              <h3>All Caught Up!</h3>
              <p>There are currently no student accounts awaiting administrator verification.</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Email Address</th>
                    <th>University Roll No</th>
                    <th>Department</th>
                    <th>Registered On</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Admin Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingStudents.map((s) => (
                    <tr key={s._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img
                            src={s.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'}
                            alt={s.fullName}
                            style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <div>
                            <strong style={{ fontSize: '13.5px' }}>{s.fullName}</strong>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.phone || 'No phone'}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: '13px' }}>
                        <span style={{ color: 'var(--primary)', fontWeight: 500 }}>{s.email}</span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            fontSize: '12px',
                            background: '#fef3c7',
                            color: '#92400e',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            border: '1px solid #fde68a',
                          }}
                        >
                          {s.registrationNumber || 'N/A'}
                        </span>
                      </td>
                      <td style={{ fontSize: '12.5px' }}>{s.department}</td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {new Date(s.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}
                        >
                          Pending Review
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleOpenDetails(s)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 8px', fontSize: '11px', gap: '4px' }}
                            title="View Full Profile"
                          >
                            <Eye size={12} /> View
                          </button>
                          <button
                            onClick={() => handleApprove(s)}
                            disabled={actionLoading}
                            className="btn btn-success btn-sm"
                            style={{ padding: '4px 10px', fontSize: '11px', gap: '4px' }}
                            title="Approve Student Account"
                          >
                            <CheckCircle size={12} /> Approve
                          </button>
                          <button
                            onClick={() => handleOpenReject(s)}
                            disabled={actionLoading}
                            className="btn btn-danger btn-sm"
                            style={{ padding: '4px 10px', fontSize: '11px', gap: '4px' }}
                            title="Reject Student Registration"
                          >
                            <XCircle size={12} /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: CAMPUS STAKEHOLDER DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Users size={18} style={{ color: 'var(--primary)' }} />
              Campus Stakeholder Directory ({total})
            </div>
          </div>

          {/* High-visibility Action Banner for Pending Registrations */}
          {pendingStudents.length > 0 && (
            <div
              style={{
                background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                border: '1px solid #fde68a',
                borderRadius: 'var(--radius-md)',
                padding: '14px 18px',
                margin: '16px 20px 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    background: '#fef3c7',
                    border: '1px solid #fde68a',
                    borderRadius: '50%',
                    width: '38px',
                    height: '38px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Clock size={20} color="#b45309" />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '14px', color: '#92400e', fontWeight: 800 }}>
                    {pendingStudents.length} Student Registration{pendingStudents.length > 1 ? 's' : ''} Awaiting Approval
                  </h4>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#b45309' }}>
                    Newly registered students cannot log in until approved.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleTabChange('pending')}
                className="btn btn-sm"
                style={{
                  background: '#d97706',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 700,
                  padding: '7px 14px',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 4px rgba(217, 119, 6, 0.25)',
                }}
              >
                Review Pending Approvals ({pendingStudents.length}) &rarr;
              </button>
            </div>
          )}

          {loading ? (
            <div className="spinner-container">
              <div className="spinner"></div>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading campus users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="empty-state">
              <Users size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 10px' }} />
              <h3>No Users Found</h3>
              <p>Try modifying your search or filter options.</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>User Profile</th>
                    <th>Campus Identifier</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Approval Status</th>
                    <th>Account Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img
                            src={u.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'}
                            alt={u.fullName}
                            style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <div>
                            <strong style={{ fontSize: '13.5px' }}>{u.fullName}</strong>
                            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            fontSize: '12px',
                            background: '#f1f5f9',
                            padding: '2px 6px',
                            borderRadius: '4px',
                          }}
                        >
                          {u.registrationNumber || u.employeeId || 'SYS-ADMIN'}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            u.role === 'admin'
                              ? 'badge-urgent'
                              : u.role === 'faculty'
                              ? 'badge-inprogress'
                              : 'badge-medium'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td style={{ fontSize: '12.5px' }}>{u.department}</td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            background:
                              u.approvalStatus === 'Approved'
                                ? '#ecfdf5'
                                : u.approvalStatus === 'Pending'
                                ? '#fef3c7'
                                : u.approvalStatus === 'Rejected'
                                ? '#fef2f2'
                                : '#f3f4f6',
                            color:
                              u.approvalStatus === 'Approved'
                                ? '#065f46'
                                : u.approvalStatus === 'Pending'
                                ? '#b45309'
                                : u.approvalStatus === 'Rejected'
                                ? '#991b1b'
                                : '#374151',
                            border: '1px solid currentColor',
                          }}
                        >
                          {u.approvalStatus || 'Approved'}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${u.isActive ? 'badge-resolved' : 'badge-rejected'}`}
                        >
                          {u.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td>
                        {u.role === 'student' && u.approvalStatus === 'Pending' ? (
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleApprove(u)}
                              disabled={actionLoading}
                              className="btn btn-success btn-sm"
                              style={{ padding: '3px 8px', fontSize: '11px', gap: '4px', fontWeight: 600 }}
                              title="Approve Student Account"
                            >
                              <CheckCircle size={12} /> Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenReject(u)}
                              disabled={actionLoading}
                              className="btn btn-danger btn-sm"
                              style={{ padding: '3px 8px', fontSize: '11px', gap: '4px' }}
                              title="Reject Registration"
                            >
                              <XCircle size={12} /> Reject
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u)}
                            className={`btn btn-sm ${u.isActive ? 'btn-secondary' : 'btn-success'}`}
                            style={{ padding: '3px 8px', fontSize: '11px', gap: '4px' }}
                          >
                            {u.isActive ? (
                              <>
                                <UserX size={12} color="var(--danger)" /> Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck size={12} /> Activate
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VIEW STUDENT DETAILS MODAL */}
      {viewDetailsModal && selectedStudent && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GraduationCap size={20} color="var(--primary)" />
                Student Registration Details
              </h3>
              <button
                className="btn-icon"
                onClick={() => setViewDetailsModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                <img
                  src={selectedStudent.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'}
                  alt={selectedStudent.fullName}
                  style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <h4 style={{ margin: 0, fontSize: '16px' }}>{selectedStudent.fullName}</h4>
                  <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{selectedStudent.email}</div>
                  <span className="badge badge-medium" style={{ marginTop: '4px', display: 'inline-block' }}>
                    Student Applicant
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Roll Number
                  </label>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '14px', marginTop: '2px' }}>
                    {selectedStudent.registrationNumber || 'Not provided'}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Phone Number
                  </label>
                  <div style={{ fontSize: '13.5px', marginTop: '2px' }}>
                    {selectedStudent.phone || 'Not provided'}
                  </div>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Academic Department
                  </label>
                  <div style={{ fontSize: '13.5px', marginTop: '2px' }}>
                    {selectedStudent.department}
                  </div>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Registration Date
                  </label>
                  <div style={{ fontSize: '13.5px', marginTop: '2px' }}>
                    {new Date(selectedStudent.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px',
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                }}
              >
                <strong>Verification Guidelines:</strong> Cross-reference the registration number with the official Presidency University Student Information System (SIS). Do not approve unverified applicants.
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setViewDetailsModal(false)}
              >
                Close
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  setViewDetailsModal(false);
                  handleOpenReject(selectedStudent);
                }}
              >
                Reject...
              </button>
              <button
                className="btn btn-success"
                onClick={() => {
                  setViewDetailsModal(false);
                  handleApprove(selectedStudent);
                }}
              >
                Approve Student
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT STUDENT MODAL */}
      {rejectModal && selectedStudent && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <XCircle size={20} />
                Reject Student Registration
              </h3>
              <button
                className="btn-icon"
                onClick={() => setRejectModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleRejectSubmit}>
              <div className="modal-body" style={{ padding: '20px' }}>
                <p style={{ fontSize: '13.5px', color: 'var(--text-main)', marginBottom: '14px' }}>
                  Please state the reason for rejecting <strong>{selectedStudent.fullName}</strong> ({selectedStudent.registrationNumber}). This will be displayed to the student when they attempt to log in.
                </p>

                <div style={{ marginBottom: '12px' }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Rejection Reason <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <textarea
                    className="form-control"
                    rows="3"
                    required
                    placeholder="e.g. Roll number not found in university admissions roster..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    style={{ width: '100%', resize: 'vertical' }}
                  ></textarea>
                </div>

                {/* Pre-fill Quick Reason Buttons */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {[
                    'Roll number not found in university roster',
                    'Invalid department selection',
                    'Non-university email domain used',
                    'Duplicate account detected',
                  ].map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => setRejectionReason(preset)}
                      style={{
                        background: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        padding: '3px 8px',
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setRejectModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !rejectionReason.trim()}
                  className="btn btn-danger"
                >
                  {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;
