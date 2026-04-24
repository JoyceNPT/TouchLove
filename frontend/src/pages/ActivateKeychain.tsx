import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Smartphone, CheckCircle2, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import axios from 'axios';

const ActivateKeychain = () => {
  const { keyId } = useParams<{ keyId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleActivate = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`/api/keychains/${keyId}/activate`);
      if (response.data.success) {
        setStatus('success');
        // Wait a bit to show success before navigating to pairing
        setTimeout(() => navigate(`/pair/${keyId}`), 2500);
      } else {
        setError(response.data.message || 'Không thể kích hoạt chip này.');
        setStatus('error');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi kích hoạt.');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass max-w-md w-full p-8 rounded-3xl shadow-2xl text-center relative overflow-hidden"
      >
        {/* Animated Background Elements */}
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 blur-2xl rounded-full"
        />

        <div className="relative z-10">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                {status === 'success' ? (
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                ) : (
                  <Smartphone className="w-12 h-12 text-primary" />
                )}
              </div>
              {status === 'idle' && (
                <motion.div 
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 border-4 border-primary rounded-full"
                />
              )}
            </div>
          </div>

          <h1 className="text-3xl font-bold mb-4">Kích hoạt Chip</h1>
          <p className="text-muted-foreground mb-8">
            {status === 'success' 
              ? 'Tuyệt vời! Chip của bạn đã sẵn sàng. Đang chuyển tới bước kết đôi...' 
              : `Bạn đang kích hoạt chip có mã: ${keyId?.slice(0, 8)}...`
            }
          </p>

          {status === 'error' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-4 bg-destructive/10 text-destructive rounded-xl flex items-center gap-3 text-sm"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {status === 'idle' && (
            <button
              onClick={handleActivate}
              disabled={loading}
              className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Kích hoạt ngay</span>
                  <Sparkles className="w-5 h-5" />
                </>
              )}
            </button>
          )}

          <button 
            onClick={() => navigate('/')}
            className="mt-6 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Hủy bỏ và quay lại
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ActivateKeychain;
