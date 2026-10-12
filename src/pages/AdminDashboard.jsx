import { useEffect, useState } from 'react';
import api from '../api/axios';
import AuthenticatedAccount from '../components/AuthenticatedAccount';
import LogoutButton from '../components/LogoutButton';
import { getErrorMessage } from '../utils/error';
import './Dashboard.css';

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function AdminDashboard() {
  const [metrics, setMetrics] = useState({
    totalApplications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    rejectedApplications: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/admin/dashboard');
      const data = response.data || {};

      const summary = data.summary ?? data.dashboard ?? data;
      setMetrics({
        totalApplications: toNumber(summary.totalApplications ?? summary.total ?? data.totalApplications ?? data.total),
        pendingApplications: toNumber(summary.pendingApplications ?? summary.pending ?? data.pendingApplications ?? data.pending),
        approvedApplications: toNumber(summary.approvedApplications ?? summary.approved ?? data.approvedApplications ?? data.approved),
        rejectedApplications: toNumber(summary.rejectedApplications ?? summary.rejected ?? data.rejectedApplications ?? data.rejected),
      });
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to load the admin dashboard.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <div className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Operations overview</p>
          <h1>Admin dashboard</h1>
        </div>
        <div className="dashboard-actions">
          <AuthenticatedAccount />
          <button type="button" className="secondary-button" onClick={fetchDashboard} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <LogoutButton />
        </div>
      </header>

      {loading ? (
        <p className="state-copy">Loading dashboard counts...</p>
      ) : error ? (
        <p className="state-copy state-error">{error}</p>
      ) : (
        <div className="stats-grid">
          <div className="stat-card">
            <span>Total applications</span>
            <strong>{metrics.totalApplications}</strong>
          </div>
          <div className="stat-card">
            <span>Pending</span>
            <strong>{metrics.pendingApplications}</strong>
          </div>
          <div className="stat-card">
            <span>Approved</span>
            <strong>{metrics.approvedApplications}</strong>
          </div>
          <div className="stat-card">
            <span>Rejected</span>
            <strong>{metrics.rejectedApplications}</strong>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
