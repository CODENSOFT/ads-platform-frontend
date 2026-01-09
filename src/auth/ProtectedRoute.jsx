import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = () => {
  const { user } = useAuth();
  const location = useLocation();
  
  // Always allow access to reset-password route, even when logged in
  // This bypass ensures reset-password is never blocked
  if (location.pathname.startsWith('/reset-password/')) {
    return <Outlet />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  
  return <Outlet />;
};

export default ProtectedRoute;

