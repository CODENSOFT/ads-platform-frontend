import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  
  // Always allow access to reset-password route, even when logged in
  if (location.pathname.startsWith('/reset-password/')) {
    return children;
  }
  
  return user ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;

