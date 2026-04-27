import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Truck, ShieldCheck, CheckCircle2, AlertCircle, QrCode, Building2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/authStore';
import { axiosInstance } from '../api/axiosInstance';
import { useEffect } from 'react';

const checkoutSchema = z.object({
  shippingFullName: z.string().min(2, 'Họ tên tối thiểu 2 ký tự'),
  shippingPhone: z.string().regex(/^(0|84)(3|5|7|8|9)[0-9]{8}$/, 'Số điện thoại không hợp lệ'),
  shippingAddress: z.string().min(10, 'Địa chỉ cần chi tiết hơn'),
  paymentMethod: z.enum(['QR', 'COD']),
  notes: z.string().optional(),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const [step, setStep] = useState<'form' | 'payment' | 'success' | 'failure'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderInfo, setOrderInfo] = useState<any>(null);
  const [timer, setTimer] = useState(30);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { paymentMethod: 'QR' }
  });

  const paymentMethod = watch('paymentMethod');

  useEffect(() => {
    let interval: any;
    if (step === 'payment' && timer > 0) {
      interval = setInterval(() => {
        setTimer(t => t - 1);
      }, 1000);
    } else if (step === 'payment' && timer === 0) {
      // Mock result logic: 1 product type -> Success, >1 -> Failure
      if (items.length === 1) {
        clearCart();
        setStep('success');
      } else {
        setStep('failure');
      }
    }
    return () => clearInterval(interval);
  }, [step, timer, items.length, clearCart]);

  const onSubmit = async (data: CheckoutForm) => {
    if (user?.role === 'Admin') {
      setError('Tài khoản Admin không được phép thực hiện đặt hàng. Vui lòng sử dụng tài khoản User.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        ...data,
        items: items.map(i => ({ productId: i.id, quantity: i.quantity }))
      };
      
      const res = await axiosInstance.post('/store/orders', payload);
      if (res.data.success) {
        setOrderInfo(res.data.data);
        if (data.paymentMethod === 'QR') {
          setStep('payment');
        } else {
          setStep('success');
          clearCart();
        }
      } else {
        setError(res.data.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0 && step === 'form') {
    navigate('/cart');
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <AnimatePresence mode="wait">
        {step === 'form' && (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid lg:grid-cols-2 gap-12"
          >
            <div>
              <h1 className="text-4xl font-black mb-8">Thông tin đặt hàng</h1>
              <form id="checkout-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold ml-1 text-muted-foreground">Họ và tên người nhận</label>
                  <input
                    {...register('shippingFullName')}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-5 py-4 rounded-2xl bg-secondary/50 border-none focus:ring-2 focus:ring-primary transition-all"
                  />
                  {errors.shippingFullName && <p className="text-destructive text-xs ml-1 font-medium">{errors.shippingFullName.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold ml-1 text-muted-foreground">Số điện thoại</label>
                  <input
                    {...register('shippingPhone')}
                    placeholder="09xx xxx xxx"
                    className="w-full px-5 py-4 rounded-2xl bg-secondary/50 border-none focus:ring-2 focus:ring-primary transition-all"
                  />
                  {errors.shippingPhone && <p className="text-destructive text-xs ml-1 font-medium">{errors.shippingPhone.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold ml-1 text-muted-foreground">Địa chỉ nhận hàng</label>
                  <textarea
                    {...register('shippingAddress')}
                    placeholder="Số nhà, tên đường, phường/xã..."
                    rows={3}
                    className="w-full px-5 py-4 rounded-2xl bg-secondary/50 border-none focus:ring-2 focus:ring-primary transition-all resize-none"
                  />
                  {errors.shippingAddress && <p className="text-destructive text-xs ml-1 font-medium">{errors.shippingAddress.message}</p>}
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-bold ml-1 text-muted-foreground">Phương thức thanh toán</label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className={`flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all cursor-pointer ${paymentMethod === 'QR' ? 'border-primary bg-primary/5' : 'border-secondary hover:border-zinc-300'}`}>
                      <input type="radio" value="QR" {...register('paymentMethod')} className="hidden" />
                      <QrCode className={`w-8 h-8 ${paymentMethod === 'QR' ? 'text-primary' : 'text-zinc-400'}`} />
                      <span className="font-bold">Chuyển khoản QR</span>
                    </label>
                    <label className={`flex flex-col items-center gap-3 p-6 rounded-3xl border-2 transition-all cursor-pointer ${paymentMethod === 'COD' ? 'border-primary bg-primary/5' : 'border-secondary hover:border-zinc-300'}`}>
                      <input type="radio" value="COD" {...register('paymentMethod')} className="hidden" />
                      <Truck className={`w-8 h-8 ${paymentMethod === 'COD' ? 'text-primary' : 'text-zinc-400'}`} />
                      <span className="font-bold">Khi nhận hàng</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold ml-1 text-muted-foreground">Ghi chú (Tùy chọn)</label>
                  <input
                    {...register('notes')}
                    placeholder="Lời nhắn cho shipper..."
                    className="w-full px-5 py-4 rounded-2xl bg-secondary/50 border-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
              </form>
            </div>

            <div className="space-y-8">
              <div className="glass p-8 rounded-[3rem] space-y-6">
                <h2 className="text-2xl font-bold">Tóm tắt đơn hàng</h2>
                <div className="space-y-4 max-h-[300px] overflow-auto pr-2">
                  {items.map(item => (
                    <div key={item.id} className="flex justify-between items-center gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-secondary overflow-hidden flex-shrink-0">
                          <img src={item.imageUrl} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-bold text-sm line-clamp-1">{item.name}</p>
                          <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                        </div>
                      </div>
                      <span className="font-bold">{(item.price * item.quantity).toLocaleString('vi-VN')}đ</span>
                    </div>
                  ))}
                </div>
                
                <div className="h-px bg-border" />
                
                <div className="space-y-3">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tổng tiền hàng</span>
                    <span>{totalPrice().toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Phí vận chuyển</span>
                    <span className="text-green-500 font-bold">Miễn phí</span>
                  </div>
                  <div className="flex justify-between text-2xl font-black pt-2">
                    <span>Tổng cộng</span>
                    <span className="text-primary">{totalPrice().toLocaleString('vi-VN')}đ</span>
                  </div>
                </div>

                {error && (
                  <div className="bg-destructive/10 text-destructive p-4 rounded-2xl flex items-center gap-3 text-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  form="checkout-form"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-5 bg-primary text-white rounded-2xl font-black text-xl shadow-xl shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                  {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Xác nhận đặt hàng'}
                </button>

                <div className="flex justify-center gap-6 text-[10px] uppercase tracking-widest font-black text-muted-foreground/60">
                  <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Bảo mật</div>
                  <div className="flex items-center gap-2"><Truck className="w-4 h-4" /> Giao nhanh</div>
                  <div className="flex items-center gap-2"><CreditCard className="w-4 h-4" /> Thanh toán</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'payment' && (
          <motion.div
            key="payment"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto text-center py-12"
          >
            <div className="glass p-12 rounded-[4rem] space-y-8 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-2xl" />
               
               <h2 className="text-3xl font-black">Quét mã để thanh toán</h2>
               <p className="text-muted-foreground">Sử dụng ứng dụng Ngân hàng hoặc MoMo/ZaloPay để quét mã QR bên dưới.</p>
               
               <div className="w-64 h-64 bg-white p-4 rounded-3xl mx-auto shadow-2xl relative group">
                  <img 
                    src={`https://api.vietqr.io/image/970422-0901234567-Vndm0Y.jpg?amount=${totalPrice()}&addInfo=TouchLove%20${orderInfo?.orderNumber}`}
                    alt="VietQR"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
               </div>

               <div className="bg-secondary/50 p-8 rounded-[2.5rem] space-y-4 text-left">
                  <h3 className="font-bold flex items-center gap-2 text-primary">
                    <Building2 className="w-5 h-5" /> Thông tin chuyển khoản dự phòng
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Ngân hàng</p>
                      <p className="font-bold">MB Bank (Quân Đội)</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Số tài khoản</p>
                      <p className="font-bold">0901 234 567</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Chủ tài khoản</p>
                      <p className="font-bold uppercase">NGO THANH PHONG</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Số tiền</p>
                      <p className="font-bold text-primary">{totalPrice().toLocaleString('vi-VN')}đ</p>
                    </div>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-xl text-xs font-medium text-primary text-center">
                    Nội dung: <span className="font-black">TouchLove {orderInfo?.orderNumber}</span>
                  </div>
               </div>

                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="flex items-center gap-3 text-primary animate-pulse">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="font-black uppercase tracking-widest text-sm">Đang kiểm tra thanh toán...</span>
                  </div>
                  <div className="text-4xl font-black text-zinc-300">
                    {timer}s
                  </div>
                </div>

                <p className="text-xs text-muted-foreground px-8">
                  Hệ thống đang tự động kiểm tra trạng thái thanh toán. 
                  Vui lòng không đóng trình duyệt hoặc chuyển trang.
                </p>
            </div>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl mx-auto text-center py-20"
          >
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h1 className="text-5xl font-black mb-4">Đặt hàng thành công!</h1>
            <p className="text-xl text-muted-foreground mb-4">Mã đơn hàng: <span className="font-black text-primary">{orderInfo?.orderNumber}</span></p>
            <p className="text-muted-foreground mb-12">Cảm ơn bạn đã tin tưởng TouchLove. Chúng mình sẽ sớm liên hệ để xác nhận và gửi hàng.</p>
            
            <button
              onClick={() => navigate('/')}
              className="px-12 py-5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-full font-black text-lg hover:bg-primary dark:hover:bg-primary dark:hover:text-white transition-all shadow-xl"
            >
              Về trang chủ
            </button>
          </motion.div>
        )}

        {step === 'failure' && (
          <motion.div
            key="failure"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl mx-auto text-center py-20"
          >
            <div className="w-24 h-24 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-8">
              <XCircle className="w-12 h-12" />
            </div>
            <h1 className="text-5xl font-black mb-4">Thanh toán thất bại</h1>
            <p className="text-xl text-muted-foreground mb-4">Hệ thống không thể xác nhận giao dịch của bạn.</p>
            <p className="text-muted-foreground mb-12">
              Lưu ý: Để test tính năng thành công, giỏ hàng chỉ được phép có 1 loại sản phẩm. 
              Hiện tại bạn có {items.length} loại sản phẩm.
            </p>
            
            <button
              onClick={() => {
                setStep('form');
                setTimer(30);
              }}
              className="px-12 py-5 bg-primary text-white rounded-full font-black text-lg hover:scale-110 transition-all shadow-xl"
            >
              Quay lại giỏ hàng
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Loader2 = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
);

export default CheckoutPage;
