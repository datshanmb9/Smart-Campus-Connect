import React, { useState, useEffect } from 'react';
import { lostFoundService } from '../../services/api';
import {
  HelpCircle,
  Search,
  CheckCircle,
  Trash2,
  Tag,
  MapPin,
  Calendar,
  User,
  AlertCircle,
} from 'lucide-react';

const ManageLostFound = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await lostFoundService.getAllItems({
        type: typeFilter || undefined,
        category: categoryFilter || undefined,
        search,
        status: 'All',
      });
      if (res.data?.data) {
        setItems(res.data.data.items || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [typeFilter, categoryFilter, search]);

  const handleUpdateStatus = async (id, status) => {
    try {
      await lostFoundService.updateItemStatus(id, { status });
      fetchItems();
    } catch (err) {
      alert(err.response?.data?.message || 'Status update failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this lost/found post?')) return;
    try {
      await lostFoundService.deleteItem(id);
      fetchItems();
    } catch (err) {
      alert(err.response?.data?.message || 'Deletion failed');
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
              placeholder="Search by title, location, description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ width: '150px' }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="Lost">Lost Items</option>
            <option value="Found">Found Items</option>
          </select>

          <select
            className="form-select"
            style={{ width: '180px' }}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="ID Cards">ID Cards</option>
            <option value="Books/Notes">Books/Notes</option>
            <option value="Keys">Keys</option>
            <option value="Wallets/Bags">Wallets/Bags</option>
            <option value="Personal Belongings">Personal Belongings</option>
          </select>
        </div>

        <button onClick={fetchItems} className="btn btn-secondary btn-sm">
          Refresh
        </button>
      </div>

      {/* Items Table Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <HelpCircle size={18} style={{ color: 'var(--primary)' }} />
            Campus Lost & Found Registry ({items.length})
          </div>
        </div>

        {loading ? (
          <div className="spinner-container">
            <div className="spinner"></div>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading registry...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <CheckCircle size={40} style={{ color: 'var(--success)', margin: '0 auto 10px' }} />
            <h3>No Items Logged</h3>
            <p>No lost or found items match the filter criteria.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Item Title</th>
                  <th>Category</th>
                  <th>Location & Date</th>
                  <th>Reported By</th>
                  <th>Claim Details</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <span
                        className={`badge ${item.type === 'Found' ? 'badge-resolved' : 'badge-urgent'}`}
                      >
                        {item.type}
                      </span>
                    </td>
                    <td>
                      <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>{item.title}</strong>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '240px' }}>
                        {item.description}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-medium">{item.category}</span>
                    </td>
                    <td>
                      <div style={{ fontSize: '12.5px', fontWeight: 600 }}>{item.location}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {new Date(item.itemDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.postedBy?.fullName || 'Anonymous'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {item.postedBy?.department || 'Student'}
                      </div>
                    </td>
                    <td style={{ maxWidth: '200px' }}>
                      {item.claimNotes ? (
                        <div style={{ fontSize: '11.5px', background: '#fffbeb', padding: '6px 8px', borderRadius: '4px', border: '1px solid #fde68a' }}>
                          <strong>Claim:</strong> {item.claimNotes}
                        </div>
                      ) : (
                        <span style={{ fontSize: '11.5px', color: 'var(--text-light)' }}>None</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          item.status === 'Resolved/Returned'
                            ? 'badge-resolved'
                            : item.status === 'Claim Pending'
                            ? 'badge-pending'
                            : 'badge-medium'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {item.status !== 'Resolved/Returned' && (
                          <button
                            onClick={() => handleUpdateStatus(item._id, 'Resolved/Returned')}
                            className="btn btn-success btn-sm"
                            style={{ padding: '3px 7px', fontSize: '11px' }}
                            title="Mark Returned"
                          >
                            Returned
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="btn btn-secondary btn-sm"
                          style={{ color: 'var(--danger)', padding: '3px 7px' }}
                          title="Delete Post"
                        >
                          <Trash2 size={13} />
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
    </div>
  );
};

export default ManageLostFound;

