import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { locationService } from '../../services/api';
import {
  MapPin,
  QrCode,
  Plus,
  Search,
  Download,
  Trash2,
  X,
  Printer,
  Sparkles,
  CheckCircle,
} from 'lucide-react';

const ManageLocations = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRoomType, setSelectedRoomType] = useState('');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [activeLocation, setActiveLocation] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    qrCode: '',
    buildingName: '',
    block: '',
    floor: '',
    roomNumber: '',
    roomType: 'Classroom',
    description: '',
    facilities: '',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const res = await locationService.getAllLocations({
        search,
        roomType: selectedRoomType || undefined,
      });
      if (res.data?.data) {
        setLocations(res.data.data.locations || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [search, selectedRoomType]);

  const handleOpenQrModal = async (loc) => {
    setActiveLocation(loc);
    try {
      // Generate clean QR code data URL (High resolution 300px)
      const url = await QRCode.toDataURL(loc.qrCode, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      });
      setQrDataUrl(url);
      setShowQrModal(true);
    } catch (err) {
      console.error('Failed to generate QR canvas:', err);
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl || !activeLocation) return;
    const link = document.createElement('a');
    link.download = `QR-${activeLocation.qrCode}-${activeLocation.roomNumber}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    try {
      setSubmitting(true);
      const facilitiesArray = formData.facilities
        ? formData.facilities.split(',').map((f) => f.trim()).filter(Boolean)
        : [];

      await locationService.createLocation({
        ...formData,
        facilities: facilitiesArray,
      });

      setShowCreateModal(false);
      setFormData({
        qrCode: '',
        buildingName: '',
        block: '',
        floor: '',
        roomNumber: '',
        roomType: 'Classroom',
        description: '',
        facilities: '',
      });
      fetchLocations();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create location');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLocation = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this campus location?')) return;
    try {
      await locationService.deleteLocation(id);
      fetchLocations();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete location');
    }
  };

  return (
    <div>
      {/* Header and Action */}
      <div className="toolbar">
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div className="search-box">
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search by QR code, room, building..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ width: '180px' }}
            value={selectedRoomType}
            onChange={(e) => setSelectedRoomType(e.target.value)}
          >
            <option value="">All Venue Types</option>
            <option value="Classroom">Classroom</option>
            <option value="Computer Lab">Computer Lab</option>
            <option value="Seminar Hall">Seminar Hall</option>
            <option value="Auditorium">Auditorium</option>
            <option value="Library">Library</option>
            <option value="Faculty Room">Faculty Room</option>
          </select>
        </div>

        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          <Plus size={16} /> New Campus Venue & QR
        </button>
      </div>

      {/* Locations Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <MapPin size={18} style={{ color: 'var(--primary)' }} />
            Registered Campus Facilities ({locations.length})
          </div>
        </div>

        {loading ? (
          <div className="spinner-container">
            <div className="spinner"></div>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading venues...</p>
          </div>
        ) : locations.length === 0 ? (
          <div className="empty-state">
            <MapPin size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 10px' }} />
            <h3>No Locations Found</h3>
            <p>Try refining your search or add a new campus venue.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>QR Identifier</th>
                  <th>Building & Wing</th>
                  <th>Floor & Room</th>
                  <th>Type</th>
                  <th>Installed Equipment</th>
                  <th>QR Action</th>
                  <th>Manage</th>
                </tr>
              </thead>
              <tbody>
                {locations.map((loc) => (
                  <tr key={loc._id}>
                    <td>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          background: '#f1f5f9',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          color: '#0f172a',
                          border: '1px solid #cbd5e1',
                        }}
                      >
                        {loc.qrCode}
                      </span>
                    </td>
                    <td>
                      <strong>{loc.buildingName}</strong>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{loc.block}</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{loc.roomNumber}</span>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{loc.floor}</div>
                    </td>
                    <td>
                      <span className="badge badge-medium">{loc.roomType}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '260px' }}>
                        {loc.facilities && loc.facilities.length > 0 ? (
                          loc.facilities.map((fac, idx) => (
                            <span
                              key={idx}
                              style={{
                                fontSize: '10.5px',
                                background: '#f8fafc',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                border: '1px solid #e2e8f0',
                                color: '#475569',
                              }}
                            >
                              {fac}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Standard</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <button
                        onClick={() => handleOpenQrModal(loc)}
                        className="btn btn-secondary btn-sm"
                        style={{ gap: '6px' }}
                      >
                        <QrCode size={14} style={{ color: 'var(--accent)' }} /> View QR
                      </button>
                    </td>
                    <td>
                      <button
                        onClick={() => handleDeleteLocation(loc._id)}
                        className="btn btn-secondary btn-sm"
                        style={{ color: 'var(--danger)', padding: '5px 8px' }}
                        title="Deactivate Venue"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE LOCATION MODAL */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-title">Provision New Campus Location</div>
              <button onClick={() => setShowCreateModal(false)} className="close-btn">
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div
                style={{
                  background: 'var(--danger-bg)',
                  color: 'var(--danger)',
                  padding: '10px',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '16px',
                  fontSize: '12.5px',
                }}
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit}>
              <div className="form-group">
                <label className="form-label">QR Code String (Unique Campus Identifier)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. PU-ENGG-LH302"
                  value={formData.qrCode}
                  onChange={(e) => setFormData({ ...formData, qrCode: e.target.value.toUpperCase() })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Building Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Academic Block 1"
                    value={formData.buildingName}
                    onChange={(e) => setFormData({ ...formData, buildingName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Block / Wing</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Engineering Wing"
                    value={formData.block}
                    onChange={(e) => setFormData({ ...formData, block: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Floor</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="2nd Floor"
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Room Number</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="LH-302"
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Room / Facility Type</label>
                <select
                  className="form-select"
                  value={formData.roomType}
                  onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                >
                  <option value="Classroom">Classroom</option>
                  <option value="Computer Lab">Computer Lab</option>
                  <option value="Seminar Hall">Seminar Hall</option>
                  <option value="Auditorium">Auditorium</option>
                  <option value="Library">Library</option>
                  <option value="Restroom">Restroom</option>
                  <option value="Cafeteria">Cafeteria</option>
                  <option value="Faculty Room">Faculty Room</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Installed Equipment / Facilities (Comma-separated)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Epson Projector, Central AC, Mic PA System"
                  value={formData.facilities}
                  onChange={(e) => setFormData({ ...formData, facilities: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <textarea
                  className="form-textarea"
                  rows="2"
                  placeholder="Smart lecture hall with 70-seater gallery layout"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Register Venue & QR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR CODE VIEW & DOWNLOAD MODAL */}
      {showQrModal && activeLocation && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px', textAlign: 'center' }}>
            <div className="modal-header">
              <div className="modal-title">Printable Classroom QR Sticker</div>
              <button onClick={() => setShowQrModal(false)} className="close-btn">
                <X size={20} />
              </button>
            </div>

            {/* Printable Physical Sticker Container */}
            <div
              style={{
                border: '2px dashed #cbd5e1',
                borderRadius: 'var(--radius-lg)',
                padding: '24px 16px 20px',
                background: '#fff',
                boxShadow: 'var(--shadow-sm)',
                marginBottom: '20px',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--primary)' }}>
                Presidency University – Smart Campus
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--secondary)', marginTop: '2px' }}>
                {activeLocation.roomNumber} ({activeLocation.block})
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {activeLocation.buildingName} • {activeLocation.floor}
              </div>

              {/* QR Image Canvas */}
              <div style={{ margin: '18px auto', display: 'inline-block' }}>
                {qrDataUrl && (
                  <img
                    src={qrDataUrl}
                    alt={activeLocation.qrCode}
                    style={{ width: '220px', height: '220px', borderRadius: '8px' }}
                  />
                )}
              </div>

              <div
                style={{
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  fontSize: '13px',
                  background: '#f1f5f9',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  display: 'inline-block',
                  color: '#1e293b',
                  border: '1px solid #cbd5e1',
                }}
              >
                {activeLocation.qrCode}
              </div>

              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                Scan via Smart Campus Connect Mobile App to report issues
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleDownloadQr}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                <Download size={16} /> Download Sticker PNG
              </button>
              <button
                onClick={() => window.print()}
                className="btn btn-secondary"
                style={{ padding: '8px 14px' }}
                title="Print"
              >
                <Printer size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageLocations;

