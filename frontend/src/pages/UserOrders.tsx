import { useEffect, useState } from 'react';
import { Package, ChevronDown, ChevronUp, Clock, Truck, CheckCircle, XCircle, AlertCircle, RefreshCw, Undo2 } from 'lucide-react';
import { axiosInstance } from '../api/axiosInstance';
import { motion, AnimatePresence } from 'framer-motion';

interface Order {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: number;
  paymentStatus: number;
  createdAt: string;
}

const ORDER_STATUS_MAP: Record<number, { label: string, color: string, icon: any }> = {
  0: { label: 'Chờ xử lý', color: 'bg-amber-500 text-white', icon: Clock },
  1: { label: 'Đã xác nhận', color: 'bg-blue-500 text-white', icon: CheckCircle },
  2: { label: 'Đang xử lý', color: 'bg-indigo-500 text-white', icon: Package },
  3: { label: 'Đang giao hàng', color: 'bg-purple-500 text-white', icon: Truck },
  4: { label: 'Hoàn thành', color: 'bg-green-500 text-white', icon: CheckCircle },
  5: { label: 'Đã hủy', color: 'bg-red-500 text-white', icon: XCircle },
  6: { label: 'Chờ hoàn tiền', color: 'bg-orange-500 text-white', icon: Undo2 },
  7: { label: 'Đã hoàn tiền', color: 'bg-zinc-500 text-white', icon: RefreshCw },
};

const UserOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await axiosInstance.get('/store/my-orders');
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

  const handleCancel = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')) return;
    try {
      const res = await axiosInstance.post(`/store/orders/${id}/cancel`);
      if (res.data.success) {
        alert('Đã gửi yêu cầu hủy đơn hàng.');
        fetchOrders();
      } else {
        alert(res.data.message);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể hủy đơn hàng.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-12">
        <h1 className="text-4xl font-black mb-2">Đơn hàng của tôi</h1>
        <p className="text-muted-foreground text-lg">Theo dõi hành trình những món quà yêu thương của bạn</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-secondary animate-pulse rounded-3xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-secondary/30 rounded-[3rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800">
          <Package className="w-16 h-16 mx-auto mb-4 text-zinc-300" />
          <h3 className="text-xl font-bold mb-2">Chưa có đơn hàng nào</h3>
          <p className="text-muted-foreground">Hãy bắt đầu chọn những món quà ý nghĩa ngay!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const status = ORDER_STATUS_MAP[order.status] || ORDER_STATUS_MAP[0];
            const isExpanded = expandedId === order.id;
            const canCancel = order.status === 0 || order.status === 1;

            return (
              <div key={order.id} className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-all">
                {/* Header Row */}
                <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl ${status.color} flex items-center justify-center`}>
                      <status.icon className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-lg">#{order.orderNumber}</span>
                        <span className={`px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-current/20 ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Đặt ngày {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between md:justify-end gap-6">
                    <div className="text-right">
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Tổng cộng</p>
                      <p className="text-xl font-black text-primary">{order.totalAmount.toLocaleString('vi-VN')}đ</p>
                    </div>
                  </div>
                </div>

                {/* Dropdown Toggle Button */}
                <button 
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  className="w-full py-4 px-8 bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border-t border-zinc-100 dark:border-zinc-800"
                >
                  <span className="text-sm font-black uppercase tracking-[0.2em] text-zinc-400">Theo dõi đơn hàng</span>
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-zinc-50/50 dark:bg-zinc-800/20"
                    >
                      <div className="p-8 space-y-8">
                        {/* Status Timeline */}
                        <div className="relative flex justify-between items-start before:absolute before:top-5 before:left-0 before:w-full before:h-1 before:bg-zinc-200 dark:before:bg-zinc-800 before:-z-10">
                          {[0, 1, 3, 4].map((sStep) => {
                            const stepInfo = ORDER_STATUS_MAP[sStep];
                            const isActive = order.status >= sStep && order.status !== 5;
                            return (
                              <div key={sStep} className="flex flex-col items-center gap-3 bg-transparent">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 ${isActive ? 'bg-primary border-primary text-white shadow-lg shadow-primary/30' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-300'}`}>
                                  <stepInfo.icon className="w-4 h-4" />
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-tighter ${isActive ? 'text-foreground' : 'text-zinc-400'}`}>
                                  {stepInfo.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                          {canCancel && (
                            <button 
                              onClick={() => handleCancel(order.id)}
                              className="flex-1 px-6 py-4 rounded-2xl bg-destructive/10 text-destructive font-black uppercase tracking-widest text-xs hover:bg-destructive hover:text-white transition-all flex items-center justify-center gap-2 border border-destructive/20"
                            >
                              <XCircle className="w-4 h-4" /> Hủy đơn hàng
                            </button>
                          )}
                          <button className="flex-1 px-6 py-4 rounded-2xl bg-secondary font-black uppercase tracking-widest text-xs hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all flex items-center justify-center gap-2">
                            <AlertCircle className="w-4 h-4" /> Liên hệ hỗ trợ
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UserOrders;
