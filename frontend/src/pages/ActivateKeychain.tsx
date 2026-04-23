import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Smartphone, CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';

const ActivateKeychain = () => {
  const { keyId } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleActivate = async () => {
    setStatus('loading');
    try {
      const response = await axiosInstance.post(`/keychains/${keyId}/activate`);
      if (response.data.success) {
        setStatus('success');
      } else {
        setStatus('error');
        setError(response.data.message);
      }
    } catch (err: any) {
      setStatus('error');
      setError(err.response?.data?.message || 'Không thể kích hoạt keychain. Vui lòng thử lại.');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <AnimatePresence mode="wait">
        {status === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
              <Smartphone className="w-12 h-12 text-primary animate-pulse" />
            </div>
            <h1 className="text-3xl font-bold">Kích hoạt Keychain</h1>
            <p className="text-muted-foreground">
              Bạn đang chuẩn bị kích hoạt Keychain có mã: <br />
              <span className="font-mono font-bold text-foreground">{keyId}</span>
            </p>
            <button
              onClick={handleActivate}
              className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all"
            >
              Kích hoạt ngay
            </button>
          </motion.div>
        )}

        {status === 'loading' && (
          <motion.div key="loading" className="space-y-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
            <p className="text-lg font-medium">Đang xử lý...</p>
          </motion.div>
        )}

        {status === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold">Kích hoạt thành công!</h1>
            <p className="text-muted-foreground">
              Keychain của bạn đã sẵn sàng. Bước tiếp theo là kết đôi với người ấy nhé!
            </p>
            <button
              onClick={() => navigate(`/pair/${keyId}`)}
              className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" /> Kết đôi ngay
            </button>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-8">
              <AlertCircle className="w-12 h-12 text-destructive" />
            </div>
            <h1 className="text-3xl font-bold">Có lỗi xảy ra</h1>
            <p className="text-destructive font-medium">{error}</p>
            <button
              onClick={() => setStatus('idle')}
              className="w-full glass py-4 rounded-2xl font-bold hover:bg-secondary transition-all"
            >
              Thử lại
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper for AnimatePresence
import { AnimatePresence } from 'framer-motion';

export default ActivateKeychain;
