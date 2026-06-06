import { useEffect, useState, useRef } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { Moon, Sun, Heart, User, ShoppingCart, Languages, Compass } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useTranslation } from 'react-i18next';
import { motion, useAnimation } from 'framer-motion';
import { getInitials } from '../utils/helpers';

const MainLayout = () => {
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const { isDarkMode, toggleDarkMode } = useUIStore();
  const totalItems = useCartStore((state) => state.totalItems());
  const { i18n, t } = useTranslation();

  const cartControls = useAnimation();

  useEffect(() => {
    const handleAnimateCart = () => {
      cartControls.start({
        scale: [1, 1.35, 0.9, 1.15, 1],
        rotate: [0, -12, 12, -8, 0],
        transition: { duration: 0.5, ease: 'easeInOut' }
      });
    };

    window.addEventListener('animate-cart', handleAnimateCart);
    return () => window.removeEventListener('animate-cart', handleAnimateCart);
  }, [cartControls]);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'vi' ? 'en' : 'vi';
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background transition-colors duration-300">
      {/* Navigation */}
      <header className="sticky top-0 z-50 glass border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <Heart className="w-8 h-8 text-primary fill-primary group-hover:scale-110 transition-transform" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-pink-400 bg-clip-text text-transparent">
              TouchLove
            </span>
          </Link>

          <nav className="flex items-center gap-4">
            {(!user || user.userType === 'NFC') && (
              <Link to="/explore" className="px-3.5 py-2 text-xs font-black hover:text-primary transition-all flex items-center gap-1 bg-primary/5 text-primary rounded-xl whitespace-nowrap">
                <Compass className="w-4 h-4 hidden sm:block" /> {t('home.explore', 'Khám phá')}
              </Link>
            )}

            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 p-2 rounded-xl hover:bg-secondary transition-colors text-sm font-bold uppercase"
              aria-label="Change language"
            >
              <Languages className="w-4 h-4" />
              {i18n.language.split('-')[0]}
            </button>

            {(!user || user.userType === 'Sales') && (
              <motion.div animate={cartControls}>
                <Link to="/cart" className="p-2 rounded-full hover:bg-secondary transition-colors relative block">
                  <ShoppingCart className="w-5 h-5" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </Link>
              </motion.div>
            )}

            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-secondary transition-colors"
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none"
                >
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-xs font-black text-primary">{getInitials(user?.nickname || user?.displayName)}</span>
                    )}
                  </div>
                  <span className="hidden sm:inline font-black tracking-tight">{user?.nickname || user?.displayName}</span>
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800 mb-2 sm:hidden">
                      <p className="font-bold text-sm truncate">{user?.nickname || user?.displayName}</p>
                    </div>
                    
                    <Link
                      to={user?.userType === 'NFC' ? '/nfc-profile' : '/profile'}
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors w-full text-left"
                    >
                      <User className="w-4 h-4" />
                      Hồ sơ cá nhân
                    </Link>

                    {user?.userType === 'Sales' && (
                      <Link
                        to="/my-orders"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors w-full text-left"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Đơn hàng của tôi
                      </Link>
                    )}

                    <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1"></div>

                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        clearAuth();
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors w-full text-left"
                    >
                      {t('common.logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium hover:text-primary transition-colors"
                >
                  {t('common.login')}
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-full hover:opacity-90 transition-opacity"
                >
                  {t('home.start_journey')}
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t py-8 bg-secondary/50">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-primary fill-primary" />
            <span className="font-bold">TouchLove</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} TouchLove. Làm bằng tất cả trái tim.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
