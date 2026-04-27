import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shield, Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { axiosInstance } from '../api/axiosInstance';
import { useAuthStore } from '../store/authStore';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
  newPassword: z.string().min(8, 'Mật khẩu mới phải từ 8 ký tự')
    .regex(/[A-Z]/, 'Mật khẩu phải có ít nhất 1 chữ hoa')
    .regex(/[a-z]/, 'Mật khẩu phải có ít nhất 1 chữ thường')
    .regex(/[0-9]/, 'Mật khẩu phải có ít nhất 1 con số')
    .regex(/[^A-Za-z0-9]/, 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

type PasswordForm = z.infer<typeof passwordSchema>;

const SecuritySettings = () => {
  const navigate = useNavigate();
  const { clearAuth } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema)
  });

  const onSubmit = async (data: PasswordForm) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await axiosInstance.post('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      
      if (res.data.success) {
        setIsSuccess(true);
        // Logout after 3 seconds
        setTimeout(() => {
          clearAuth();
          navigate('/login');
        }, 3000);
      } else {
        setError(res.data.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đã có lỗi xảy ra.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Đổi mật khẩu thành công!</h1>
        <p className="text-muted-foreground mb-8">Bạn sẽ được chuyển đến trang đăng nhập trong giây lát...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <button 
        onClick={() => navigate('/profile')}
        className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Quay lại Profile
      </button>

      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-primary/10 text-primary rounded-2xl">
          <Shield className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-black">Bảo mật</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-bold ml-1">Mật khẩu hiện tại</label>
          <input
            type="password"
            {...register('currentPassword')}
            className="w-full px-5 py-4 rounded-2xl bg-secondary/50 border-none focus:ring-2 focus:ring-primary transition-all"
            placeholder="••••••••"
          />
          {errors.currentPassword && <p className="text-destructive text-xs ml-1 font-medium">{errors.currentPassword.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold ml-1">Mật khẩu mới</label>
          <input
            type="password"
            {...register('newPassword')}
            className="w-full px-5 py-4 rounded-2xl bg-secondary/50 border-none focus:ring-2 focus:ring-primary transition-all"
            placeholder="••••••••"
          />
          {errors.newPassword && <p className="text-destructive text-xs ml-1 font-medium">{errors.newPassword.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold ml-1">Xác nhận mật khẩu mới</label>
          <input
            type="password"
            {...register('confirmPassword')}
            className="w-full px-5 py-4 rounded-2xl bg-secondary/50 border-none focus:ring-2 focus:ring-primary transition-all"
            placeholder="••••••••"
          />
          {errors.confirmPassword && <p className="text-destructive text-xs ml-1 font-medium">{errors.confirmPassword.message}</p>}
        </div>

        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-2xl flex items-center gap-3 text-sm font-medium">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-5 bg-primary text-white rounded-2xl font-black text-lg shadow-xl shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
        >
          {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Đổi mật khẩu'}
        </button>
      </form>
    </div>
  );
};

export default SecuritySettings;
