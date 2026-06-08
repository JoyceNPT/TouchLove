import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Truck, ShieldCheck, CheckCircle2, AlertCircle, QrCode, Building2, XCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/useToastStore';
import { axiosInstance } from '../api/axiosInstance';
import { useEffect } from 'react';

const checkoutSchema = z.object({
  shippingFullName: z.string().min(2, 'Họ tên tối thiểu 2 ký tự'),
  shippingPhone: z.string().regex(/^(0|84)(3|5|7|8|9)[0-9]{8}$/, 'Số điện thoại không hợp lệ'),
  shippingAddress: z.string().min(10, 'Địa chỉ cần chi tiết hơn'),
  paymentMethod: z.enum(['QR', 'COD']),
  notes: z.string().optional(),
  voucherCode: z.string().optional(),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { items, totalPrice, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const [step, setStep] = useState<'form' | 'payment' | 'success' | 'failure'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderInfo, setOrderInfo] = useState<any>(null);
  const [timer, setTimer] = useState(300);
  const [isConfirming, setIsConfirming] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { paymentMethod: 'QR' }
  });

  const paymentMethod = watch('paymentMethod');

  useEffect(() => {
    // Handle PayOS return URL
    const isSuccess = searchParams.get('success');
    const isCancel = searchParams.get('cancel');
    const orderNumber = searchParams.get('order');

    if (isSuccess === 'true') {
      clearCart();
      setStep('success');
      setOrderInfo({ orderNumber });
      // Remove query params
      setSearchParams({});
    } else if (isCancel === 'true') {
      addToast('Bạn đã hủy thanh toán.', 'error');
      setStep('form');
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, clearCart, addToast]);

  const handleCancelPayment = async (isTimeout = false) => {
    if (!orderInfo?.orderNumber) {
      setStep('form');
      return;
    }
    try {
      if (isTimeout) addToast('Giao dịch đã hết thời gian chờ!', 'error');
      await axiosInstance.post(`/store/orders/cancel-payment/${orderInfo.orderNumber}`);
      setStep('form');
    } catch (err) {
      console.error(err);
      setStep('form');
    }
  };

  useEffect(() => {
    let interval: any;
    if (step === 'payment' && timer > 0) {
      interval = setInterval(() => {
        setTimer(t => t - 1);
      }, 1000);
    } else if (step === 'payment' && timer === 0) {
      handleCancelPayment(true);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleConfirmPayment = async () => {
    if (!orderInfo?.orderNumber) return;
    setIsConfirming(true);
    try {
      const res = await axiosInstance.post(`/store/orders/confirm-payment/${orderInfo.orderNumber}`);
      if (res.data.success) {
        clearCart();
        setStep('success');
      } else {
        addToast(res.data.message || 'Xác nhận thất bại', 'error');
      }
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Lỗi hệ thống khi xác nhận', 'error');
    } finally {
      setIsConfirming(false);
    }
  };

  const applyVoucher = async () => {
    if (!voucherCode.trim()) return;
    setIsApplyingVoucher(true);
    setVoucherError(null);
    try {
      const res = await axiosInstance.get(`/vouchers/validate?code=${voucherCode}&orderValue=${totalPrice()}`);
      if (res.data.success && res.data.data.isValid) {
        setDiscountAmount(res.data.data.discountAmount);
      } else {
        setVoucherError(res.data.message || 'Voucher không hợp lệ');
        setDiscountAmount(0);
      }
    } catch (err: any) {
      setVoucherError(err.response?.data?.message || 'Lỗi kiểm tra voucher');
      setDiscountAmount(0);
    } finally {
      setIsApplyingVoucher(false);
    }
  };

  const finalPrice = Math.max(0, totalPrice() - discountAmount);

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
        items: items.map(i => ({ productId: i.id, quantity: i.quantity })),
        voucherCode: discountAmount > 0 ? voucherCode : undefined
      };
      
      const res = await axiosInstance.post('/store/orders', payload);
      if (res.data.success) {
        setOrderInfo(res.data.data);
        if (data.paymentMethod === 'QR') {
          if (res.data.data.checkoutUrl) {
            window.location.href = res.data.data.checkoutUrl;
          } else {
            addToast('Không thể tạo mã thanh toán PayOS. Vui lòng thử lại.', 'error');
            setStep('form');
          }
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

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Mã giảm giá"
                    value={voucherCode}
                    onChange={(e) => {
                      setVoucherCode(e.target.value.toUpperCase());
                      setVoucherError(null);
                      if (discountAmount > 0) setDiscountAmount(0);
                    }}
                    className="flex-1 px-4 py-3 rounded-xl bg-secondary/50 border-none focus:ring-2 focus:ring-primary uppercase"
                  />
                  <button 
                    type="button" 
                    onClick={applyVoucher}
                    disabled={isApplyingVoucher || !voucherCode.trim()}
                    className="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-bold hover:bg-primary dark:hover:bg-primary transition-all disabled:opacity-50"
                  >
                    Áp dụng
                  </button>
                </div>
                {voucherError && <p className="text-destructive text-sm font-medium">{voucherError}</p>}
                {discountAmount > 0 && <p className="text-green-500 text-sm font-bold">Đã áp dụng giảm {discountAmount.toLocaleString('vi-VN')}đ</p>}
                
                <div className="space-y-3">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tổng tiền hàng</span>
                    <span>{totalPrice().toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Phí vận chuyển</span>
                    <span className="text-green-500 font-bold">Miễn phí</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-500 font-bold">
                      <span>Giảm giá</span>
                      <span>-{discountAmount.toLocaleString('vi-VN')}đ</span>
                    </div>
                  )}
                  <div className="flex justify-between text-2xl font-black pt-2">
                    <span>Tổng cộng</span>
                    <span className="text-primary">{finalPrice.toLocaleString('vi-VN')}đ</span>
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
                    src={`https://api.vietqr.io/image/970436-1027053036-compact2.jpg?amount=${finalPrice}&addInfo=TouchLove%20${orderInfo?.orderNumber}`}
                    alt="VietQR"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
               </div>

               <div className="bg-secondary/50 p-8 rounded-[2.5rem] space-y-4 text-left">
                  <h3 className="font-bold flex items-center gap-2 text-primary">
                    <Building2 className="w-5 h-5" /> Thông tin chuyển khoản dự phòng
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                    <div>
                      <p className="text-muted-foreground">Ngân hàng</p>
                      <p className="font-bold">MB Bank (Quân Đội)</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Số tài khoản</p>
                      <p className="font-bold">190220039</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Chủ tài khoản</p>
                      <p className="font-bold uppercase">NGO PHUOC THINH</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Số tiền</p>
                      <p className="font-bold text-primary">{finalPrice.toLocaleString('vi-VN')}đ</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 mt-6">
                    <button
                      onClick={handleConfirmPayment}
                      disabled={isConfirming}
                      className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:opacity-90 active:scale-95 transition-all flex justify-center items-center gap-2 shadow-lg shadow-primary/20"
                    >
                      {isConfirming ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Tôi đã chuyển khoản'}
                    </button>
                    <button
                      onClick={() => handleCancelPayment(false)}
                      disabled={isConfirming}
                      className="w-full py-4 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-2xl font-bold hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-all"
                    >
                      Hủy giao dịch
                    </button>
                  </div>
               </div>

                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="flex items-center gap-3 text-primary animate-pulse">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="font-black uppercase tracking-widest text-sm">Đang chờ bạn thanh toán...</span>
                  </div>
                  <div className="text-4xl font-black text-zinc-300">
                    {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground px-8">
                  Hệ thống sẽ tự động hủy giao dịch sau 5 phút nếu không nhận được xác nhận.
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
            <p className="text-xl text-muted-foreground mb-12">Hệ thống không thể xác nhận giao dịch của bạn hoặc giao dịch đã bị hủy.</p>
            
            <button
              onClick={() => {
                setStep('form');
                setTimer(300);
              }}
              className="px-12 py-5 bg-primary text-white rounded-full font-black text-lg hover:scale-110 transition-all shadow-xl"
            >
              Thử lại
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
