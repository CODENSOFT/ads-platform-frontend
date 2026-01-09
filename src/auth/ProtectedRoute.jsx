import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = () => {
  const { user } = useAuth();
  const location = useLocation();
  
  // Always allow access to reset/forgot-password routes, even when logged in
  // This bypass ensures these routes are never blocked
  const bypass = location.pathname.startsWith('/reset-password/') || 
                 location.pathname.startsWith('/forgot-password');
  if (bypass) {
    return <Outlet />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  
  return <Outlet />;
};

export default ProtectedRoute;

