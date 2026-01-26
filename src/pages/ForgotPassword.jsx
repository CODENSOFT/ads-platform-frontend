import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../api/endpoints';
import { useToast } from '../hooks/useToast';
import { parseError } from '../utils/errorParser';

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

    // Validation
    if (!email) {
      setError('Email is required');
      return;
    }

    setLoading(true);

    try {
      await forgotPassword({ email });
      // Success - show success message only in try block after request succeeds (status 200)
      setSuccess(true);
      showSuccess('If an account exists with this email, a password reset link has been sent.');
    } catch (err) {
      // Detect status and error type from Axios response
      const status = err?.response?.status;
      const type = err?.response?.data?.details?.type;
      const msgFromApi = err?.response?.data?.message;

      // If status === 404 OR type === "EMAIL_NOT_FOUND"
      if (status === 404 || type === "EMAIL_NOT_FOUND") {
        // Show error message (use API message if available, otherwise default)
        const msg = msgFromApi || "Cont cu emailul dat nu există";
        setError(msg);
        showError(msg);
        // STOP (return) so it does NOT show the generic success message
        return;
      }

      // Otherwise keep existing behavior
      const errorMessage = parseError(err);
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="container" style={{ maxWidth: '450px' }}>
        <div className="card">
          {success ? (
            <>
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                <h1 style={{ 
                  fontSize: '2rem', 
                  fontWeight: '700', 
                  color: '#1a1a1a',
                  marginBottom: '8px',
                }}>
                  Check Your Email
                </h1>
                <p style={{ color: '#666', fontSize: '15px' }}>
                  If an account exists with this email, a password reset link has been sent.
                </p>
              </div>
              <Link 
                to="/login"
                className="btn-primary"
                style={{ 
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  textAlign: 'center',
                  display: 'block',
                }}
              >
                Back to Login
              </Link>
            </>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <h1 style={{ 
                  fontSize: '2rem', 
                  fontWeight: '700', 
                  color: '#1a1a1a',
                  marginBottom: '8px',
                }}>
                  Forgot Password?
                </h1>
                <p style={{ color: '#666', fontSize: '15px' }}>
                  Enter your email and we'll send you a reset link
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '24px' }}>
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    placeholder="Enter your email"
                    style={{ width: '100%' }}
                  />
                </div>
                {error && (
                  <div style={{ 
                    color: '#c53030', 
                    backgroundColor: '#fff5f5',
                    padding: '12px',
                    borderRadius: '6px',
                    marginBottom: '20px',
                    fontSize: '14px',
                    border: '1px solid #fed7d7',
                  }}>
                    {error}
                  </div>
                )}
                <button 
                  type="submit" 
                  disabled={loading}
                  className="btn-primary"
                  style={{ 
                    width: '100%',
                    padding: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                  }}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>

              <div style={{ 
                marginTop: '24px', 
                textAlign: 'center',
                paddingTop: '24px',
                borderTop: '1px solid #e0e0e0',
              }}>
                <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
                  Remember your password?{' '}
                  <Link 
                    to="/login" 
                    style={{ 
                      color: '#007bff',
                      fontWeight: '500',
                      textDecoration: 'none',
                    }}
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
