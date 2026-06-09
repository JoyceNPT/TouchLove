import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Key, 
  Users, 
  FileText, 
  Settings, 
  LogOut, 
  Heart,
  ChevronRight,
  ShoppingBag,
  Package,
  Ticket,
  Menu,
  X
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const AdminLayout = () => {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: Key, label: 'Móc khóa', path: '/admin/keychains' },
    { icon: Package, label: 'Sản phẩm', path: '/admin/products' },
    { icon: ShoppingBag, label: 'Đơn hàng', path: '/admin/orders' },
    { icon: Ticket, label: 'Vouchers', path: '/admin/vouchers' },
    { icon: Users, label: 'Người dùng', path: '/admin/users' },
    { icon: FileText, label: 'Báo cáo doanh thu', path: '/admin/revenue' },
    { icon: FileText, label: 'Chính sách & Điều khoản', path: '/admin/policies' },
  ];

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:sticky top-0 z-50 h-screen w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
              <Heart className="w-6 h-6 fill-current" />
            </div>
            <span className="text-xl font-black tracking-tight">Admin<span className="text-primary">Love</span></span>
          </div>
          <button className="md:hidden p-2 bg-zinc-100 rounded-lg" onClick={() => setIsSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                location.pathname === item.path
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5" />
                <span className="font-bold">{item.label}</span>
              </div>
              {location.pathname === item.path && <ChevronRight className="w-4 h-4" />}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
              <img src={`https://ui-avatars.com/api/?name=${user?.email}&background=random`} alt="Admin" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{user?.email}</p>
              <p className="text-xs text-zinc-500">Administrator</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-destructive hover:bg-destructive/10 rounded-xl transition-all font-bold"
          >
            <LogOut className="w-5 h-5" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 bg-white rounded-lg border shadow-sm" onClick={() => setIsSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold truncate hidden sm:block">
              {navItems.find(i => i.path === location.pathname)?.label || 'Admin Panel'}
            </h2>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <Link 
              to="/profile" 
              className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl text-xs font-black transition-all whitespace-nowrap"
            >
              <Users className="w-4 h-4" /> <span className="hidden sm:inline">Quay lại Profile</span>
            </Link>
            <div className="p-2 glass rounded-lg cursor-pointer hidden sm:block">
              <Settings className="w-5 h-5" />
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
