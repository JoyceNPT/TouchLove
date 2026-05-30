import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Info, AlertCircle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  type = 'warning'
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger': return <AlertCircle className="w-6 h-6 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
      case 'info': return <Info className="w-6 h-6 text-blue-500" />;
    }
  };

  const getButtonClass = () => {
    switch (type) {
      case 'danger': return 'bg-red-500 hover:bg-red-600 focus:ring-red-500/50 text-white';
      case 'warning': return 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500/50 text-white';
      case 'info': return 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500/50 text-white';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800"
        >
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-2xl flex-shrink-0 ${
                type === 'danger' ? 'bg-red-100 dark:bg-red-900/30' :
                type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                'bg-blue-100 dark:bg-blue-900/30'
              }`}>
                {getIcon()}
              </div>
              <div className="flex-1 pt-1.5">
                <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100">{title}</h3>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {message}
                </p>
              </div>
            </div>
            
            <div className="mt-8 flex items-center justify-end gap-3">
              <button
                onClick={onCancel}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onCancel(); // Auto close
                }}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg transition-all focus:ring-4 ${getButtonClass()}`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ConfirmModal;
