import { useEffect, useState } from 'react';
import { ShoppingBag, Search, Filter, Eye, CheckCircle2, XCircle, Clock, Truck, ChevronRight } from 'lucide-react';
import { axiosInstance } from '../../api/axiosInstance';
import { motion } from 'framer-motion';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  status: number;
  paymentStatus: number;
  createdAt: string;
}

const ORDER_STATUS = [
  { label: 'Chờ xử lý', color: 'bg-amber-500', text: 'text-white', icon: Clock },
  { label: 'Đã xác nhận', color: 'bg-blue-500', text: 'text-white', icon: CheckCircle2 },
  { label: 'Đang xử lý', color: 'bg-indigo-500', text: 'text-white', icon: Clock },
  { label: 'Đang giao', color: 'bg-orange-500', text: 'text-white', icon: Truck },
  { label: 'Hoàn thành', color: 'bg-green-500', text: 'text-white', icon: CheckCircle2 },
  { label: 'Đã hủy', color: 'bg-red-500', text: 'text-white', icon: XCircle },
  { label: 'Đã hoàn tiền', color: 'bg-zinc-500', text: 'text-white', icon: XCircle },
];

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await axiosInstance.get('/admin/store/orders');
      if (res.data.success) setOrders(res.data.data);
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (id: string, status: number) => {
    try {
      const res = await axiosInstance.patch(`/admin/store/orders/${id}/status`, status, {
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.data.success) {
        setOrders(orders.map(o => o.id === id ? { ...o, status } : o));
      }
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const [filter, setFilter] = useState('Tất cả');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          o.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'Tất cả' || 
                         (filter === 'Chờ xử lý' && o.status === 0) ||
                         (filter === 'Đang giao' && o.status === 3) ||
                         (filter === 'Hoàn thành' && o.status === 4);
    return matchesSearch && matchesFilter;
  });

  if (isLoading) return <div className="h-96 animate-pulse bg-white dark:bg-zinc-900 rounded-[2.5rem]" />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black">Quản lý đơn hàng</h1>
        <p className="text-muted-foreground">Theo dõi và cập nhật tiến độ giao hàng cho khách hàng</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Tìm theo mã đơn hoặc khách hàng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-primary transition-all"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2">
          {['Tất cả', 'Chờ xử lý', 'Đang giao', 'Hoàn thành'].map((f) => (
            <button 
              key={f} 
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all whitespace-nowrap ${filter === f ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                <th className="px-8 py-5 text-sm font-bold text-zinc-500 uppercase tracking-wider">Mã đơn hàng</th>
                <th className="px-8 py-5 text-sm font-bold text-zinc-500 uppercase tracking-wider">Khách hàng</th>
                <th className="px-8 py-5 text-sm font-bold text-zinc-500 uppercase tracking-wider">Ngày đặt</th>
                <th className="px-8 py-5 text-sm font-bold text-zinc-500 uppercase tracking-wider">Tổng tiền</th>
                <th className="px-8 py-5 text-sm font-bold text-zinc-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-8 py-5 text-sm font-bold text-zinc-500 uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredOrders.map((order) => {
                const status = ORDER_STATUS[order.status] || ORDER_STATUS[0];
                return (
                  <tr key={order.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors group">
                    <td className="px-8 py-6">
                      <span className="font-black text-primary">#{order.orderNumber}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="font-bold">{order.customerName}</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm text-zinc-500">
                        {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="font-black">{order.totalAmount.toLocaleString('vi-VN')}đ</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter flex items-center gap-2 ${status.color} ${status.text} shadow-sm shadow-black/5`}>
                          <status.icon className="w-3 h-3" />
                          {status.label}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                         <div className="relative">
                            <select 
                              value={order.status}
                              onChange={(e) => handleUpdateStatus(order.id, parseInt(e.target.value))}
                              className="appearance-none bg-zinc-100 dark:bg-zinc-800 border-none text-[10px] font-black uppercase tracking-widest rounded-xl pl-4 pr-10 py-2.5 focus:ring-2 focus:ring-primary transition-all cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700"
                            >
                              {ORDER_STATUS.map((s, idx) => (
                                <option key={idx} value={idx} className="bg-white dark:bg-zinc-900 text-foreground font-bold">{s.label}</option>
                              ))}
                            </select>
                            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rotate-90 pointer-events-none text-zinc-400" />
                         </div>
                         <button className="p-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-primary/10 hover:text-primary rounded-xl transition-all" title="Xem chi tiết">
                           <Eye className="w-5 h-5" />
                         </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;
