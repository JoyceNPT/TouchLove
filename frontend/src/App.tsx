import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import CouplePage from './pages/CouplePage';
import ActivateKeychain from './pages/ActivateKeychain';
import Pairing from './pages/Pairing';
import Profile from './pages/Profile';
import MessagesHistory from './pages/MessagesHistory';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminKeychains from './pages/admin/AdminKeychains';
import AdminUsers from './pages/admin/AdminUsers';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminRoute from './components/auth/AdminRoute';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import SecuritySettings from './pages/SecuritySettings';
import ProductDetail from './pages/ProductDetail';
import UserOrders from './pages/UserOrders';
import NfcUnlock from './pages/NfcUnlock';
import NfcProfile from './pages/NfcProfile';
import Explore from './pages/Explore';
import NfcSetupPin from './pages/NfcSetupPin';
import NfcRedirect from './pages/NfcRedirect';
import { ToastContainer } from './components/shared/ToastContainer';
import { useAuthStore } from './store/authStore';
import { useEffect } from 'react';
import axios from 'axios';
import { axiosInstance } from './api/axiosInstance';
import { useLocation } from 'react-router-dom';

// Global guard to check if account is locked on every navigation
const UserStatusGuard = () => {
  const location = useLocation();
  const { isAuthenticated, clearAuth } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      axiosInstance.get('/users/me')
        .then(res => {
          if (!res.data.success || !res.data.data.isActive) {
            // clearAuth is also triggered by axios interceptor on 401
          }
        })
        .catch(() => {
          // Error handled by interceptor
        });
    }
  }, [location.pathname, isAuthenticated]);

  return null;
};

// Guard for Sales / Shopping routes
const SalesRouteGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated } = useAuthStore();
  if (isAuthenticated && user && user.userType === 'NFC') {
    return <Navigate to="/nfc-profile" replace />;
  }
  return <>{children}</>;
};

// Guard for NFC / Explore / Couple routes
const NfcRouteGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated } = useAuthStore();
  if (isAuthenticated && user && user.userType === 'Sales') {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

function App() {
  const { user, isAuthenticated, setToken, setUser, clearAuth } = useAuthStore();

  // 1. Sync check for URL token (login from email/NFC)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    if (urlToken) {
      setToken(urlToken);
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, '', newUrl);
      
      axios.get('/api/users/me', { headers: { Authorization: `Bearer ${urlToken}` } })
        .then(res => {
          if (res.data.success) setUser(res.data.data);
          else clearAuth();
        })
        .catch(() => clearAuth());
    }
  }, []);

  useEffect(() => {
    // Sync theme on mount
    const theme = localStorage.getItem('theme');
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <HelmetProvider>
      <Router>
        <UserStatusGuard />
        <ToastContainer />
        <Routes>
          {/* Public Couple Pages */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<SalesRouteGuard><Home /></SalesRouteGuard>} />
            <Route path="/couple/:coupleId" element={<NfcRouteGuard><CouplePage /></NfcRouteGuard>} />
            <Route path="/couple/:coupleId/messages" element={<NfcRouteGuard><MessagesHistory /></NfcRouteGuard>} />
            <Route path="/cart" element={<SalesRouteGuard><CartPage /></SalesRouteGuard>} />
            <Route path="/checkout" element={<SalesRouteGuard><CheckoutPage /></SalesRouteGuard>} />
            <Route path="/products/:slug" element={<SalesRouteGuard><ProductDetail /></SalesRouteGuard>} />
            <Route path="/explore" element={<NfcRouteGuard><Explore /></NfcRouteGuard>} />
            <Route path="/my-orders" element={isAuthenticated ? (user?.userType === 'Sales' ? <UserOrders /> : <Navigate to="/nfc-profile" />) : <Navigate to="/login" />} />
          </Route>

          {/* Auth Pages */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
            <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
          </Route>

          {/* Standalone full-screen pages */}
          <Route path="/nfc-unlock/:keyId" element={<NfcUnlock />} />
          <Route path="/nfc-setup-pin/:keyId" element={<NfcSetupPin />} />
          <Route path="/nfc/:keyId" element={<NfcRedirect />} />

          {/* Protected NFC Flows */}
          <Route element={<MainLayout />}>
            <Route path="/profile" element={isAuthenticated ? (user?.userType === 'Sales' ? <Profile /> : <Navigate to="/nfc-profile" />) : <Navigate to="/login" />} />
            <Route path="/nfc-profile" element={isAuthenticated ? (<NfcRouteGuard><NfcProfile /></NfcRouteGuard>) : <Navigate to="/login" />} />
            <Route path="/profile/security" element={isAuthenticated ? <SecuritySettings /> : <Navigate to="/login" />} />
            <Route 
              path="/activate/:keyId" 
              element={isAuthenticated ? <ActivateKeychain /> : <Navigate to={`/login?redirect=/activate/${window.location.pathname.split('/').pop()}`} />} 
            />
            <Route 
              path="/pair/:keyId" 
              element={isAuthenticated ? <Pairing /> : <Navigate to={`/login?redirect=/pair/${window.location.pathname.split('/').pop()}`} />} 
            />
          </Route>

          {/* Admin Routes */}
          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/keychains" element={<AdminKeychains />} />
              <Route path="/admin/products" element={<AdminProducts />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/couples" element={<div>Đang phát triển...</div>} />
              <Route path="/admin/templates" element={<div>Đang phát triển...</div>} />
            </Route>
          </Route>

          {/* 404 Redirect */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </HelmetProvider>
  );
}

export default App;
