import { Outlet, Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { Sun, Moon } from 'lucide-react';

const AuthLayout = () => {
  const { isDarkMode, toggleDarkMode } = useUIStore();

  return (
    <div className="min-h-screen bg-background flex flex-col transition-colors duration-300">
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full hover:bg-secondary transition-colors"
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <Link to="/" className="flex items-center gap-2 mb-8 group">
          <Heart className="w-10 h-10 text-primary fill-primary group-hover:scale-110 transition-transform" />
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-pink-400 bg-clip-text text-transparent">
            TouchLove
          </span>
        </Link>

        <div className="w-full max-w-md glass p-8 rounded-3xl shadow-xl">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
