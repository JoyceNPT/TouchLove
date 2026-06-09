import { useEffect, useState } from 'react';
import { Download, TrendingUp, DollarSign, Package, ShoppingBag, ArrowUpRight, ArrowDownRight, Calendar, Filter } from 'lucide-react';
import { axiosInstance } from '../../api/axiosInstance';
import { motion } from 'framer-motion';
import { toast } from '../../store/useToastStore';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';

interface RevenueSummary {
  grossRevenue: number;
  totalCostOfGoods: number;
  grossProfit: number;
  profitMargin: number;
  totalOrders: number;
  totalProductsSold: number;
}

interface MonthlyRevenue {
  monthYear: string;
  revenue: number;
  profit: number;
  ordersCount: number;
}

interface VoucherEffectiveness {
  voucherCode: string;
  timesUsed: number;
  totalDiscountGiven: number;
  totalRevenueGenerated: number;
}

interface OrderDetail {
  orderId: string;
  orderNumber: string;
  customerName: string;
  completedAt: string;
  totalOrderValue: number;
  voucherDiscount: number;
  netRevenue: number;
  totalCost: number;
  profit: number;
}

interface RevenueReport {
  summary: RevenueSummary;
  monthlyBreakdown: MonthlyRevenue[];
  voucherEffectiveness: VoucherEffectiveness[];
  orderDetails: OrderDetail[];
}

