import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Lock, X } from 'lucide-react';

interface LoginRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const LoginRequiredModal = ({ isOpen, onClose, onConfirm }: LoginRequiredModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] bg-white/80 dark:bg-zinc-900/80 p-8 text-center shadow-2xl border border-white/20 dark:border-zinc-800/50 backdrop-blur-xl"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Glowing Icon Container */}
            <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <div className="absolute inset-0 bg-primary/20 dark:bg-primary/30 rounded-3xl blur-xl animate-pulse" />
              <div className="relative w-16 h-16 bg-gradient-to-tr from-primary to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25">
                <Lock className="w-8 h-8 text-white animate-bounce" />
              </div>
            </div>

            {/* Header */}
            <h3 className="text-2xl font-black mb-3 bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
              Cần Đăng Nhập 💖
            </h3>

            {/* Description */}
            <p className="text-muted-foreground text-sm leading-relaxed mb-8 px-2">
              Chào bạn! Hãy đăng nhập để lưu trữ giỏ hàng, đặt hàng các móc khóa cặp đôi lãng mạn và cùng nhau chia sẻ những khoảnh khắc ngọt ngào nhé!
            </p>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button
                onClick={onConfirm}
                className="w-full bg-gradient-to-r from-primary to-pink-500 text-white py-4 rounded-2xl font-black text-base shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-5 h-5" /> Đăng nhập ngay
              </button>
              <button
                onClick={onClose}
                className="w-full py-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-sm font-bold"
              >
                Bỏ qua
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
