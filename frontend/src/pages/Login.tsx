import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import axiosInstance from '../api/axiosInstance';

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(8, 'Mật khẩu phải từ 8 ký tự'),
  rememberMe: z.boolean().default(false),
});

type LoginForm = z.infer<typeof loginSchema>;

const Login = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.post('/auth/login', {
        ...data,
        captchaToken: 'dummy_token', // reCAPTCHA bypassed in dev
      });

      if (response.data.success) {
        const { user, accessToken } = response.data.data;
        setAuth(user, accessToken);
        
        const redirect = searchParams.get('redirect') || '/';
        navigate(redirect);
      } else {
        setError(response.data.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Chào mừng trở lại</h2>
        <p className="text-muted-foreground">Đăng nhập để tiếp tục câu chuyện tình yêu của bạn</p>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-2xl flex items-center gap-3 text-sm animate-shake">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <label className="text-sm font-medium">Mật khẩu</label>
            <Link to="/forgot-password" size="sm" className="text-xs text-primary hover:underline">
              Quên mật khẩu?
            </Link>
          </div>
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

        <div className="flex items-center gap-2 px-1">
          <input
            {...register('rememberMe')}
            type="checkbox"
            id="rememberMe"
            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="rememberMe" className="text-sm text-muted-foreground select-none cursor-pointer">
            Ghi nhớ đăng nhập
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Đăng nhập'}
        </button>
      </form>

      <div className="text-center text-sm text-muted-foreground pt-4">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="text-primary font-bold hover:underline">
          Đăng ký ngay
        </Link>
      </div>
    </div>
  );
};

export default Login;
