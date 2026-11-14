import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../services/api';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
} from 'lucide-react';

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [statsRes, metricsRes] = await Promise.all([
        analyticsService.getAdminStats(),
        analyticsService.getComplaintMetrics(),
      ]);

      if (statsRes.data?.data) setStats(statsRes.data.data);
      if (metricsRes.data?.data) setMetrics(metricsRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          Aggregating MongoDB Atlas metrics...
        </p>
      </div>
    );
  }

  const categoryMax = Math.max(
    ...(metrics?.byCategory?.map((c) => c.count) || [1]),
    1
  );

  return (
    <div>
      {/* Top Summary Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
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
          <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Campus Operational Insights</h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '3px' }}>
            Real-time analytics computed directly from MongoDB Atlas collections for Presidency University.
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--success)' }}>
            {stats?.complaints?.resolutionRate || '100%'}
          </div>
          <div style={{ fontSize: '11.5px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Ticket Resolution SLA
          </div>
        </div>
      </div>

      {/* Two Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Category Breakdown (SVG / CSS Bar Chart) */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div className="card-title">
              <BarChart3 size={18} style={{ color: 'var(--primary)' }} />
              Complaints by Hardware & Facility Category
            </div>
          </div>

          {!metrics?.byCategory || metrics.byCategory.length === 0 ? (
            <div className="empty-state">No categorized complaint data yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {metrics.byCategory.map((cat) => {
                const percentage = Math.round((cat.count / categoryMax) * 100);
                return (
                  <div key={cat._id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                      <span>{cat._id}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{cat.count} ticket(s)</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${percentage}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)',
                          borderRadius: '4px',
                          transition: 'width 0.6s ease',
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Priority Breakdown */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div className="card-title">
              <AlertCircle size={18} style={{ color: 'var(--accent)' }} />
              Complaints by Severity Priority
            </div>
          </div>

          {!metrics?.byPriority || metrics.byPriority.length === 0 ? (
            <div className="empty-state">No priority data yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {metrics.byPriority.map((p) => {
                const priorityColors = {
                  Urgent: '#dc2626',
                  High: '#ea580c',
                  Medium: '#2563eb',
                  Low: '#64748b',
                };
                const color = priorityColors[p._id] || '#2563eb';
                const totalC = stats?.complaints?.total || 1;
                const pct = Math.round((p.count / totalC) * 100);

                return (
                  <div key={p._id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: color }}></span>
                        {p._id} Priority
                      </span>
                      <span>{p.count} ({pct}%)</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: color,
                          borderRadius: '4px',
                          transition: 'width 0.6s ease',
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Campus Resource Summary Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <TrendingUp size={18} style={{ color: 'var(--primary)' }} />
            Campus Utilization Scorecard
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '16px', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Total Complaints Processed</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--secondary)', marginTop: '4px' }}>
              {stats?.complaints?.total ?? 0}
            </div>
          </div>

          <div style={{ padding: '16px', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Active Campus Locations & QRs</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--secondary)', marginTop: '4px' }}>
              {stats?.locations?.totalActive ?? 0}
            </div>
          </div>

          <div style={{ padding: '16px', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Approved Venue Reservations</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--secondary)', marginTop: '4px' }}>
              {stats?.bookings?.approved ?? 0}
            </div>
          </div>

          <div style={{ padding: '16px', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Total Event Registrations</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--secondary)', marginTop: '4px' }}>
              {stats?.events?.totalRegistrations ?? 0}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;

