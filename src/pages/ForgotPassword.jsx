import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../api/endpoints';
import { useToast } from '../hooks/useToast';
import { parseError } from '../utils/errorParser';
import '../styles/auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { success: showSuccess, error: showError } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email) {
      setError('Email is required');
      return;
    }

    setLoading(true);

    try {
      await forgotPassword({ email });
      setSuccess(true);
      showSuccess('If an account exists with this email, a password reset link has been sent.');
    } catch (err) {
      setSuccess(false);
      const errorMessage = parseError(err);
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page auth-page">
      <div className="container">
        <div className="auth-shell auth-shell--centered">
          <div className="auth-card">
            {success ? (
              <>
                <div className="auth-mark" aria-hidden="true">
                  ✅
                </div>
                <h1 className="auth-title">Check your email</h1>
                <p className="auth-subtitle">
                  If an account exists with this email, a reset link has been sent.
                </p>
                <div className="auth-alert auth-alert--success">
                  Check your inbox.
                </div>
                <Link to="/login" className="btn btn-primary auth-btn-block">
                  Back to login
                </Link>
                <button
                  type="button"
                  className="auth-link-secondary"
                  onClick={() => setSuccess(false)}
                >
                  Use a different email
                </button>
                <div className="auth-footer">
                  <p>Remember your password? <Link to="/login">Sign in</Link></p>
                </div>
              </>
            ) : (
              <>
                <div className="auth-mark" aria-hidden="true">
                  🔐
                </div>
                <h1 className="auth-title">Forgot Password?</h1>
                <p className="auth-subtitle">
                  Enter your email and we will send you a reset link
                </p>

                <form className="auth-form" onSubmit={handleSubmit}>
                  <div className="auth-field">
                    <label htmlFor="email" className="auth-field__label">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      className="auth-field__input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      placeholder="Enter your email"
                    />
                  </div>
                  {error && (
                    <div className="auth-alert auth-alert--danger" role="alert">
                      {error}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary auth-btn-block"
                  >
                    {loading ? 'Sending…' : 'Send Reset Link'}
                  </button>
                </form>

                <div className="auth-footer">
                  <p>Remember your password? <Link to="/login">Sign in</Link></p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
