
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { getDashboardPathForRole, getRoleFromToken, saveAuthSession } from '../utils/auth';
import { getErrorMessage } from '../utils/error';
import './Login.css';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (location.state?.registrationSuccess) {
      setSuccessMessage('Registration successful. Please sign in with your new account.');
    }
  }, [location.state]);

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!username.trim() || !password) {
      setError('Username or email address and password are required.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', {
        username: username.trim(),
        password,
      });

      const token = response.data?.token || response.data?.jwt || response.data?.accessToken;
      if (!token) {
        throw new Error('No authentication token was returned by the backend.');
      }

      const role = response.data?.role || response.data?.user?.role || getRoleFromToken(token);
      if (!role) {
        setError('Login succeeded, but the backend did not return a usable role. Please verify JWT claims or backend role configuration.');
        return;
      }

      const authenticatedUsername =
        response.data?.username ||
        response.data?.user?.username ||
        response.data?.userDetails?.username ||
        null;
      saveAuthSession({ token, role, username: authenticatedUsername });
      navigate(getDashboardPathForRole(role), { replace: true });
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Login failed. Please check your username and password.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={handleLogin} noValidate>
        <div className="login-header-block">
          <p className="eyebrow">Secure access</p>
          <h1>Loan Approval System</h1>
        </div>
        <p className="login-subtitle">Loan application and credit risk management</p>

        <div className="field-group">
          <label htmlFor="username">Username or email address</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            required
          />
        </div>

        <div className="field-group">
          <label htmlFor="password">Password</label>
          <div className="password-row">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="toggle-password-btn"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {error && <p className="form-error" role="alert">{error}</p>}
        {successMessage && <p className="form-success">{successMessage}</p>}

        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

        <p className="switch-link">
          Need an account? <Link to="/register">Create one</Link>
        </p>
      </form>
    </main>
  );
}

export default Login;
