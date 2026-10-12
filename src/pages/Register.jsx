import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { getErrorMessage } from '../utils/error';
import './Register.css';

const initialForm = {
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
};

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [requestError, setRequestError] = useState('');
  const [registered, setRegistered] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
    setRequestError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const username = form.username.trim();
    const email = form.email.trim();
    const validationErrors = {};
    if (username.length < 3 || username.length > 50) {
      validationErrors.username = 'Username must be 3 to 50 characters.';
    }
    if (!email) {
      validationErrors.email = 'Enter your email address.';
    } else if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      validationErrors.email = 'Enter a valid email address (up to 254 characters).';
    }
    if (form.password.length < 8 || form.password.length > 72) {
      validationErrors.password = 'Password must be 8 to 72 characters.';
    }
    if (!form.confirmPassword) {
      validationErrors.confirmPassword = 'Confirm your password.';
    } else if (form.password !== form.confirmPassword) {
      validationErrors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors({});
    setRequestError('');

    try {
      await api.post('/auth/register', {
        username,
        email,
        password: form.password,
      });
      setForm(initialForm);
      setRegistered(true);
    } catch (requestError) {
      if (requestError.response?.status === 409) {
        setRequestError('That username or email address is already registered. Sign in or use different details.');
      } else {
        setRequestError(getErrorMessage(requestError, 'Registration failed. Please try again.'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (registered) {
    return (
      <main className="register-page">
        <section className="register-card" aria-labelledby="register-success-title">
          <div className="register-heading">
            <p className="eyebrow">Account registration</p>
            <h1 id="register-success-title">Registration complete</h1>
          </div>
          <p className="register-success" role="status">
            Your account was created. You can now sign in.
          </p>
          <button
            className="register-submit"
            type="button"
            onClick={() => navigate('/login', { replace: true, state: { registrationSuccess: true } })}
          >
            Return to sign in
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="register-page">
      <form className="register-card" onSubmit={handleSubmit} noValidate>
        <div className="register-heading">
          <p className="eyebrow">Applicant account</p>
          <h1>Create your account</h1>
          <p className="register-subtitle">Register to submit and track loan applications.</p>
        </div>

        <div className="register-field">
          <label htmlFor="register-username">Username <span aria-hidden="true">*</span></label>
          <input
            id="register-username"
            name="username"
            type="text"
            autoComplete="username"
            minLength={3}
            maxLength={50}
            aria-invalid={Boolean(errors.username)}
            aria-describedby={errors.username ? 'register-username-error' : undefined}
            value={form.username}
            onChange={handleChange}
            required
          />
          {errors.username && <p className="register-field-error" id="register-username-error">{errors.username}</p>}
        </div>

        <div className="register-field">
          <label htmlFor="register-email">Email address <span aria-hidden="true">*</span></label>
          <input
            id="register-email"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'register-email-error' : undefined}
            value={form.email}
            onChange={handleChange}
            required
          />
          {errors.email && <p className="register-field-error" id="register-email-error">{errors.email}</p>}
        </div>

        <div className="register-field">
          <label htmlFor="register-password">Password <span aria-hidden="true">*</span></label>
          <div className="register-password-row">
            <input
              id="register-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'register-password-error' : undefined}
              value={form.password}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="register-password-toggle"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {errors.password && <p className="register-field-error" id="register-password-error">{errors.password}</p>}
        </div>

        <div className="register-field">
          <label htmlFor="register-confirm-password">Confirm password <span aria-hidden="true">*</span></label>
          <input
            id="register-confirm-password"
            name="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={errors.confirmPassword ? 'register-confirm-password-error' : undefined}
            value={form.confirmPassword}
            onChange={handleChange}
            required
          />
          {errors.confirmPassword && (
            <p className="register-field-error" id="register-confirm-password-error">{errors.confirmPassword}</p>
          )}
        </div>

        {requestError && (
          <p className="register-error" role="alert">
            {requestError}
          </p>
        )}

        <button className="register-submit" type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Register'}
        </button>

        <p className="register-login-link">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </main>
  );
}

export default Register;
