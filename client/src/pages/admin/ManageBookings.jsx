import React, { useState, useEffect } from 'react';
import { bookingService } from '../../services/api';
import {
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  AlertTriangle,
  User,
  Calendar,
  X,
  Building,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Layers,
} from 'lucide-react';

const ManageBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All'); // 'All' | 'Pending' | 'Approved' | 'Rejected' | 'Cancelled'
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
    total: 0,
  });

  // Action states
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showSectionSummary, setShowSectionSummary] = useState(false);
  const [sectionSummary, setSectionSummary] = useState([]);
  const [sectionLoading, setSectionLoading] = useState(false);

  const fetchSectionSummary = async () => {
    try {
      setSectionLoading(true);
      const res = await bookingService.getSectionBookingSummary();
      if (res.data?.data) {
        setSectionSummary(res.data.data.sections || []);
      }
      setShowSectionSummary(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to fetch section quota summary');
    } finally {
      setSectionLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setActionError('');
      const params = {
        status: activeTab === 'All' ? undefined : activeTab,
        search: search.trim() || undefined,
        date: dateFilter || undefined,
        page,
        limit: 15,
      };

      const res = await bookingService.getAllBookings(params);
      if (res.data?.data) {
        setBookings(res.data.data.bookings || []);
        setTotal(res.data.data.total || 0);
        setPages(res.data.data.pages || 1);
        if (res.data.data.stats) {
          setStats(res.data.data.stats);
        }
      }
    } catch (err) {
      console.error(err);
      setActionError('Failed to load bookings from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [activeTab, search, dateFilter, page]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleApprove = async (id) => {
    setActionError('');
    setActionSuccess('');
    try {
      setActionLoading(true);
      const res = await bookingService.updateBookingStatus(id, { status: 'Approved' });
      setActionSuccess('Booking approved successfully! Conflict validation passed.');
      setTimeout(() => setActionSuccess(''), 4000);
      fetchBookings();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to approve booking due to a schedule conflict');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReject = (booking) => {
    setSelectedBooking(booking);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason.');
      return;
    }
    setActionError('');
    setActionSuccess('');
    try {
      setActionLoading(true);
      await bookingService.updateBookingStatus(selectedBooking._id, {
        status: 'Rejected',
        rejectionReason: rejectionReason.trim(),
      });
      setShowRejectModal(false);
      setActionSuccess(`Booking for ${selectedBooking.resourceName} has been rejected.`);
      setTimeout(() => setActionSuccess(''), 4000);
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Rejection failed');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      {/* Notifications / Alerts */}
      {actionError && (
        <div
          style={{
            background: 'var(--danger-bg, #fef2f2)',
            color: 'var(--danger, #dc2626)',
            border: '1px solid var(--danger-border, #fecaca)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13.5px',
          }}
        >
          <AlertTriangle size={18} />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div
          style={{
            background: '#ecfdf5',
            color: '#065f46',
            border: '1px solid #a7f3d0',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13.5px',
          }}
        >
          <CheckCircle size={18} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Booking Statistics Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div
          className="card"
          style={{ padding: '16px', cursor: 'pointer', borderTop: activeTab === 'All' ? '3px solid var(--primary)' : '' }}
          onClick={() => handleTabChange('All')}
        >
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Total Bookings</div>
          <div style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px' }}>{stats.total}</div>
        </div>

        <div
          className="card"
          style={{
            padding: '16px',
            cursor: 'pointer',
            borderTop: '3px solid #f59e0b',
            background: activeTab === 'Pending' ? '#fffbeb' : '#fff',
          }}
          onClick={() => handleTabChange('Pending')}
        >
          <div style={{ fontSize: '12px', color: '#b45309', fontWeight: 600 }}>Pending Review</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#b45309', marginTop: '4px' }}>
            {stats.pending}
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '16px',
            cursor: 'pointer',
            borderTop: '3px solid #10b981',
            background: activeTab === 'Approved' ? '#f0fdf4' : '#fff',
          }}
          onClick={() => handleTabChange('Approved')}
        >
          <div style={{ fontSize: '12px', color: '#047857', fontWeight: 600 }}>Approved Reservations</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#047857', marginTop: '4px' }}>
            {stats.approved}
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '16px',
            cursor: 'pointer',
            borderTop: '3px solid #ef4444',
            background: activeTab === 'Rejected' ? '#fef2f2' : '#fff',
          }}
          onClick={() => handleTabChange('Rejected')}
        >
          <div style={{ fontSize: '12px', color: '#b91c1c', fontWeight: 600 }}>Rejected Requests</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#b91c1c', marginTop: '4px' }}>
            {stats.rejected}
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: '16px',
            cursor: 'pointer',
            borderTop: '3px solid #6b7280',
            background: activeTab === 'Cancelled' ? '#f9fafb' : '#fff',
          }}
          onClick={() => handleTabChange('Cancelled')}
        >
          <div style={{ fontSize: '12px', color: '#4b5563', fontWeight: 600 }}>Cancelled by Student</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#4b5563', marginTop: '4px' }}>
            {stats.cancelled}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', marginBottom: '16px' }}>
        {[
          { key: 'All', label: 'All Requests', count: stats.total },
          { key: 'Pending', label: 'Pending Reviews', count: stats.pending },
          { key: 'Approved', label: 'Approved Bookings', count: stats.approved },
          { key: 'Rejected', label: 'Rejected Requests', count: stats.rejected },
          { key: 'Cancelled', label: 'Cancelled Requests', count: stats.cancelled },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            style={{
              padding: '10px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.key ? '3px solid var(--primary)' : '3px solid transparent',
              fontWeight: 700,
              fontSize: '13.5px',
              color: activeTab === tab.key ? 'var(--primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '-2px',
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                style={{
                  background: activeTab === tab.key ? 'var(--primary-light, #e0e7ff)' : '#f1f5f9',
                  color: activeTab === tab.key ? 'var(--primary)' : '#64748b',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '10px',
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Filter Toolbar */}
      <div className="toolbar" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
          <div className="search-box" style={{ minWidth: '240px' }}>
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search by facility, student or purpose..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={16} color="var(--text-muted)" />
            <input
              type="date"
              className="form-control"
              style={{ width: '160px', padding: '6px 10px', fontSize: '13px' }}
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {(search || dateFilter) && (
            <button
              onClick={() => {
                setSearch('');
                setDateFilter('');
                setPage(1);
              }}
              className="btn btn-secondary btn-sm"
              style={{ padding: '4px 10px', fontSize: '12px' }}
            >
              Clear Filters
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={fetchSectionSummary}
            disabled={sectionLoading}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Layers size={14} color="var(--primary)" /> Section Quota Overview
          </button>
          <button onClick={fetchBookings} className="btn btn-secondary btn-sm">
            <RotateCcw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Bookings Table Card */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="card-title">
            <Clock size={18} style={{ color: 'var(--primary)' }} />
            {activeTab === 'All' ? 'All Facility Bookings' : `${activeTab} Facility Bookings`} ({total})
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Showing page {page} of {pages || 1}
          </div>
        </div>

        {loading ? (
          <div className="spinner-container">
            <div className="spinner"></div>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading reservations...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="empty-state">
            <Clock size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 10px' }} />
            <h3>No Bookings Found</h3>
            <p>No facility reservations match the selected filter criteria.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Facility / Room</th>
                  <th>Requester</th>
                  <th>Purpose</th>
                  <th>Booking Date</th>
                  <th>Time Slot</th>
                  <th>Authority</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Review Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Building size={16} color="var(--primary)" />
                        <div>
                          <strong>{b.resourceName}</strong>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {b.locationId?.buildingName || 'Campus Venue'} • Floor {b.locationId?.floor || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>{b.requestedBy?.fullName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {b.requestedBy?.registrationNumber || b.requestedBy?.email}
                      </div>
                      <span className="badge badge-medium" style={{ fontSize: '10px', padding: '1px 5px' }}>
                        {b.requestedBy?.role}
                      </span>
                    </td>
                    <td style={{ maxWidth: '220px' }}>
                      <div style={{ fontSize: '12.5px', color: 'var(--text-main)' }}>{b.purpose}</div>
                      {b.rejectionReason && (
                        <div
                          style={{
                            fontSize: '11px',
                            color: 'var(--danger)',
                            marginTop: '4px',
                            background: '#fef2f2',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            border: '1px solid #fecaca',
                          }}
                        >
                          <strong>Reason:</strong> {b.rejectionReason}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '12.5px' }}>
                        {new Date(b.bookingDate).toLocaleDateString([], {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          background: '#f1f5f9',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                        }}
                      >
                        {b.startTime} - {b.endTime}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: b.locationId?.approvalAuthority === 'faculty' ? '#f3e8ff' : '#e0e7ff',
                          color: b.locationId?.approvalAuthority === 'faculty' ? '#6b21a8' : '#3730a3',
                          fontWeight: 600,
                        }}
                      >
                        {b.locationId?.approvalAuthority === 'faculty' ? 'Faculty Auth' : 'Admin Auth'}
                      </span>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background:
                            b.status === 'Approved'
                              ? '#ecfdf5'
                              : b.status === 'Pending'
                              ? '#fef3c7'
                              : b.status === 'Rejected'
                              ? '#fef2f2'
                              : '#f3f4f6',
                          color:
                            b.status === 'Approved'
                              ? '#065f46'
                              : b.status === 'Pending'
                              ? '#b45309'
                              : b.status === 'Rejected'
                              ? '#991b1b'
                              : '#4b5563',
                          border: '1px solid currentColor',
                        }}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        {b.status === 'Pending' ? (
                          <>
                            <button
                              onClick={() => handleApprove(b._id)}
                              disabled={actionLoading}
                              className="btn btn-success btn-sm"
                              style={{ padding: '3px 8px', fontSize: '11px', gap: '4px' }}
                              title="Approve Booking"
                            >
                              <CheckCircle size={12} /> Approve
                            </button>
                            <button
                              onClick={() => handleOpenReject(b)}
                              disabled={actionLoading}
                              className="btn btn-danger btn-sm"
                              style={{ padding: '3px 8px', fontSize: '11px', gap: '4px' }}
                              title="Reject Booking"
                            >
                              <XCircle size={12} /> Reject
                            </button>
                          </>
                        ) : (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {b.reviewedBy ? `Reviewed by ${b.reviewedBy.fullName}` : b.status}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pages > 1 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              borderTop: '1px solid #e2e8f0',
            }}
          >
            <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
              Showing {bookings.length} of {total} records
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <span style={{ fontSize: '12.5px', fontWeight: 600 }}>
                {page} / {pages}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page >= pages}
                onClick={() => setPage(page + 1)}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* REJECT BOOKING MODAL */}
      {showRejectModal && selectedBooking && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <XCircle size={20} />
                Reject Facility Booking
              </h3>
              <button
                className="btn-icon"
                onClick={() => setShowRejectModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleRejectSubmit}>
              <div className="modal-body" style={{ padding: '20px' }}>
                <p style={{ fontSize: '13.5px', color: 'var(--text-main)', marginBottom: '14px' }}>
                  Please state the reason for rejecting the booking for <strong>{selectedBooking.resourceName}</strong> on{' '}
                  {new Date(selectedBooking.bookingDate).toLocaleDateString()} ({selectedBooking.startTime} - {selectedBooking.endTime}).
                </p>

                <div style={{ marginBottom: '12px' }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Rejection Reason <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <textarea
                    className="form-control"
                    rows="3"
                    required
                    placeholder="e.g. Venue maintenance scheduled, university exam in progress..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    style={{ width: '100%', resize: 'vertical' }}
                  ></textarea>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {[
                    'Facility under scheduled maintenance',
                    'Official university examination venue',
                    'High priority academic event scheduled',
                    'Time slot conflicts with class timetable',
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
                  onClick={() => setShowRejectModal(false)}
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

      {/* SECTION QUOTA OVERVIEW MODAL (MODULE 1) */}
      {showSectionSummary && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={20} color="var(--primary)" />
                Section-Wise Room Booking Quotas (Max 2 Active / Section)
              </h3>
              <button
                className="btn-icon"
                onClick={() => setShowSectionSummary(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '20px' }}>
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px',
                  marginBottom: '16px',
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                }}
              >
                <strong>Academic Section Policy:</strong> Each academic section (e.g. MCA 1st Year Section A) is restricted to a maximum of <strong>2 active room bookings</strong> (Pending + Approved) concurrently across all campus facilities.
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Academic Section</th>
                      <th>Pending</th>
                      <th>Approved</th>
                      <th>Active / Limit</th>
                      <th>Remaining</th>
                      <th>Section Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sectionSummary.map((sec) => (
                      <tr key={`${sec.academicYear}-${sec.section}`}>
                        <td>
                          <strong>{sec.academicYear} — Section {sec.section}</strong>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sec.department}</div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: '#b45309' }}>{sec.pendingCount}</span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, color: '#047857' }}>{sec.approvedCount}</span>
                        </td>
                        <td>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              fontSize: '13px',
                              background: '#f1f5f9',
                              padding: '2px 8px',
                              borderRadius: '4px',
                            }}
                          >
                            {sec.activeCount} / {sec.limit}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, color: sec.remainingSlots > 0 ? '#10b981' : '#ef4444' }}>
                            {sec.remainingSlots} slot{sec.remainingSlots === 1 ? '' : 's'}
                          </span>
                        </td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              background: sec.isAtLimit ? '#fef2f2' : '#ecfdf5',
                              color: sec.isAtLimit ? '#b91c1c' : '#047857',
                              border: `1px solid ${sec.isAtLimit ? '#fecaca' : '#a7f3d0'}`,
                            }}
                          >
                            {sec.isAtLimit ? 'Quota Full' : 'Available'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowSectionSummary(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageBookings;
