import { useEffect, useState } from 'react';
import { Package, Plus, Trash2, Edit, AlertCircle, Loader2, ChevronRight, PackageCheck, PackageX } from 'lucide-react';
import { axiosInstance } from '../../api/axiosInstance';
import { motion, AnimatePresence } from 'framer-motion';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  stockQuantity: number;
  supplierName: string;
  isActive: boolean;
}

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

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

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa sản phẩm này? Hệ thống sẽ kiểm tra các đơn hàng liên quan trước khi xóa.')) return;
    
    setIsDeleting(id);
    try {
      const res = await axiosInstance.delete(`/admin/store/products/${id}`);
      if (res.data.success) {
        setProducts(products.filter(p => p.id !== id));
      } else {
        alert(res.data.message);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể xóa sản phẩm.');
    } finally {
      setIsDeleting(null);
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
        <button className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20">
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
                      <button className="p-2 hover:bg-primary/10 text-primary rounded-xl transition-colors">
                        <Edit className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id)}
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
