import React, { useState, useEffect } from 'react';
import { Download, TrendingUp } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import { toast } from '../../store/useToastStore';
import * as XLSX from 'xlsx';

const AdminRevenue = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      // Just fetching all orders for simplicity (assuming pagination/filtering in a real app)
      const res = await axiosInstance.get('/admin/orders?size=1000');
      if (res.data.success) {
        setOrders(res.data.data.items);
      }
    } catch (err) {
      toast.error('Lỗi khi tải dữ liệu doanh thu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportExcel = () => {
    const dataToExport = orders.map(o => ({
      'Mã Đơn': o.orderNumber,
      'Khách Hàng': o.customerName || 'N/A',
      'Ngày Đặt': new Date(o.createdAt).toLocaleDateString('vi-VN'),
      'Tổng Tiền': o.totalAmount,
      'Trạng Thái': o.status,
      'Thanh Toán': o.paymentStatus
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'DoanhThu');
    
    XLSX.writeFile(workbook, `BaoCao_DoanhThu_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Xuất file Excel thành công!');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            Báo cáo Doanh thu
          </h1>
          <p className="text-zinc-500 text-sm">Xem và xuất báo cáo dữ liệu đơn hàng.</p>
        </div>
        <button 
          onClick={handleExportExcel}
          disabled={orders.length === 0}
          className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-green-700 transition-all disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          Xuất Excel
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm text-center">
        {isLoading ? (
          <p className="text-zinc-500">Đang tải dữ liệu...</p>
        ) : (
          <div>
            <div className="text-5xl font-black text-primary mb-4">
              {orders.reduce((acc, curr) => curr.status === 'Confirmed' || curr.status === 'Completed' ? acc + curr.totalAmount : acc, 0).toLocaleString()} đ
            </div>
            <p className="text-zinc-500 mb-8">Tổng doanh thu từ {orders.length} đơn hàng</p>
            
            <p className="text-sm text-zinc-400">Bạn có thể xuất toàn bộ dữ liệu đơn hàng ra file Excel bằng nút phía trên.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRevenue;
