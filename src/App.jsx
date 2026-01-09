import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './auth/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdDetails from './pages/AdDetails';
import Favorites from './pages/Favorites';
import CreateAd from './pages/CreateAd';
import MyAds from './pages/MyAds';

const App = () => {
  return (
    <Routes>
      {/* ✅ PUBLIC ROUTES (top-level) */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/ads/:id" element={<AdDetails />} />
      
      {/* ✅ PUBLIC HOME */}
      <Route path="/" element={<Home />} />
      
      {/* ✅ PROTECTED ROUTES (grouped) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/create" element={<CreateAd />} />
        <Route path="/my-ads" element={<MyAds />} />
      </Route>
      
      {/* ✅ Catch-all LAST */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
