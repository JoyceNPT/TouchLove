import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, CreditCard, Truck, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    name: string;
    price: string;
  } | null;
}

const PurchaseModal = ({ isOpen, onClose, product }: PurchaseModalProps) => {
  const [step, setStep] = useState<'form' | 'success'>('form');

  if (!product) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('success');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-xl bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>

            {step === 'form' ? (
              <div className="p-8 md:p-12">
                <div className="mb-8">
                  <h2 className="text-3xl font-black mb-2">Hoàn tất đặt hàng</h2>
                  <p className="text-zinc-500">Bạn đang mua: <span className="font-bold text-primary">{product.name}</span></p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold ml-1">Họ tên</label>
                      <input 
                        required
                        type="text" 
                        placeholder="Nguyễn Văn A"
                        className="w-full px-5 py-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-primary transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold ml-1">Số điện thoại</label>
                      <input 
                        required
                        type="tel" 
                        placeholder="0901 234 567"
                        className="w-full px-5 py-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-primary transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold ml-1">Địa chỉ nhận hàng</label>
                    <textarea 
                      required
                      placeholder="Số nhà, tên đường, phường/xã..."
                      rows={3}
                      className="w-full px-5 py-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-primary transition-all resize-none"
                    />
                  </div>

                  <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-3xl space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Tạm tính</span>
                      <span>{product.price}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Phí vận chuyển</span>
                      <span className="text-green-500 font-bold">Miễn phí</span>
                    </div>
                    <div className="h-px bg-zinc-200 dark:bg-zinc-700 my-2" />
                    <div className="flex justify-between text-xl font-black">
                      <span>Tổng cộng</span>
                      <span className="text-primary">{product.price}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 py-4 text-[10px] uppercase tracking-widest font-bold text-zinc-400">
                    <div className="flex flex-col items-center gap-2">
                      <ShieldCheck className="w-5 h-5" />
                      Bảo mật
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <Truck className="w-5 h-5" />
                      Giao nhanh
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      Thanh toán
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-5 bg-primary text-white rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Xác nhận đặt hàng
                  </button>
                </form>
              </div>
            ) : (
              <div className="p-12 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 12 }}
                  className="w-24 h-24 bg-green-100 dark:bg-green-900/30 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8"
                >
                  <CheckCircle2 className="w-12 h-12" />
                </motion.div>
                <h2 className="text-4xl font-black mb-4">Đặt hàng thành công!</h2>
                <p className="text-zinc-500 mb-10 max-w-sm mx-auto">
                  Cảm ơn bạn đã tin tưởng TouchLove. Chúng mình sẽ liên hệ xác nhận đơn hàng trong giây lát.
                </p>
                <button
                  onClick={onClose}
                  className="px-12 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold hover:bg-primary dark:hover:bg-primary dark:hover:text-white transition-all"
                >
                  Tuyệt vời
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PurchaseModal;
