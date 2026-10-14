import { useEffect, useState } from 'react';
import api from '../api/axios';
import AuthenticatedAccount from '../components/AuthenticatedAccount';
import LogoutButton from '../components/LogoutButton';
import { getErrorMessage } from '../utils/error';
import './Dashboard.css';

const loanTypeMap = {
  1: 'PERSONAL',
  2: 'HOME',
  3: 'EDUCATION',
};

function normalizeApplications(responseData) {
  if (Array.isArray(responseData)) {
    return responseData;
  }

  if (Array.isArray(responseData?.applications)) {
    return responseData.applications;
  }

  if (Array.isArray(responseData?.content)) {
    return responseData.content;
  }

  if (Array.isArray(responseData?.data)) {
    return responseData.data;
  }

  return [];
}

function getLoanTypeLabel(application) {
  const raw = application.loanTypeId ?? application.loanType?.id ?? application.loanTypeName ?? application.loanType;

  if (typeof raw === 'number') {
    return loanTypeMap[raw] ?? `Loan type ${raw}`;
  }

  if (typeof raw === 'string' && raw.trim()) {
    return raw.trim().toUpperCase();
  }

  return 'Unknown';
}

function getApplicantName(application) {
  return (
    application.applicantName ||
    application.applicant?.username ||
    application.user?.username ||
    application.username ||
    'Unknown applicant'
  );
}

function getAssessmentValues(payload) {
  const assessment = payload?.assessment ?? payload?.creditAssessment ?? payload?.data ?? payload;
  const score = assessment?.creditScore ?? assessment?.score ?? assessment?.riskScore ?? assessment?.credit_history_score ?? null;
  const risk = assessment?.riskCategory ?? assessment?.risk ?? assessment?.riskLevel ?? assessment?.category ?? 'Not recorded';
  return { score, risk };
}

function OfficerDashboard() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assessmentLoading, setAssessmentLoading] = useState(false);
  const [error, setError] = useState('');
  const [assessmentResult, setAssessmentResult] = useState(null);

  const fetchPendingApplications = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/loans/applications/pending');
      setApplications(normalizeApplications(response.data));
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to load pending applications.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingApplications();
  }, []);

  const handleAssessRisk = async (applicationId) => {
    setAssessmentLoading(true);
    setError('');

    try {
      const response = await api.post(`/credit/assess/${applicationId}`);
      const { score, risk } = getAssessmentValues(response.data);
      setAssessmentResult({
        applicationId,
        score: score ?? 'Not available',
        risk: risk ?? 'Not available',
      });
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to assess credit risk for this application.'));
    } finally {
      setAssessmentLoading(false);
    }
  };

  const content = (() => {
    if (loading) {
      return <p className="state-copy">Loading pending applications...</p>;
    }

    if (error) {
      return <p className="state-copy state-error">{error}</p>;
    }

    if (applications.length === 0) {
      return <p className="state-copy">There are no applications waiting for review.</p>;
    }

    return (
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Applicant</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Income</th>
              <th>Liabilities</th>
              <th>Credit</th>
              <th>Employment</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((application) => {
              const id = application.applicationId ?? application.id ?? application.application_id ?? '—';
              const status = application.status ?? application.loanStatus ?? 'PENDING';
              const riskSummary = assessmentResult?.applicationId === id ? `${assessmentResult.score} / ${assessmentResult.risk}` : 'Not assessed';

              return (
                <tr key={id}>
                  <td>#{id}</td>
                  <td>{getApplicantName(application)}</td>
                  <td>{getLoanTypeLabel(application)}</td>
                  <td>{Number(application.amount ?? application.requestedAmount ?? 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}</td>
                  <td>{Number(application.monthlyIncome ?? 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}</td>
                  <td>{Number(application.existingLiabilities ?? 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}</td>
                  <td>{application.creditHistoryScore ?? application.creditScore ?? '—'}</td>
                  <td>{application.employmentStatus ?? 'Not supplied'}</td>
                  <td><span className={`status-badge status-${String(status).toLowerCase()}`}>{status}</span></td>
                  <td>
                    <div className="action-stack">
                      <button
                        type="button"
                        className="secondary-button small"
                        onClick={() => handleAssessRisk(id)}
                        disabled={assessmentLoading}
                      >
                        {assessmentLoading ? 'Assessing...' : 'Assess risk'}
                      </button>

                      <p className="assessment-readout">{riskSummary}</p>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  })();

  return (
    <div className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Officer review</p>
          <h1>Pending applications</h1>
        </div>
        <div className="dashboard-actions">
          <AuthenticatedAccount />
          <button type="button" className="secondary-button" onClick={fetchPendingApplications} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <LogoutButton />
        </div>
      </header>

      {content}
    </div>
  );
}

export default OfficerDashboard;
