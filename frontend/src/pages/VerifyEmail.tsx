import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [expiredEmail, setExpiredEmail] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Token xác thực không hợp lệ hoặc đã hết hạn.');
        return;
      }

      try {
        const response = await axiosInstance.get(`/auth/verify-email?token=${token}`);
        if (response.data.success) {
          setStatus('success');
          setMessage('Chúc mừng! Email của bạn đã được xác thực thành công.');
          setTimeout(() => navigate('/login'), 5000);
        } else {
          setStatus('error');
          setMessage(response.data.message || 'Xác thực không thành công.');
          if (response.data.errors && response.data.errors[0] === 'TOKEN_EXPIRED') {
            setExpiredEmail(response.data.errors[1]);
          }
        }
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Có lỗi xảy ra trong quá trình xác thực.');
        if (error.response?.data?.errors && error.response.data.errors[0] === 'TOKEN_EXPIRED') {
          setExpiredEmail(error.response.data.errors[1]);
        }
      }
    };

    verify();
  }, [token, navigate]);

  const handleResend = async () => {
    if (!expiredEmail) return;
    setIsResending(true);
    try {
      const response = await axiosInstance.post('/auth/resend-verification', { email: expiredEmail });
      if (response.data.success) {
        setMessage('Đã gửi lại link xác nhận. Vui lòng kiểm tra email của bạn.');
        setExpiredEmail(null);
      } else {
        setMessage(response.data.message || 'Không thể gửi lại email xác nhận.');
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Có lỗi xảy ra khi gửi lại email.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass max-w-md w-full p-8 rounded-2xl text-center shadow-2xl"
      >
        <div className="flex justify-center mb-6">
          {status === 'loading' && (
            <Loader2 className="w-16 h-16 text-primary animate-spin" />
          )}
          {status === 'success' && (
            <CheckCircle2 className="w-16 h-16 text-green-500" />
          )}
          {status === 'error' && (
            <XCircle className="w-16 h-16 text-destructive" />
          )}
        </div>

        <h1 className="text-2xl font-bold mb-4">
          {status === 'loading' ? 'Đang xác thực...' : status === 'success' ? 'Thành công!' : 'Thất bại'}
        </h1>
        
        <p className="text-muted-foreground mb-8">
          {message}
        </p>

        {status !== 'loading' && (
          <div className="flex flex-col gap-3 mt-8">
            {expiredEmail && (
              <button
                onClick={handleResend}
                disabled={isResending}
                className="w-full bg-white border-2 border-primary text-primary py-3 rounded-xl font-bold hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
              >
                {isResending ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                Gửi lại link xác nhận
              </button>
            )}
            <Link 
              to="/login" 
              className="inline-block w-full bg-primary text-white py-3 rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
            >
              Quay lại Đăng nhập
            </Link>
          </div>
        )}
        
        {status === 'success' && (
          <p className="mt-4 text-xs text-muted-foreground font-medium">
            Hệ thống sẽ tự động chuyển hướng sau vài giây...
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
