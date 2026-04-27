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
  nfcScansToday: number;
  nfcScansThisWeek: number;
  nfcScansThisMonth: number;
  totalMemories: number;
  templatesByStatus: {
    draft: number;
    published: number;
    archived: number;
  };
  newCouplesLast7Days: Array<{ date: string; count: number }>;
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
    { label: 'Chạm NFC hôm nay', value: stats?.nfcScansToday || 0, icon: Smartphone, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Kỷ niệm được lưu', value: stats?.totalMemories || 0, icon: ImageIcon, color: 'text-green-500', bg: 'bg-green-500/10' },
  ];

  const chartData = stats?.newCouplesLast7Days.map(d => ({
    name: new Date(d.date).toLocaleDateString('vi-VN', { weekday: 'short' }),
    count: d.count
  })) || [];

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
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-sm border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold">Cặp đôi mới</h3>
              <p className="text-sm text-zinc-500">Thống kê 7 ngày gần nhất</p>
            </div>
            <div className="flex gap-2">
              <div className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs font-bold">Tuần này</div>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="var(--color-primary)" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorCount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Secondary Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-primary text-primary-foreground p-8 rounded-[2.5rem] shadow-xl shadow-primary/20 relative overflow-hidden">
            <Activity className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10" />
            <h3 className="text-lg font-bold mb-2">Hoạt động NFC</h3>
            <p className="text-3xl font-black mb-6">{stats?.nfcScansThisWeek.toLocaleString()}</p>
            <p className="text-sm opacity-80">Tổng số lượt chạm trong tuần này. Tăng 24% so với tuần trước.</p>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-sm border border-zinc-200 dark:border-zinc-800">
            <h3 className="text-lg font-bold mb-6">Trạng thái Templates</h3>
            <div className="space-y-4">
              <StatusRow label="Đã xuất bản" count={stats?.templatesByStatus.published || 0} color="bg-green-500" />
              <StatusRow label="Bản nháp" count={stats?.templatesByStatus.draft || 0} color="bg-yellow-500" />
              <StatusRow label="Đã lưu trữ" count={stats?.templatesByStatus.archived || 0} color="bg-zinc-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatusRow = ({ label, count, color }: { label: string, count: number, color: string }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{label}</span>
    </div>
    <span className="text-sm font-bold">{count}</span>
  </div>
);

export default AdminDashboard;
