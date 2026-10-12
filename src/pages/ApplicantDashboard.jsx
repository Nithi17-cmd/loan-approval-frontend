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

const defaultForm = {
  loanTypeId: '1',
  amount: '',
  monthlyIncome: '',
  existingLiabilities: '',
  creditHistoryScore: '',
  employmentStatus: 'FULL_TIME',
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

function getDisplayValue(value, fallback = 'Not available') {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  return value;
}

function toCurrency(amount) {
  const numberValue = Number(amount);
  if (!Number.isFinite(numberValue)) {
    return '—';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(numberValue);
}

function formatDate(value) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function getLoanTypeLabel(loanTypeId, fallbackName) {
  const rawValue = loanTypeId ?? fallbackName;
  if (typeof rawValue === 'string' && rawValue.trim()) {
    const upper = rawValue.trim().toUpperCase();
    if (loanTypeMap[upper]) {
      return loanTypeMap[upper];
    }
    return upper;
  }

  if (typeof rawValue === 'number') {
    return loanTypeMap[rawValue] ?? `Loan type ${rawValue}`;
  }

  return 'Unknown';
}

function ApplicantDashboard() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/loans/applications/my');
      setApplications(normalizeApplications(response.data));
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to load your loan applications.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSuccessMessage('');
    setError('');

    const payload = {
      loanTypeId: Number(form.loanTypeId),
      amount: Number(form.amount),
      monthlyIncome: Number(form.monthlyIncome),
      existingLiabilities: Number(form.existingLiabilities),
      creditHistoryScore: Number(form.creditHistoryScore),
      employmentStatus: form.employmentStatus,
    };

    if ([payload.amount, payload.monthlyIncome, payload.existingLiabilities, payload.creditHistoryScore].some((value) => !Number.isFinite(value) || value < 0)) {
      setError('Please complete the form with valid positive numbers.');
      return;
    }

    if (!payload.loanTypeId || payload.creditHistoryScore < 0 || payload.creditHistoryScore > 850) {
      setError('Please enter a valid credit history score between 0 and 850.');
      return;
    }

    setSubmitting(true);

    try {
      await api.post('/loans/applications', payload);
      setForm(defaultForm);
      setSuccessMessage('Your loan application has been submitted successfully.');
      await fetchApplications();
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to submit your application.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Applicant portal</p>
          <h1>My applications</h1>
        </div>
        <div className="dashboard-actions">
          <AuthenticatedAccount />
          <button type="button" className="secondary-button" onClick={fetchApplications} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <LogoutButton />
        </div>
      </header>

      <div className="dashboard-grid two-column">
        <section className="panel">
          <div className="panel-header">
            <h2>Submit a loan application</h2>
          </div>

          <form onSubmit={handleSubmit} className="application-form" noValidate>
            <div className="form-grid">
              <label>
                <span>Loan type</span>
                <select name="loanTypeId" value={form.loanTypeId} onChange={handleChange}>
                  <option value="1">PERSONAL</option>
                  <option value="2">HOME</option>
                  <option value="3">EDUCATION</option>
                </select>
              </label>

              <label>
                <span>Requested amount</span>
                <input
                  name="amount"
                  type="number"
                  min="500"
                  step="100"
                  placeholder="25000"
                  value={form.amount}
                  onChange={handleChange}
                />
              </label>

              <label>
                <span>Monthly income</span>
                <input
                  name="monthlyIncome"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="8000"
                  value={form.monthlyIncome}
                  onChange={handleChange}
                />
              </label>

              <label>
                <span>Existing liabilities</span>
                <input
                  name="existingLiabilities"
                  type="number"
                  min="0"
                  step="100"
                  placeholder="1500"
                  value={form.existingLiabilities}
                  onChange={handleChange}
                />
              </label>

              <label>
                <span>Credit history score</span>
                <input
                  name="creditHistoryScore"
                  type="number"
                  min="0"
                  max="850"
                  placeholder="720"
                  value={form.creditHistoryScore}
                  onChange={handleChange}
                />
              </label>

              <label>
                <span>Employment status</span>
                <select name="employmentStatus" value={form.employmentStatus} onChange={handleChange}>
                  <option value="FULL_TIME">Full time</option>
                  <option value="PART_TIME">Part time</option>
                  <option value="SELF_EMPLOYED">Self-employed</option>
                  <option value="UNEMPLOYED">Unemployed</option>
                  <option value="RETIRED">Retired</option>
                </select>
              </label>
            </div>

            {error && <p className="form-error">{error}</p>}
            {successMessage && <p className="form-success">{successMessage}</p>}

            <button type="submit" className="primary-button" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit application'}
            </button>
          </form>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>Application history</h2>
          </div>

          {loading ? (
            <p className="state-copy">Loading applications...</p>
          ) : error ? (
            <p className="state-copy state-error">{error}</p>
          ) : applications.length === 0 ? (
            <p className="state-copy">No applications have been submitted yet.</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((application) => {
                    const id = application.applicationId ?? application.id ?? application.application_id ?? '—';
                    const status = getDisplayValue(application.status || application.loanStatus, 'PENDING');
                    const amount = toCurrency(application.amount ?? application.requestedAmount);
                    const loanType = getLoanTypeLabel(application.loanTypeId ?? application.loanType?.id ?? application.loanTypeName, application.loanType);
                    const submittedDate = application.submittedAt ?? application.createdAt ?? application.applicationDate;

                    return (
                      <tr key={id}>
                        <td>#{id}</td>
                        <td>{loanType}</td>
                        <td>{amount}</td>
                        <td><span className={`status-badge status-${String(status).toLowerCase()}`}>{status}</span></td>
                        <td>{formatDate(submittedDate)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default ApplicantDashboard;
