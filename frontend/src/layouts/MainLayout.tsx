import { Outlet, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { Moon, Sun, Heart, User, ShoppingCart, Languages } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useTranslation } from 'react-i18next';

const MainLayout = () => {
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const { isDarkMode, toggleDarkMode } = useUIStore();
  const totalItems = useCartStore((state) => state.totalItems());
  const { i18n, t } = useTranslation();

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
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 p-2 rounded-xl hover:bg-secondary transition-colors text-sm font-bold uppercase"
              aria-label="Change language"
            >
              <Languages className="w-4 h-4" />
              {i18n.language.split('-')[0]}
            </button>

            <Link to="/cart" className="p-2 rounded-full hover:bg-secondary transition-colors relative">
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>

            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-secondary transition-colors"
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <Link to="/profile" className="flex items-center gap-2 hover:text-primary transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <span className="hidden sm:inline font-medium">{user?.displayName}</span>
                </Link>
                <Link to="/my-orders" className="text-sm font-medium hover:text-primary transition-colors hidden md:block">
                  Đơn hàng
                </Link>
                <button
                  onClick={clearAuth}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('common.logout')}
                </button>
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
