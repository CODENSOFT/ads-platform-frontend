import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useFavorites } from '../hooks/useFavorites';
import { login } from '../api/endpoints';
import { useToast } from '../hooks/useToast';
import { parseError } from '../utils/errorParser';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loginSuccess } = useAuth();
  const { loadFavorites } = useFavorites();
  const { success, error: showError } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    setLoading(true);

    try {
      const response = await login({ email, password });
      
      // Handle both response formats
      let token, user;
      if (response.data?.data?.token && response.data?.data?.user) {
        token = response.data.data.token;
        user = response.data.data.user;
      } else if (response.data?.token && response.data?.user) {
        token = response.data.token;
        user = response.data.user;
      } else {
        throw new Error('Invalid response format');
      }

      loginSuccess({ token, user });
      // Load favorites immediately after login
      await loadFavorites();
      success('Logged in');
      // Don't redirect if on reset/forgot-password routes
      const hash = window.location.hash || '';
      const isResetFlow = hash.startsWith('#/reset-password') || hash.startsWith('#/forgot-password');
      if (!isResetFlow) {
        navigate('/');
      }
    } catch (err) {
      const errorMessage = parseError(err);
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Login</h1>
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
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>
        <div style={{ marginTop: '8px', marginBottom: '8px' }}>
          <Link to="/forgot-password" style={{ fontSize: '14px', color: '#007bff' }}>
            Forgot password?
          </Link>
        </div>
        {error && <div style={{ color: 'red' }}>{error}</div>}
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p>
        Don't have an account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
};

export default Login;
