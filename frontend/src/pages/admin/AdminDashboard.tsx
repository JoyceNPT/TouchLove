import { useEffect, useState } from 'react';
import { 
  Users, 
  Heart, 
  Smartphone, 
  Image as ImageIcon,
  TrendingUp,
  Activity
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import axiosInstance from '../../api/axiosInstance';

interface AdminStats {
  totalCouples: number;
  activeCouples: number;
  totalUsers: number;
  activeUsers: number;
  totalMemories: number;
  totalOrders: number;
  weeklyRevenue: number;
  newCouplesLast7Days: Array<{ id: string; name: string; pairedAt: string }>;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get('/admin/stats')
      .then(res => {
        if (res.data.success) setStats(res.data.data);
      })
      .catch(err => console.error('Failed to fetch stats', err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <div className="h-96 animate-pulse bg-white dark:bg-zinc-900 rounded-[2.5rem]" />;

  const statCards = [
    { label: 'Tổng người dùng', value: stats?.totalUsers || 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Cặp đôi đang yêu', value: stats?.activeCouples || 0, icon: Heart, color: 'text-pink-500', bg: 'bg-pink-500/10' },
    { label: 'Tổng Đơn (Đã XN)', value: stats?.totalOrders || 0, icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Doanh thu Tuần', value: `${(stats?.weeklyRevenue || 0).toLocaleString()}đ`, icon: Activity, color: 'text-green-500', bg: 'bg-green-500/10' },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 ${card.bg} ${card.color} rounded-2xl`}>
                <card.icon className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-zinc-500 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +12%
              </span>
            </div>
            <h3 className="text-zinc-500 text-sm font-bold">{card.label}</h3>
            <p className="text-3xl font-black mt-1">{card.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main List */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-sm border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold">Cặp đôi mới ghép đôi (7 ngày qua)</h3>
              <p className="text-sm text-zinc-500">Danh sách các cặp đôi mới nhất</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {stats?.newCouplesLast7Days.map(c => (
              <div key={c.id} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-500">
                    <Heart className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{c.name}</h4>
                    <p className="text-xs text-zinc-500">{new Date(c.pairedAt).toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>
              </div>
            ))}
            {(!stats?.newCouplesLast7Days || stats.newCouplesLast7Days.length === 0) && (
              <p className="text-center text-zinc-500 py-4">Chưa có cặp đôi nào mới trong tuần qua.</p>
            )}
          </div>
        </div>

        {/* Secondary Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-primary text-primary-foreground p-8 rounded-[2.5rem] shadow-xl shadow-primary/20 relative overflow-hidden">
            <Activity className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10" />
            <h3 className="text-lg font-bold mb-2">Lưu niệm</h3>
            <p className="text-3xl font-black mb-6">{stats?.totalMemories.toLocaleString()}</p>
            <p className="text-sm opacity-80">Tổng số album lưu niệm đã được người dùng tạo trên hệ thống.</p>
          </div>
        </div>
      </div>
    </div>
  );
};


export default AdminDashboard;
