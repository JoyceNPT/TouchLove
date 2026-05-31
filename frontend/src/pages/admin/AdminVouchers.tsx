import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Power, PowerOff, CheckCircle2 } from 'lucide-react';
import { axiosInstance } from '../../api/axiosInstance';
import { toast } from '../../store/useToastStore';

export const AdminVouchers = () => {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>({
    code: '', description: '', discountType: 0, discountValue: 0, maxDiscountCap: 0, minOrderValue: 0,
    usageLimitTotal: null, usageLimitPerUser: 1, startAt: new Date().toISOString().slice(0, 16), endAt: '', isActive: true
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchVouchers = async () => {
    try {
      const res = await axiosInstance.get('/admin/vouchers');
      if (res.data.success) {
        setVouchers(res.data.data);
      }
    } catch (error) {
      toast.error('Lỗi khi tải danh sách voucher');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        startAt: new Date(formData.startAt).toISOString(),
        endAt: formData.endAt ? new Date(formData.endAt).toISOString() : null,
      };

      if (editingId) {
        const res = await axiosInstance.put(`/admin/vouchers/${editingId}`, payload);
        if (res.data.success) toast.success('Cập nhật thành công');
      } else {
        const res = await axiosInstance.post('/admin/vouchers', payload);
        if (res.data.success) toast.success('Thêm thành công');
      }
      setIsModalOpen(false);
      fetchVouchers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      const res = await axiosInstance.patch(`/admin/vouchers/${id}/toggle-active`);
      if (res.data.success) {
        toast.success('Đã cập nhật trạng thái');
        fetchVouchers();
      }
    } catch (error) {
      toast.error('Lỗi khi cập nhật trạng thái');
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setFormData({
      code: '', description: '', discountType: 0, discountValue: 0, maxDiscountCap: 0, minOrderValue: 0,
      usageLimitTotal: null, usageLimitPerUser: 1, startAt: new Date().toISOString().slice(0, 16), endAt: '', isActive: true
    });
    setIsModalOpen(true);
  };

  const openEdit = (v: any) => {
    setEditingId(v.id);
    setFormData({
      code: v.code, description: v.description, discountType: v.discountType, discountValue: v.discountValue,
      maxDiscountCap: v.maxDiscountCap || 0, minOrderValue: v.minOrderValue, usageLimitTotal: v.usageLimitTotal || '',
      usageLimitPerUser: v.usageLimitPerUser, startAt: new Date(v.startAt).toISOString().slice(0, 16),
      endAt: v.endAt ? new Date(v.endAt).toISOString().slice(0, 16) : '', isActive: v.isActive
    });
    setIsModalOpen(true);
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black">Quản lý Voucher</h1>
        <button onClick={openAdd} className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20">
          <Plus className="w-5 h-5" /> Thêm Voucher
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm overflow-x-auto border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left">
          <thead>
            <tr className="text-muted-foreground border-b border-border">
              <th className="pb-4 font-bold">Mã</th>
              <th className="pb-4 font-bold">Mô tả</th>
              <th className="pb-4 font-bold">Loại / Giá trị</th>
              <th className="pb-4 font-bold">Thời gian</th>
              <th className="pb-4 font-bold">Trạng thái</th>
              <th className="pb-4 font-bold">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {vouchers.map(v => (
              <tr key={v.id} className="border-b border-border/50">
                <td className="py-4 font-bold text-primary">{v.code}</td>
                <td className="py-4 text-sm">{v.description}</td>
                <td className="py-4 text-sm">
                  {v.discountType === 0 ? 'Cố định' : '%'}: {v.discountValue}
                </td>
                <td className="py-4 text-sm">
                  {new Date(v.startAt).toLocaleDateString()} - {v.endAt ? new Date(v.endAt).toLocaleDateString() : 'Không thời hạn'}
                </td>
                <td className="py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${v.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {v.isActive ? 'Hoạt động' : 'Đã khóa'}
                  </span>
                </td>
                <td className="py-4 flex gap-2">
                  <button onClick={() => openEdit(v)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-colors"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleToggleActive(v.id)} className={`p-2 rounded-xl transition-colors ${v.isActive ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10' : 'text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10'}`}>
                    {v.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-zinc-900 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-2xl font-bold mb-6">{editingId ? 'Sửa' : 'Thêm'} Voucher</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold">Mã Voucher</label>
                  <input required disabled={!!editingId} value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-sm font-bold">Mô tả</label>
                  <input required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-sm font-bold">Loại giảm giá</label>
                  <select value={formData.discountType} onChange={e => setFormData({ ...formData, discountType: Number(e.target.value) })} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent outline-none focus:ring-2 focus:ring-primary">
                    <option value={0}>Cố định</option>
                    <option value={1}>Phần trăm</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold">Giá trị giảm</label>
                  <input type="number" required value={formData.discountValue} onChange={e => setFormData({ ...formData, discountValue: Number(e.target.value) })} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-sm font-bold">Giảm tối đa (Cap)</label>
                  <input type="number" value={formData.maxDiscountCap} onChange={e => setFormData({ ...formData, maxDiscountCap: Number(e.target.value) })} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-sm font-bold">Giá trị đơn tối thiểu</label>
                  <input type="number" required value={formData.minOrderValue} onChange={e => setFormData({ ...formData, minOrderValue: Number(e.target.value) })} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-sm font-bold">Giới hạn số lượng (tổng)</label>
                  <input type="number" value={formData.usageLimitTotal} onChange={e => setFormData({ ...formData, usageLimitTotal: e.target.value ? Number(e.target.value) : null })} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-sm font-bold">Lượt dùng / user</label>
                  <input type="number" required value={formData.usageLimitPerUser} onChange={e => setFormData({ ...formData, usageLimitPerUser: Number(e.target.value) })} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-sm font-bold">Bắt đầu</label>
                  <input type="datetime-local" required value={formData.startAt} onChange={e => setFormData({ ...formData, startAt: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-sm font-bold">Kết thúc</label>
                  <input type="datetime-local" value={formData.endAt} onChange={e => setFormData({ ...formData, endAt: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 btn-primary py-3">Lưu</button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-secondary text-foreground py-3 rounded-xl font-bold">Hủy</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
