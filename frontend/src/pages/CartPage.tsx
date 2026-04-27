import { motion } from 'framer-motion';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';

const CartPage = () => {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, totalPrice, totalItems } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingCart className="w-12 h-12 text-zinc-400" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Giỏ hàng trống</h1>
        <p className="text-muted-foreground mb-8">Bạn chưa thêm sản phẩm nào vào giỏ hàng.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-full font-bold hover:scale-105 transition-all"
        >
          <ArrowLeft className="w-5 h-5" /> Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-black mb-10 flex items-center gap-4">
        Giỏ hàng của bạn
        <span className="text-lg font-medium text-muted-foreground bg-secondary px-4 py-1 rounded-full">
          {totalItems()} sản phẩm
        </span>
      </h1>

      <div className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-6">
          {items.map((item) => (
            <motion.div
              layout
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass p-6 rounded-[2rem] flex flex-col sm:flex-row items-center gap-6"
            >
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-secondary">
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
              </div>
              
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-xl font-bold mb-1">{item.name}</h3>
                <p className="text-primary font-black text-lg">
                  {item.price.toLocaleString('vi-VN')}đ
                </p>
              </div>

              <div className="flex items-center gap-4 bg-secondary/50 p-2 rounded-2xl">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="w-10 h-10 rounded-xl hover:bg-background flex items-center justify-center transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-bold">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="w-10 h-10 rounded-xl hover:bg-background flex items-center justify-center transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => removeItem(item.id)}
                className="p-3 text-destructive hover:bg-destructive/10 rounded-2xl transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </motion.div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="glass p-8 rounded-[2.5rem] sticky top-24">
            <h2 className="text-2xl font-bold mb-6">Tổng đơn hàng</h2>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-muted-foreground">
                <span>Tạm tính</span>
                <span>{totalPrice().toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Phí vận chuyển</span>
                <span className="text-green-500 font-medium">Miễn phí</span>
              </div>
              <div className="h-px bg-border my-4" />
              <div className="flex justify-between text-2xl font-black">
                <span>Tổng cộng</span>
                <span className="text-primary">{totalPrice().toLocaleString('vi-VN')}đ</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full py-5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
            >
              Thanh toán ngay <ArrowRight className="w-6 h-6" />
            </button>

            <Link
              to="/"
              className="block w-full py-4 text-center text-sm font-bold text-muted-foreground hover:text-foreground transition-colors mt-4"
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
