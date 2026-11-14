import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { complaintService } from '../../services/api';
import {
  AlertCircle,
  Search,
  Filter,
  ArrowRight,
  Eye,
  CheckCircle2,
  Clock,
  UserCheck,
} from 'lucide-react';

const ManageComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await complaintService.getAllComplaints({
        search,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
      });
      if (res.data?.data) {
        setComplaints(res.data.data.complaints || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [search, statusFilter, categoryFilter]);

  return (
    <div>
      {/* Search and Filters Toolbar */}
      <div className="toolbar">
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div className="search-box">
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search by ticket #, description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ width: '170px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Rejected">Rejected</option>
          </select>

          <select
            className="form-select"
            style={{ width: '180px' }}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="Electrical">Electrical</option>
            <option value="Projector">Projector</option>
            <option value="Computer/Lab">Computer/Lab</option>
            <option value="Wi-Fi/Network">Wi-Fi/Network</option>
            <option value="Furniture">Furniture</option>
            <option value="Water/Plumbing">Water/Plumbing</option>
            <option value="Cleaning/Maintenance">Cleaning/Maintenance</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <button onClick={fetchComplaints} className="btn btn-secondary btn-sm">
          Refresh List
        </button>
      </div>

      {/* Complaints Table Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <AlertCircle size={18} style={{ color: 'var(--primary)' }} />
            Campus Maintenance Tickets ({complaints.length})
          </div>
        </div>

        {loading ? (
          <div className="spinner-container">
            <div className="spinner"></div>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading grievance tickets...</p>
          </div>
        ) : complaints.length === 0 ? (
          <div className="empty-state">
            <CheckCircle2 size={40} style={{ color: 'var(--success)', margin: '0 auto 10px' }} />
            <h3>No Complaints Found</h3>
            <p>No complaints match your active filter criteria.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Student Reporter</th>
                  <th>Category & Title</th>
                  <th>Location</th>
                  <th>Priority</th>
                  <th>Assigned To</th>
                  <th>Status</th>
                  <th>Logged Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          color: 'var(--primary)',
                          background: 'var(--primary-light)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        {item.ticketNumber}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.studentId?.fullName || 'Student'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {item.studentId?.registrationNumber || item.studentId?.email}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.title}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{item.category}</div>
                    </td>
                    <td>
                      {item.locationId ? (
                        <div>
                          <strong>{item.locationId.roomNumber}</strong>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {item.locationId.buildingName}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <strong>{item.manualLocation?.roomNumber || 'Manual'}</strong>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {item.manualLocation?.buildingName || 'Campus'}
                          </div>
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`badge badge-${item.priority.toLowerCase()}`}>
                        {item.priority}
                      </span>
                    </td>
                    <td>
                      {item.assignedTo?.staffName ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <UserCheck size={14} style={{ color: 'var(--success)' }} />
                          <span style={{ fontSize: '12.5px', fontWeight: 600 }}>
                            {item.assignedTo.staffName}
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-light)', fontStyle: 'italic' }}>
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`badge badge-${item.status.toLowerCase().replace(/\s+/g, '')}`}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(item.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td>
                      <Link
                        to={`/admin/complaints/${item._id}`}
                        className="btn btn-secondary btn-sm"
                        style={{ gap: '4px' }}
                      >
                        <Eye size={13} /> Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageComplaints;

