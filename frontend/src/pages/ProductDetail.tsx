import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, ShieldCheck, Truck, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { axiosInstance } from '../api/axiosInstance';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/authStore';
import { motion } from 'framer-motion';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  stockQuantity: number;
  imageUrls: string;
}

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axiosInstance.get(`/store/products/${slug}`);
        if (res.data.success) {
          setProduct(res.data.data);
        } else {
          setError(res.data.message);
        }
      } catch (err) {
        setError('Không thể tải thông tin sản phẩm.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.');
      navigate('/login');
      return;
    }
    if (product) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: JSON.parse(product.imageUrls || '[]')[0] || '',
        quantity: quantity
      });
      alert('Đã thêm vào giỏ hàng!');
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-12 h-12 animate-spin text-primary" />
    </div>
  );

  if (error || !product) return (
    <div className="container mx-auto px-4 py-20 text-center">
      <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
      <h1 className="text-2xl font-bold mb-4">{error || 'Không tìm thấy sản phẩm.'}</h1>
      <button onClick={() => navigate('/')} className="bg-primary text-white px-8 py-3 rounded-full font-bold">
        Quay lại trang chủ
      </button>
    </div>
  );

  const images = JSON.parse(product.imageUrls || '[]');

  return (
    <div className="container mx-auto px-4 py-12">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold mb-8 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" /> Quay lại
      </button>

      <div className="grid lg:grid-cols-2 gap-12 items-start">
        {/* Gallery */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4"
        >
          <div className="aspect-square rounded-[3rem] overflow-hidden bg-secondary shadow-2xl">
            <img 
              src={images[0] || 'https://images.unsplash.com/photo-1559440666-374213642921'} 
              className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
              alt={product.name}
            />
          </div>
        </motion.div>

        {/* Info */}
        <div className="space-y-8">
          <div>
            <h1 className="text-5xl font-black mb-4 leading-tight">{product.name}</h1>
            <div className="flex items-center gap-4">
              <span className="text-3xl font-black text-primary">
                {product.price.toLocaleString('vi-VN')}đ
              </span>
              <span className="px-3 py-1 bg-green-500/10 text-green-500 text-xs font-bold rounded-full">
                Còn {product.stockQuantity} sản phẩm
              </span>
            </div>
          </div>

          <p className="text-lg text-muted-foreground leading-relaxed">
            {product.description}
          </p>

          <div className="space-y-4">
            <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Số lượng</label>
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-secondary rounded-2xl p-1">
                <button 
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-12 h-12 flex items-center justify-center font-bold hover:bg-white dark:hover:bg-zinc-800 rounded-xl transition-all"
                >
                  -
                </button>
                <span className="w-12 text-center font-black">{quantity}</span>
                <button 
                  onClick={() => setQuantity(q => q + 1)}
                  className="w-12 h-12 flex items-center justify-center font-bold hover:bg-white dark:hover:bg-zinc-800 rounded-xl transition-all"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              onClick={handleAddToCart}
              className="flex-1 bg-primary text-white py-5 rounded-3xl font-black text-xl shadow-xl shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              <ShoppingCart className="w-6 h-6" /> Thêm vào giỏ hàng
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-8">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest">Chính hãng</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-2xl flex items-center justify-center mx-auto">
                <Truck className="w-6 h-6" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest">Giao nhanh</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-purple-500/10 text-purple-500 rounded-2xl flex items-center justify-center mx-auto">
                <RefreshCw className="w-6 h-6" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest">Đổi trả 7 ngày</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
