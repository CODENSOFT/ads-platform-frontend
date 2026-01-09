import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { forgotPassword } from '../api/endpoints';
import { useToast } from '../hooks/useToast';
import { parseError } from '../utils/errorParser';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { success: showSuccess, error: showError } = useToast();

  // Get and clean API URL
  const API = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
  const isApiMissing = !API;

  const validate = () => {
    const errors = {};

    if (!email || !email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
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

    if (isApiMissing) {
      setError('Missing VITE_API_URL');
      return;
    }

    setLoading(true);

    try {
      await forgotPassword({ email: email.trim() });
      
      setSuccess(true);
      showSuccess('If the email exists, a link was sent.');
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
        <h1>Check your email</h1>
        <p style={{ marginBottom: '20px' }}>
          If the email exists, a password reset link was sent to {email}.
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
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
          <button
            onClick={() => {
              setSuccess(false);
              setEmail('');
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
      <h1>Forgot password</h1>
      {isApiMissing && (
        <div style={{ color: 'red', marginBottom: '16px', padding: '8px', backgroundColor: '#ffe6e6', borderRadius: '4px' }}>
          Missing VITE_API_URL
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '4px' }}>
            Email:
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setValidationErrors((prev) => ({ ...prev, email: null }));
            }}
            disabled={loading || isApiMissing}
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '16px',
              border: validationErrors.email ? '1px solid red' : '1px solid #ddd',
              borderRadius: '4px',
            }}
          />
          {validationErrors.email && (
            <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
              {validationErrors.email}
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
          disabled={loading || isApiMissing}
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '16px',
            backgroundColor: (loading || isApiMissing) ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: (loading || isApiMissing) ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Sending...' : 'Send reset link'}
        </button>
      </form>
      <p style={{ marginTop: '16px', textAlign: 'center' }}>
        <Link to="/login">Back to Login</Link>
      </p>
    </div>
  );
};

export default ForgotPassword;

