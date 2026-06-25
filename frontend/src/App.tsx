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
import ProfileEdit from './pages/ProfileEdit';
import MessagesHistory from './pages/MessagesHistory';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminKeychains from './pages/admin/AdminKeychains';
import AdminUsers from './pages/admin/AdminUsers';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminRevenue from './pages/admin/AdminRevenue';
import AdminPolicies from './pages/admin/AdminPolicies';
import { AdminVouchers } from './pages/admin/AdminVouchers';
import PoliciesPage from './pages/PoliciesPage';
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
import { useCartStore } from './store/useCartStore';
import { useEffect, useState } from 'react';
import { axiosInstance } from './api/axiosInstance';
import { useLocation } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';

// Global guard to check if account is locked on every navigation
const UserStatusGuard = () => {
  const location = useLocation();
  const { isAuthenticated, clearAuth } = useAuthStore();
  const { fetchFromBackend } = useCartStore();
  
  // Sync cart on first load if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchFromBackend();
    }
  }, [isAuthenticated, fetchFromBackend]);

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

/** Waits for ?token= from NFC redirect before sending user to /login */
const ProtectedNfcProfile = () => {
  const { isAuthenticated } = useAuthStore();
  const hasUrlToken = () => new URLSearchParams(window.location.search).has('token');
  const [authReady, setAuthReady] = useState(() => isAuthenticated || !hasUrlToken());

  useEffect(() => {
    if (authReady) return;

    const unsub = useAuthStore.subscribe((state) => {
      if (state.isAuthenticated && state.user) {
        setAuthReady(true);
      }
    });

    const timeout = window.setTimeout(() => setAuthReady(true), 8000);
    return () => {
      unsub();
      window.clearTimeout(timeout);
    };
  }, [authReady]);

  if (!authReady) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <RefreshCw className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <NfcRouteGuard>
      <NfcProfile />
    </NfcRouteGuard>
  );
};

function App() {
  const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore();

  // Login from email/NFC redirect (?token=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    
    // Bỏ qua nếu đang ở trang verify-email hoặc reset-password (vì các trang này dùng token cho mục đích khác, không phải là JWT Auth Token)
    const path = window.location.pathname;
    if (path.includes('/verify-email') || path.includes('/reset-password')) return;

    if (!urlToken) return;

    localStorage.setItem('accessToken', urlToken);
    const newUrl = window.location.pathname + window.location.hash;
    window.history.replaceState({}, '', newUrl);

    axiosInstance
      .get('/users/me', { headers: { Authorization: `Bearer ${urlToken}` } })
      .then((res) => {
        if (res.data.success && res.data.data) {
          setAuth(res.data.data, urlToken);
        } else {
          clearAuth();
        }
      })
      .catch(() => clearAuth());
  }, [setAuth, clearAuth]);

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
            <Route path="/policies" element={<PoliciesPage />} />
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
            <Route path="/profile/edit" element={isAuthenticated ? <ProfileEdit /> : <Navigate to="/login" />} />
            <Route path="/nfc-profile" element={<ProtectedNfcProfile />} />
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
              <Route path="/admin/revenue" element={<AdminRevenue />} />
              <Route path="/admin/policies" element={<AdminPolicies />} />
              <Route path="/admin/vouchers" element={<AdminVouchers />} />
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
