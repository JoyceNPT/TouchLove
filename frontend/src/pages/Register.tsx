import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, Lock, User as UserIcon, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';

const registerSchema = z.object({
  displayName: z.string().min(2, 'Tên hiển thị phải từ 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(8, 'Mật khẩu phải từ 8 ký tự'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

const Register = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<string[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    setError(null);
    setDetails([]);
    try {
      const response = await axiosInstance.post('/auth/register', {
        ...data,
        captchaToken: 'dummy_token',
      });

      if (response.data.success) {
        setIsSuccess(true);
      } else {
        setError(response.data.message);
        if (response.data.errors) setDetails(response.data.errors);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
      if (err.response?.data?.errors) setDetails(err.response?.data?.errors);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center space-y-6 py-4">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
        </div>
        <h2 className="text-3xl font-bold">Kiểm tra Email</h2>
        <p className="text-muted-foreground leading-relaxed">
          Chúng mình đã gửi một liên kết xác thực đến email của bạn. 
          Vui lòng kiểm tra hộp thư (và cả thư rác) để kích hoạt tài khoản nhé!
        </p>
        <button
          onClick={() => navigate('/login')}
          className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
        >
          Quay lại Đăng nhập
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Tạo tài khoản</h2>
        <p className="text-muted-foreground">Bắt đầu hành trình lưu giữ yêu thương cùng TouchLove</p>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-2xl space-y-2 text-sm animate-shake">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="font-bold">{error}</span>
          </div>
          {details.length > 0 && (
            <ul className="list-disc list-inside ml-8 opacity-80">
              {details.map((d, i) => <li key={i}>{d}</li>)}
            </ul>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium px-1">Tên hiển thị</label>
          <div className="relative">
            <UserIcon className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground" />
            <input
              {...register('displayName')}
              className={`w-full bg-secondary/50 border-0 rounded-2xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-primary transition-all outline-none ${
                errors.displayName ? 'ring-2 ring-destructive' : ''
              }`}
              placeholder="Ví dụ: Anh Nhà, Em Bé..."
            />
          </div>
          {errors.displayName && <p className="text-xs text-destructive px-1">{errors.displayName.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium px-1">Email</label>
          <div className="relative">
            <Mail className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground" />
            <input
              {...register('email')}
              className={`w-full bg-secondary/50 border-0 rounded-2xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-primary transition-all outline-none ${
                errors.email ? 'ring-2 ring-destructive' : ''
              }`}
              placeholder="ten@example.com"
            />
          </div>
          {errors.email && <p className="text-xs text-destructive px-1">{errors.email.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium px-1">Mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground" />
              <input
                {...register('password')}
                type="password"
                className={`w-full bg-secondary/50 border-0 rounded-2xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-primary transition-all outline-none ${
                  errors.password ? 'ring-2 ring-destructive' : ''
                }`}
                placeholder="••••••••"
              />
            </div>
            {errors.password && <p className="text-xs text-destructive px-1">{errors.password.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium px-1">Xác nhận</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground" />
              <input
                {...register('confirmPassword')}
                type="password"
                className={`w-full bg-secondary/50 border-0 rounded-2xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-primary transition-all outline-none ${
                  errors.confirmPassword ? 'ring-2 ring-destructive' : ''
                }`}
                placeholder="••••••••"
              />
            </div>
            {errors.confirmPassword && <p className="text-xs text-destructive px-1">{errors.confirmPassword.message}</p>}
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Đăng ký tài khoản'}
        </button>
      </form>

      <div className="text-center text-sm text-muted-foreground pt-4">
        Đã có tài khoản?{' '}
        <Link to="/login" className="text-primary font-bold hover:underline">
          Đăng nhập ngay
        </Link>
      </div>
    </div>
  );
};

export default Register;
