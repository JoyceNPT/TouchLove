import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [expiredEmail, setExpiredEmail] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  const token = searchParams.get('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/auth/reset-password', {
        token,
        newPassword
      });

      if (response.data.success) {
        setStatus('success');
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(response.data.message || 'Có lỗi xảy ra.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Token không hợp lệ hoặc đã hết hạn.');
      if (err.response?.data?.errors && err.response.data.errors[0] === 'TOKEN_EXPIRED') {
        setExpiredEmail(err.response.data.errors[1]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!expiredEmail) return;
    setIsResending(true);
    try {
      const response = await axios.post('/api/auth/forgot-password', { email: expiredEmail });
      if (response.data.success) {
        setError('Đã gửi lại link đặt lại mật khẩu. Vui lòng kiểm tra email.');
        setExpiredEmail(null);
      } else {
        setError(response.data.message || 'Không thể gửi lại email.');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi gửi lại email.');
    } finally {
      setIsResending(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass p-8 rounded-2xl text-center">
          <h1 className="text-xl font-bold text-destructive">Lỗi!</h1>
          <p className="mt-2">Token không hợp lệ.</p>
          <button onClick={() => navigate('/login')} className="mt-4 text-primary">Quay lại đăng nhập</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass max-w-md w-full p-8 rounded-3xl shadow-2xl"
      >
        {status === 'success' ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-4">Thành công!</h1>
            <p className="text-muted-foreground mb-4">Mật khẩu của bạn đã được thay đổi thành công.</p>
            <p className="text-sm text-muted-foreground">Đang chuyển hướng về trang đăng nhập...</p>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-bold mb-2">Đặt lại mật khẩu</h1>
            <p className="text-muted-foreground mb-8">Hãy nhập mật khẩu mới cho tài khoản của bạn.</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium ml-1">Mật khẩu mới</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-12 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium ml-1">Xác nhận mật khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {error && (
                <div className="flex flex-col gap-2">
                  <p className="text-destructive text-sm text-center font-medium">{error}</p>
                  {expiredEmail && (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={isResending}
                      className="w-full bg-white/10 hover:bg-white/20 text-white py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                    >
                      {isResending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      Gửi lại link
                    </button>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white py-4 rounded-2xl font-semibold shadow-lg shadow-primary/25 hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Cập nhật mật khẩu'}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default ResetPassword;