const AdminRevenue = () => {
  const [report, setReport] = useState<RevenueReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      let url = '/admin/revenue/report';
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      if (params.toString()) url += `?${params.toString()}`;
      
      const res = await axiosInstance.get(url);
      if (res.data.success) {
        setReport(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch revenue', err);
      setError(err.response?.data?.message || err.message || JSON.stringify(err));
      toast.error(err.response?.data?.message || 'Không thể tải dữ liệu báo cáo');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      let url = '/admin/revenue/export';
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await axiosInstance.get(url, { responseType: 'blob' });
      
      // Create download link
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `Bao_Cao_Doanh_Thu_${new Date().getTime()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Xuất file Excel thành công');
    } catch (err) {
      console.error('Export failed', err);
      toast.error('Có lỗi xảy ra khi xuất file Excel');
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) return <div className="h-96 animate-pulse bg-white dark:bg-zinc-900 rounded-[2.5rem]" />;
  if (error) return <div className="text-center p-12 text-destructive font-bold whitespace-pre-wrap">LỖI CHI TIẾT: {error}</div>;
  if (!report) return <div className="text-center p-12 text-zinc-500 font-bold">Không có dữ liệu báo cáo. Vui lòng thử lại.</div>;

  const s = report.summary;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black">Báo cáo doanh thu</h1>
          <p className="text-muted-foreground">Theo dõi lợi nhuận và hiệu quả kinh doanh</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={handleExport}
            disabled={isExporting || !report}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all disabled:opacity-50"
          >
            <Download className="w-5 h-5" />
            {isExporting ? 'Đang xuất...' : 'Xuất Excel'}
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4 bg-white dark:bg-zinc-900 p-4 rounded-[2rem] border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2 text-zinc-500 font-bold px-2">
          <Filter className="w-5 h-5" />
          <span>Lọc theo ngày:</span>
        </div>
        <input 
          type="date" 
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-4 py-2 text-sm font-bold w-full md:w-auto"
        />
        <span className="text-zinc-400 font-bold">-</span>
        <input 
          type="date" 
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-4 py-2 text-sm font-bold w-full md:w-auto"
        />
        <button 
          onClick={fetchReport}
          className="w-full md:w-auto px-6 py-2 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20"
        >
          Áp dụng
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign className="w-24 h-24 text-primary" />
          </div>
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4 relative z-10">
            <TrendingUp className="w-6 h-6" />
          </div>
          <p className="text-zinc-500 font-bold text-sm mb-1 relative z-10">Tổng doanh thu</p>
          <h3 className="text-3xl font-black relative z-10">{s?.grossRevenue.toLocaleString('vi-VN')}đ</h3>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
          <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 mb-4 relative z-10">
            <Package className="w-6 h-6" />
          </div>
          <p className="text-zinc-500 font-bold text-sm mb-1 relative z-10">Lợi nhuận gộp</p>
          <h3 className="text-3xl font-black text-blue-600 dark:text-blue-400 relative z-10">{s?.grossProfit.toLocaleString('vi-VN')}đ</h3>
          <div className="flex items-center gap-1 text-sm mt-2 font-bold text-zinc-500">
            Biên lợi nhuận: <span className="text-blue-500">{((s?.profitMargin || 0)).toFixed(1)}%</span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
          <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 mb-4 relative z-10">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <p className="text-zinc-500 font-bold text-sm mb-1 relative z-10">Số đơn hoàn thành</p>
          <h3 className="text-3xl font-black relative z-10">{s?.totalOrders.toLocaleString()}</h3>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
          <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 mb-4 relative z-10">
            <Package className="w-6 h-6" />
          </div>
          <p className="text-zinc-500 font-bold text-sm mb-1 relative z-10">Sản phẩm đã bán</p>
          <h3 className="text-3xl font-black relative z-10">{s?.totalProductsSold.toLocaleString()}</h3>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800">
          <h3 className="text-xl font-black mb-6">Biểu đồ doanh thu</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={report?.monthlyBreakdown}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" opacity={0.2} />
                <XAxis dataKey="monthYear" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold', fill: '#71717a' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold', fill: '#71717a' }} tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`${value.toLocaleString()}đ`, 'Doanh thu']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#ec4899" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800">
          <h3 className="text-xl font-black mb-6">Lợi nhuận ròng</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report?.monthlyBreakdown}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" opacity={0.2} />
                <XAxis dataKey="monthYear" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold', fill: '#71717a' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold', fill: '#71717a' }} tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: '#18181b', color: '#fff' }}
                  formatter={(value: number) => [`${value.toLocaleString()}đ`, 'Lợi nhuận']}
                  cursor={{ fill: '#3f3f46', opacity: 0.1 }}
                />
                <Bar dataKey="profit" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <h3 className="text-xl font-black mb-6">Đơn hàng gần đây</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                  <th className="px-6 py-4 text-xs font-black text-zinc-500 uppercase tracking-widest first:rounded-l-xl">Mã Đơn</th>
                  <th className="px-6 py-4 text-xs font-black text-zinc-500 uppercase tracking-widest">Doanh thu</th>
                  <th className="px-6 py-4 text-xs font-black text-zinc-500 uppercase tracking-widest text-right last:rounded-r-xl">Lợi nhuận</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                {report?.orderDetails.slice(0, 5).map((o) => (
                  <tr key={o.orderId} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-black text-primary">#{o.orderNumber}</p>
                      <p className="text-xs text-zinc-500 font-bold">{new Date(o.completedAt).toLocaleDateString('vi-VN')}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold">{o.netRevenue.toLocaleString()}đ</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-black text-blue-500">+{o.profit.toLocaleString()}đ</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <h3 className="text-xl font-black mb-6">Hiệu quả Voucher</h3>
          <div className="space-y-4">
            {report?.voucherEffectiveness.map(v => (
              <div key={v.voucherCode} className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-black uppercase text-primary tracking-widest">{v.voucherCode}</span>
                  <span className="text-xs font-bold bg-white dark:bg-zinc-900 px-2 py-1 rounded-lg shadow-sm">{v.timesUsed} lần dùng</span>
                </div>
                <div className="flex justify-between items-center mt-3 text-sm">
                  <span className="text-zinc-500 font-bold">Giảm giá: <span className="text-red-500">-{v.totalDiscountGiven.toLocaleString()}đ</span></span>
                  <span className="font-black text-foreground">{v.totalRevenueGenerated.toLocaleString()}đ</span>
                </div>
              </div>
            ))}
            {(!report?.voucherEffectiveness || report.voucherEffectiveness.length === 0) && (
              <p className="text-center text-zinc-500 font-bold py-8">Chưa có voucher nào được sử dụng</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRevenue;
