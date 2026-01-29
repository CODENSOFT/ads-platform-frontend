import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { resetPassword } from '../api/endpoints';
import { useToast } from '../hooks/useToast';
import { parseError } from '../utils/errorParser';
import '../styles/auth.css';

const ResetPassword = () => {
  const { token: tokenFromParams } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { success: showSuccess, error: showError } = useToast();

  const token = tokenFromParams || (() => {
    const hash = window.location.hash || '';
    const match = hash.match(/#\/reset-password\/(.+)/);
    return match ? match[1] : null;
  })();

  useEffect(() => {
    if (!token) {
      setError('Invalid reset token');
    }
  }, [token]);

  const handleRedirectToLogin = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
    setTimeout(() => { window.location.hash = '#/login'; }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!password || !confirmPassword) {
      setError('Both password fields are required');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password.length > 128) {
      setError('Password must be less than 128 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!token) {
      setError('Invalid reset token');
      return;
    }

    setLoading(true);

    try {
      await resetPassword(token, { password });
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setSuccess(true);
      showSuccess('Password reset successfully. Redirecting to login...');
      navigate('/login', { replace: true });
      setTimeout(() => { window.location.hash = '#/login'; }, 0);
      setTimeout(() => {
        if (!window.location.hash.includes('/login')) window.location.hash = '#/login';
      }, 50);
    } catch (err) {
      const errorMessage = parseError(err);
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="page-container">
        <div className="auth-card-wrap">
          <div className="container">
            <div className="card">
              <div className="auth-top-accent">
                <span className="auth-pill">Security</span>
              </div>
              <div className="auth-icon auth-icon--success" aria-hidden="true">
                ✓
              </div>
              <h1 className="page-title text-center">Password Reset Successful</h1>
              <p className="page-subtitle text-center">
                Your password has been reset successfully. Redirecting to login...
              </p>
              <button type="button" onClick={handleRedirectToLogin} className="btn btn-primary btn-block">
                Go to Login
              </button>
              <div className="auth-footer">
                <button type="button" onClick={handleRedirectToLogin} className="btn btn-secondary btn-block">
                  Back to Login
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="auth-card-wrap">
        <div className="container">
          <div className="card">
            <div className="auth-top-accent">
              <span className="auth-pill">Security</span>
            </div>
            <h1 className="page-title text-center">Reset Password</h1>
            <p className="page-subtitle text-center">
              Enter your new password below
            </p>

            <form onSubmit={handleSubmit}>
              <div className="form-field">
                <label htmlFor="password">New Password</label>
                <div className="auth-field__password-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    minLength={6}
                    placeholder="Enter new password (min 6 characters)"
                    className="input"
                  />
                  <button
                    type="button"
                    className="auth-field__password-toggle"
                    onClick={() => setShowPassword((p) => !p)}
                    disabled={loading}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="auth-field__hint">Use at least 6 characters.</p>
              </div>
              <div className="form-field">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="auth-field__password-wrap">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    minLength={6}
                    placeholder="Confirm your new password"
                    className="input"
                  />
                  <button
                    type="button"
                    className="auth-field__password-toggle"
                    onClick={() => setShowConfirmPassword((p) => !p)}
                    disabled={loading}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              {error && (
                <div className="auth-error" role="alert">
                  {error}
                </div>
              )}
              <button type="submit" disabled={loading} className="btn btn-primary btn-block">
                {loading ? 'Resetting…' : 'Reset Password'}
              </button>
            </form>

            <div className="auth-footer">
              <button type="button" onClick={handleRedirectToLogin} className="btn btn-secondary btn-block">
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
