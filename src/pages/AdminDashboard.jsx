import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios';
import AuthenticatedAccount from '../components/AuthenticatedAccount';
import LogoutButton from '../components/LogoutButton';
import { getErrorMessage } from '../utils/error';
import './Dashboard.css';

const initialMetrics = {
  totalApplications: 0,
  pendingApplications: 0,
  approvedApplications: 0,
  rejectedApplications: 0,
};

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return '—';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(date);
}

function normalizeApplications(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.applications)) {
    return data.applications;
  }

  return [];
}

function AdminDashboard() {
  const [metrics, setMetrics] = useState(initialMetrics);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [decisionReasons, setDecisionReasons] = useState({});
  const [processingId, setProcessingId] = useState(null);
  const [processingDecision, setProcessingDecision] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');

    const [dashboardResult, applicationsResult] = await Promise.allSettled([
      api.get('/admin/dashboard'),
      api.get('/admin/applications'),
    ]);

    const errors = [];
    if (dashboardResult.status === 'fulfilled') {
      const data = dashboardResult.value.data ?? {};
      setMetrics({
        totalApplications: toNumber(data.totalApplications),
        pendingApplications: toNumber(data.pendingApplications),
        approvedApplications: toNumber(data.approvedApplications),
        rejectedApplications: toNumber(data.rejectedApplications),
      });
    } else {
      errors.push(`Dashboard statistics: ${getErrorMessage(dashboardResult.reason)}`);
    }

    if (applicationsResult.status === 'fulfilled') {
      setApplications(normalizeApplications(applicationsResult.value.data));
    } else {
      errors.push(`Applications: ${getErrorMessage(applicationsResult.reason)}`);
    }

    setError(errors.join(' '));
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleDecision = async (application, decision) => {
    const applicationId = application.applicationId;
    const reason = (decisionReasons[applicationId] ?? '').trim();

    if (!reason) {
      setError('Enter a reason before approving or rejecting an application.');
      return;
    }

    if (application.status !== 'PENDING' || processingId !== null) {
      return;
    }

    const decisionLabel = decision === 'APPROVED' ? 'approve' : 'reject';
    if (!window.confirm(`Confirm that you want to ${decisionLabel} application #${applicationId}?`)) {
      return;
    }

    setProcessingId(applicationId);
    setProcessingDecision(decision);
    setError('');
    setSuccessMessage('');

    try {
      await api.post(`/loans/applications/${applicationId}/decision`, {
        decision,
        reason,
      });
      setSuccessMessage(`Application #${applicationId} was ${decision === 'APPROVED' ? 'approved' : 'rejected'}.`);
      setDecisionReasons((current) => ({ ...current, [applicationId]: '' }));
      await refresh();
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to record the loan decision.'));
    } finally {
      setProcessingId(null);
      setProcessingDecision(null);
    }
  };

  return (
    <div className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Operations overview</p>
          <h1>Admin dashboard</h1>
        </div>
        <div className="dashboard-actions">
          <AuthenticatedAccount />
          <button type="button" className="secondary-button" onClick={refresh} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <LogoutButton />
        </div>
      </header>

      {error && <p className="form-error dashboard-message" role="alert">{error}</p>}
      {successMessage && <p className="form-success dashboard-message" role="status">{successMessage}</p>}

      <section aria-label="Application statistics" className="stats-grid">
        <div className="stat-card">
          <span>Total applications</span>
          <strong>{loading ? '—' : metrics.totalApplications}</strong>
        </div>
        <div className="stat-card">
          <span>Pending</span>
          <strong>{loading ? '—' : metrics.pendingApplications}</strong>
        </div>
        <div className="stat-card">
          <span>Approved</span>
          <strong>{loading ? '—' : metrics.approvedApplications}</strong>
        </div>
        <div className="stat-card">
          <span>Rejected</span>
          <strong>{loading ? '—' : metrics.rejectedApplications}</strong>
        </div>
      </section>

      <section className="panel admin-applications-panel">
        <div className="panel-header">
          <h2>Loan applications</h2>
        </div>

        {loading ? (
          <p className="state-copy">Loading applications...</p>
        ) : applications.length === 0 ? (
          <p className="state-copy">No loan applications were returned.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Application</th>
                  <th>Applicant</th>
                  <th>Loan type</th>
                  <th>Amount</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Decision</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((application) => {
                  const applicationId = application.applicationId;
                  const status = String(application.status ?? 'UNKNOWN').toUpperCase();
                  const pending = status === 'PENDING';
                  const processing = processingId === applicationId;

                  return (
                    <tr key={applicationId}>
                      <td>#{applicationId ?? '—'}</td>
                      <td>
                        <span className="applicant-primary">{application.applicantUsername || 'Unknown applicant'}</span>
                        {application.applicantEmail && (
                          <span className="applicant-secondary">{application.applicantEmail}</span>
                        )}
                      </td>
                      <td>{application.loanTypeName || '—'}</td>
                      <td>{formatCurrency(application.amount)}</td>
                      <td>{formatDate(application.createdAt)}</td>
                      <td>
                        <span className={`status-badge status-${status.toLowerCase()}`}>{status}</span>
                      </td>
                      <td>
                        <div className="admin-decision-controls">
                          <label className="sr-only" htmlFor={`reason-${applicationId}`}>
                            Decision reason for application {applicationId}
                          </label>
                          <textarea
                            id={`reason-${applicationId}`}
                            rows="2"
                            maxLength={500}
                            value={decisionReasons[applicationId] ?? ''}
                            onChange={(event) => {
                              const { value } = event.target;
                              setDecisionReasons((current) => ({ ...current, [applicationId]: value }));
                            }}
                            placeholder="Decision reason"
                            disabled={!pending || processingId !== null}
                          />
                          <div className="decision-actions">
                            <button
                              type="button"
                              className="approve-button"
                              onClick={() => handleDecision(application, 'APPROVED')}
                              disabled={!pending || processingId !== null}
                            >
                              {processing && processingDecision === 'APPROVED' ? 'Saving...' : 'Approve'}
                            </button>
                            <button
                              type="button"
                              className="reject-button"
                              onClick={() => handleDecision(application, 'REJECTED')}
                              disabled={!pending || processingId !== null}
                            >
                              {processing && processingDecision === 'REJECTED' ? 'Saving...' : 'Reject'}
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminDashboard;
