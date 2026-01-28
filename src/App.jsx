import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './auth/ProtectedRoute';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdDetails from './pages/AdDetails';
import Favorites from './pages/Favorites';
import CreateAd from './pages/CreateAd';
import MyAds from './pages/MyAds';
import Chats from './pages/Chats';
import ChatDetail from './pages/ChatDetail';
import AdsPage from './pages/AdsPage';

const CatchAllRedirect = () => {
  return <Navigate to="/" replace />;
};

const App = () => {

  // Check hash directly based on current location (computed on each render)
  const hash = window.location.hash || '';
  const pathname = window.location.pathname;
  
  // Check if we're on reset password route
  const resetMatch = hash.match(/#\/reset-password\/(.+)/) || pathname.match(/\/reset-password\/(.+)/);
  const forgotMatch = hash.includes('#/forgot-password') || pathname.includes('/forgot-password');
  
  const forceReset = !!(resetMatch && resetMatch[1]);
  const forceForgot = !!forgotMatch;

  // Handle external links without hash (from Railway emails)
  useEffect(() => {
    const pathname = window.location.pathname;
    const hash = window.location.hash;
    
    // If we have a pathname but no hash (or empty hash), convert it to hash routing
    if (pathname && pathname !== '/' && (!hash || hash === '#')) {
      // Extract the path and convert to hash format
      const hashPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
      window.location.hash = hashPath;
    }
  }, []); // Run only once on mount

  // If we detect reset password in hash but route didn't match, render directly
  if (forceReset) {
    return <ResetPassword />;
  }
  
  if (forceForgot) {
    return <ForgotPassword />;
  }

  return (
    <>
      <Navbar />
      <Routes>
        {/* ✅ PUBLIC ROUTES (top-level) - ORDER MATTERS! */}
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/ads/:id" element={<AdDetails />} />
        <Route path="/ads" element={<AdsPage />} />
        
        {/* ✅ PUBLIC HOME */}
        <Route path="/" element={<Home />} />
        
        {/* ✅ PROTECTED ROUTES (grouped) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/create" element={<CreateAd />} />
          <Route path="/my-ads" element={<MyAds />} />
          <Route path="/chats" element={<Chats />} />
          <Route path="/chats/:id" element={<ChatDetail />} />
          <Route path="/messages" element={<Navigate to="/chats" replace />} />
        </Route>
        
        {/* ✅ Catch-all LAST */}
        <Route path="*" element={<CatchAllRedirect />} />
      </Routes>
      {/* Build stamp */}
      <div style={{
        position: 'fixed',
        bottom: 8,
        left: 8,
        fontSize: 12,
        opacity: 0.6
      }}>
        build: RESET_FIX_VERCEL_1
      </div>
    </>
  );
};

export default App;
