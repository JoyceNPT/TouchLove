import { useEffect, useState } from 'react';
import { Package, Plus, Trash2, Edit, AlertCircle, Loader2, ChevronRight, PackageCheck, PackageX } from 'lucide-react';
import { axiosInstance } from '../../api/axiosInstance';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '../../store/useToastStore';
import ConfirmModal from '../../components/shared/ConfirmModal';

interface Product {
  id: string;
  name: string;
  slug: string;
  costPrice: number;
  price: number;
  stockQuantity: number;
  supplierName: string;
  isActive: boolean;
  description?: string;
  imageUrls?: string;
  supplierId?: string;
}

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    costPrice: 0,
    price: 0,
    stockQuantity: 0,
    supplierId: '',
    imageUrls: '[]'
  });

  const fetchProducts = async () => {
    try {
      const res = await axiosInstance.get('/admin/store/products');
      if (res.data.success) setProducts(res.data.data);
    } catch (err) {
      console.error('Failed to fetch products', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDeleteClick = (id: string) => {
    setProductToDelete(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    const id = productToDelete;
    setIsDeleting(id);
    try {
      const res = await axiosInstance.delete(`/admin/store/products/${id}`);
      if (res.data.success) {
        setProducts(products.filter(p => p.id !== id));
        toast.success(res.data.message || 'Xóa sản phẩm thành công');
      } else {
        toast.error(res.data.message);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể xóa sản phẩm. Sản phẩm có thể đang có đơn hàng xử lý.');
    } finally {
      setIsDeleting(null);
      setProductToDelete(null);
    }
  };

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || '',
        costPrice: product.costPrice || 0,
        price: product.price,
        stockQuantity: product.stockQuantity,
        supplierId: product.supplierId || '',
        imageUrls: product.imageUrls || '[]'
      });
    } else {
      setEditingProduct(null);
      setFormData({ name: '', description: '', costPrice: 0, price: 0, stockQuantity: 0, supplierId: '', imageUrls: '[]' });
    }
    setIsModalOpen(true);
  };

  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        supplierId: formData.supplierId ? formData.supplierId : null
      };

      if (editingProduct) {
        const res = await axiosInstance.put(`/admin/store/products/${editingProduct.id}`, payload);
        if (res.data.success) {
          toast.success('Cập nhật sản phẩm thành công');
          fetchProducts();
          setIsModalOpen(false);
        } else toast.error(res.data.message);
      } else {
        const res = await axiosInstance.post(`/admin/store/products`, payload);
        if (res.data.success) {
          toast.success('Thêm sản phẩm thành công');
          fetchProducts();
          setIsModalOpen(false);
        } else toast.error(res.data.message);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  if (isLoading) return <div className="h-96 animate-pulse bg-white dark:bg-zinc-900 rounded-[2.5rem]" />;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Quản lý sản phẩm</h1>
          <p className="text-muted-foreground">Danh sách và tồn kho các mẫu móc khóa NFC</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" /> Thêm sản phẩm mới
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <StatCard label="Tổng sản phẩm" value={products.length} icon={Package} color="text-blue-500" bg="bg-blue-500/10" />
        <StatCard label="Đang kinh doanh" value={products.filter(p => p.isActive).length} icon={PackageCheck} color="text-green-500" bg="bg-green-500/10" />
        <StatCard label="Sắp hết hàng" value={products.filter(p => p.stockQuantity < 10).length} icon={PackageX} color="text-orange-500" bg="bg-orange-500/10" />
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                <th className="px-8 py-5 text-sm font-bold text-zinc-500 uppercase tracking-wider">Sản phẩm</th>
                <th className="px-8 py-5 text-sm font-bold text-zinc-500 uppercase tracking-wider">Nhà cung cấp</th>
                <th className="px-8 py-5 text-sm font-bold text-zinc-500 uppercase tracking-wider">Giá vốn</th>
                <th className="px-8 py-5 text-sm font-bold text-zinc-500 uppercase tracking-wider">Giá bán</th>
                <th className="px-8 py-5 text-sm font-bold text-zinc-500 uppercase tracking-wider">Tồn kho</th>
                <th className="px-8 py-5 text-sm font-bold text-zinc-500 uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center font-bold text-primary">
                        {product.name[0]}
                      </div>
                      <div>
                        <p className="font-bold">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-sm font-medium">{product.supplierName}</span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="font-bold text-zinc-600">{product.costPrice?.toLocaleString('vi-VN')}đ</span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="font-black text-primary">{product.price.toLocaleString('vi-VN')}đ</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                       <span className={`w-2 h-2 rounded-full ${product.stockQuantity < 10 ? 'bg-orange-500' : 'bg-green-500'}`} />
                       <span className={`font-bold ${product.stockQuantity < 10 ? 'text-orange-500' : ''}`}>
                         {product.stockQuantity}
                       </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openModal(product)}
                        className="p-2 hover:bg-primary/10 text-primary rounded-xl transition-colors"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(product.id)}
                        disabled={isDeleting === product.id}
                        className="p-2 hover:bg-destructive/10 text-destructive rounded-xl transition-colors"
                      >
                        {isDeleting === product.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
    </div>
        </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Xóa sản phẩm"
        message="Bạn có chắc muốn xóa sản phẩm này? Hệ thống sẽ kiểm tra các đơn hàng liên quan trước khi xóa."
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsConfirmOpen(false)}
        type="danger"
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-xl rounded-3xl p-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">{editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</h2>
            <form onSubmit={handleSubmitModal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-500 mb-1">Tên sản phẩm</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-500 mb-1">Giá vốn (CostPrice)</label>
                  <input required type="number" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-500 mb-1">Giá bán (Price)</label>
                  <input required type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-500 mb-1">Số lượng tồn kho</label>
                <input required type="number" value={formData.stockQuantity} onChange={e => setFormData({...formData, stockQuantity: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-500 mb-1">Mô tả</label>
                <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent" />
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-zinc-600 hover:bg-zinc-100">Hủy</button>
                <button type="submit" className="px-6 py-3 rounded-xl font-bold bg-primary text-white hover:opacity-90">Lưu sản phẩm</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color, bg }: any) => (
  <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800">
    <div className="flex items-center gap-4">
      <div className={`p-4 ${bg} ${color} rounded-2xl`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h3 className="text-zinc-500 text-sm font-bold">{label}</h3>
        <p className="text-3xl font-black">{value.toLocaleString()}</p>
      </div>
    </div>
  </div>
);

export default AdminProducts;
