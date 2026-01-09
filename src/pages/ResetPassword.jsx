import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { resetPassword } from '../api/endpoints';
import { useToast } from '../hooks/useToast';
import { parseError } from '../utils/errorParser';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { success: showSuccess, error: showError } = useToast();

  const validate = () => {
    const errors = {};

    // Password: min 6 chars
    if (!newPassword || newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
    }

    // Confirm password: must match
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setValidationErrors({});

    if (!validate()) {
      return;
    }

    if (!token) {
      setError('Invalid reset token');
      return;
    }

    setLoading(true);

    try {
      // Get API base URL from environment
      const API = import.meta.env.VITE_API_URL || "http://localhost:5001";
      const url = `${API}/api/auth/reset-password/${token}`;
      
      // Debug logs
      console.log("[RESET] API:", API);
      console.log("[RESET] URL:", url);
      console.log("[RESET] METHOD: POST");
      
      await resetPassword(token, { password: newPassword });
      
      setSuccess(true);
      showSuccess('Password reset successfully');
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
      <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
        <h1>Password Reset Successful</h1>
        <p style={{ marginBottom: '20px' }}>Your password has been reset successfully.</p>
        <button
          onClick={() => navigate('/login')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: 'pointer',
          }}
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
      <h1>Reset Password</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="newPassword" style={{ display: 'block', marginBottom: '4px' }}>
            New Password (min 6 characters):
          </label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setValidationErrors((prev) => ({ ...prev, newPassword: null }));
            }}
            disabled={loading}
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '16px',
              border: validationErrors.newPassword ? '1px solid red' : '1px solid #ddd',
              borderRadius: '4px',
            }}
          />
          {validationErrors.newPassword && (
            <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
              {validationErrors.newPassword}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '4px' }}>
            Confirm Password:
          </label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setValidationErrors((prev) => ({ ...prev, confirmPassword: null }));
            }}
            disabled={loading}
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '16px',
              border: validationErrors.confirmPassword ? '1px solid red' : '1px solid #ddd',
              borderRadius: '4px',
            }}
          />
          {validationErrors.confirmPassword && (
            <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
              {validationErrors.confirmPassword}
            </div>
          )}
        </div>

        {error && (
          <div style={{ color: 'red', marginBottom: '16px', padding: '8px', backgroundColor: '#ffe6e6', borderRadius: '4px' }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '16px',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;

