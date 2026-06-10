import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, Lock, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { toast } from '../store/useToastStore';
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
  const [showPassword, setShowPassword] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;
    setIsResending(true);
    try {
      const res = await axiosInstance.post('/auth/resend-verification', { email: unverifiedEmail });
      if (res.data.success) {
        toast.success('Đã gửi lại link xác nhận. Vui lòng kiểm tra email của bạn.');
        setUnverifiedEmail(null);
        setError(null);
      } else {
        setError(res.data.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể gửi lại email xác nhận.');
    } finally {
      setIsResending(false);
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(loginSchema),
  });

  const handleGoogleCredentialResponse = async (response: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.post('/auth/google-login', {
        credential: response.credential,
      });

      if (res.data.success) {
        const { user, accessToken } = res.data.data;
        setAuth(user, accessToken);
        const redirect = searchParams.get('redirect') || '/';
        navigate(redirect);
      } else {
        setError(res.data.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng nhập bằng Google thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Load Google Identity Services SDK dynamically
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      // @ts-ignore
      if (window.google) {
        // @ts-ignore
        window.google.accounts.id.initialize({
          // CẤU HÌNH: Thay Client ID của bạn ở đây để kết nối với Google Cloud của bạn
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '684995330023-q8p2p561ku1ktk5o01p4vhb5a86ishf4.apps.googleusercontent.com', 
          callback: handleGoogleCredentialResponse,
        });
        // @ts-ignore
        window.google.accounts.id.renderButton(
          document.getElementById('google-btn-container'),
          { theme: 'outline', size: 'large', width: '100%', shape: 'pill' }
        );
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);
    setUnverifiedEmail(null);
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
        if (response.data.errors && response.data.errors.includes('UNVERIFIED_EMAIL')) {
          setUnverifiedEmail(data.email);
          setError(response.data.message);
        } else {
          setError(response.data.message);
        }
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
        <div className="bg-destructive/10 text-destructive p-4 rounded-2xl flex flex-col gap-2 text-sm animate-shake">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          {unverifiedEmail && (
            <button
              onClick={handleResendVerification}
              disabled={isResending}
              className="mt-2 py-2 px-4 bg-white/20 hover:bg-white/30 text-destructive rounded-xl font-bold transition-colors w-fit flex items-center gap-2"
            >
              {isResending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              Gửi lại link xác nhận
            </button>
          )}
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
          {errors.email && <p className="text-xs text-destructive px-1">{String(errors.email.message)}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <label className="text-sm font-medium">Mật khẩu</label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              Quên mật khẩu?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground" />
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              className={`w-full bg-secondary/50 border-0 rounded-2xl py-3.5 pl-12 pr-12 focus:ring-2 focus:ring-primary transition-all outline-none ${
                errors.password ? 'ring-2 ring-destructive' : ''
              }`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive px-1">{String(errors.password.message)}</p>}
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

      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
        <span className="flex-shrink mx-4 text-xs text-muted-foreground uppercase font-bold tracking-wider">Hoặc</span>
        <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
      </div>

      <div className="flex justify-center">
        <div id="google-btn-container" className="w-full h-[44px]"></div>
      </div>

      <div className="text-center text-sm text-muted-foreground pt-2">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="text-primary font-bold hover:underline">
          Đăng ký ngay
        </Link>
      </div>
    </div>
  );
};

export default Login;
