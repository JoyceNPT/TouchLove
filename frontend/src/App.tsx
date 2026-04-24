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
import { useAuthStore } from './store/authStore';
import { useEffect } from 'react';

function App() {
  const { isAuthenticated } = useAuthStore();

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
        <Routes>
          {/* Public Couple Pages */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/c/:slug" element={<CouplePage />} />
          </Route>

          {/* Auth Pages */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
            <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
          </Route>

          {/* Protected NFC Flows */}
          <Route element={<MainLayout />}>
            <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
            <Route 
              path="/activate/:keyId" 
              element={isAuthenticated ? <ActivateKeychain /> : <Navigate to={`/login?redirect=/activate/${window.location.pathname.split('/').pop()}`} />} 
            />
            <Route 
              path="/pair/:keyId" 
              element={isAuthenticated ? <Pairing /> : <Navigate to={`/login?redirect=/pair/${window.location.pathname.split('/').pop()}`} />} 
            />
          </Route>

          {/* 404 Redirect */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </HelmetProvider>
  );
}

export default App;
