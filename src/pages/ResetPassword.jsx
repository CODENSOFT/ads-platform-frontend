import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { resetPassword } from '../api/endpoints';
import { useToast } from '../hooks/useToast';
import { parseError } from '../utils/errorParser';

const ResetPassword = () => {
  const { token: tokenFromParams } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { success: showSuccess, error: showError } = useToast();

  // Extract token from params or hash
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
    window.location.replace(`${window.location.origin}/#/login`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
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
      setTimeout(() => {
        window.location.replace(`${window.location.origin}/#/login`);
      }, 800);
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
      <div>
        <h1>Password Reset Successful</h1>
        <div style={{ color: 'green', marginBottom: '16px' }}>
          Your password has been reset successfully. Redirecting to login...
        </div>
        <p>
          <button 
            type="button" 
            onClick={handleRedirectToLogin}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#007bff', 
              cursor: 'pointer', 
              textDecoration: 'underline',
              padding: 0,
              fontSize: 'inherit'
            }}
          >
            Go to Login
          </button>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1>Reset Password</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="password">New Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            minLength={6}
          />
        </div>
        <div>
          <label htmlFor="confirmPassword">Confirm Password:</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            minLength={6}
          />
        </div>
        {error && <div style={{ color: 'red' }}>{error}</div>}
        <button type="submit" disabled={loading}>
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
      <p style={{ marginTop: '16px' }}>
        <button 
          type="button" 
          onClick={handleRedirectToLogin}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: '#007bff', 
            cursor: 'pointer', 
            textDecoration: 'underline',
            padding: 0,
            fontSize: 'inherit'
          }}
        >
          Back to Login
        </button>
      </p>
    </div>
  );
};

export default ResetPassword;
