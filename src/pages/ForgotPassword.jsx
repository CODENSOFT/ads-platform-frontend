import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../api/endpoints';
import { useToast } from '../hooks/useToast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { success: showSuccess } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validation
    if (!email) {
      setError('Email is required');
      return;
    }

    setLoading(true);

    try {
      await forgotPassword({ email });
      // Always show success message for security (even if email not found)
      setSuccess(true);
      showSuccess('If an account exists with this email, a password reset link has been sent.');
    } catch {
      // Always show success message for security (even on error)
      setSuccess(true);
      showSuccess('If an account exists with this email, a password reset link has been sent.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Forgot Password</h1>
      {success ? (
        <div>
          <div style={{ color: 'green', marginBottom: '16px' }}>
            If an account exists with this email, a password reset link has been sent.
          </div>
          <Link to="/login">Back to Login</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          {error && <div style={{ color: 'red' }}>{error}</div>}
          <button type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      )}
      <p>
        Remember your password? <Link to="/login">Login</Link>
      </p>
    </div>
  );
};

export default ForgotPassword;
