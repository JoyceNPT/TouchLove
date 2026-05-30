import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Check, Key, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import { useAuthStore } from '../store/authStore';

const NfcSetupPin = () => {
  const { keyId } = useParams<{ keyId: string }>();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [pin, setPin] = useState<string[]>(Array(6).fill(''));
  const [confirmPin, setConfirmPin] = useState<string[]>(Array(6).fill(''));
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activePin = step === 'enter' ? pin : confirmPin;
  const setActivePin = step === 'enter' ? setPin : setConfirmPin;

  const handleKeyPress = (num: string) => {
    setError(null);
    const index = activePin.findIndex(val => val === '');
    if (index !== -1) {
      const newPin = [...activePin];
      newPin[index] = num;
      setActivePin(newPin);

      // If full 6 digits are typed
      if (index === 5) {
        if (step === 'enter') {
          setTimeout(() => {
            setStep('confirm');
          }, 300);
        } else {
          // Verify confirmation PIN
          const pinStr = pin.join('');
          const confirmStr = newPin.join('');
          if (pinStr !== confirmStr) {
            setTimeout(() => {
              setError('Mật mã xác nhận không trùng khớp. Vui lòng nhập lại!');
              setConfirmPin(Array(6).fill(''));
            }, 300);
          } else {
            // Submit to backend
            setTimeout(() => {
              handleSubmitPin(pinStr);
            }, 300);
          }
        }
      }
    }
  };

  const handleBackspace = () => {
    const index = activePin.map(val => val !== '').lastIndexOf(true);
    if (index !== -1) {
      const newPin = [...activePin];
      newPin[index] = '';
      setActivePin(newPin);
    }
  };

  const handleReset = () => {
    setPin(Array(6).fill(''));
    setConfirmPin(Array(6).fill(''));
    setStep('enter');
    setError(null);
  };

  const handleSubmitPin = async (passcode: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.post('/nfc/setup-pin', {
        keyId,
        passcode
      });

      if (res.data.success && res.data.data) {
        const { user, accessToken } = res.data.data;
        // Authenticate in store
        setAuth(user, accessToken);
        navigate('/nfc-profile');
      } else {
        setError(res.data.message || 'Không thể thiết lập mật mã. Vui lòng thử lại!');
        handleReset();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi kết nối máy chủ.');
      handleReset();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[40%] bg-primary/10 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[40%] bg-pink-500/10 rounded-full blur-[120px] -z-10 animate-pulse" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass max-w-md w-full p-8 md:p-10 rounded-[3rem] shadow-2xl border border-zinc-150 dark:border-zinc-700 text-center space-y-8 backdrop-blur-md relative"
      >
        {/* Step Indicator / Status Header */}
        <div className="space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-pink-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-primary/20">
            {step === 'enter' ? <Key className="w-8 h-8 animate-pulse" /> : <ShieldCheck className="w-8 h-8" />}
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-zinc-800 dark:text-zinc-100">
              {step === 'enter' ? 'Thiết lập mã khóa NFC 🔒' : 'Xác nhận mã khóa 🔑'}
            </h2>
            <p className="text-xs text-zinc-500 leading-relaxed max-w-xs mx-auto">
              {step === 'enter' 
                ? 'Móc khóa mới cần thiết lập một mật mã PIN gồm 6 số để bảo vệ trang cá nhân.'
                : 'Nhập lại 6 chữ số mật mã để xác nhận độ chính xác.'}
            </p>
          </div>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold rounded-2xl flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-left leading-relaxed">{error}</span>
          </motion.div>
        )}

        {/* PIN Indicators Display */}
        <div className="flex justify-center gap-3">
          {activePin.map((val, idx) => (
            <div
              key={idx}
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl border transition-all duration-300 flex items-center justify-center font-bold text-lg ${
                val !== '' 
                  ? 'border-primary bg-primary/5 text-primary scale-105 shadow-inner' 
                  : 'border-zinc-200 dark:border-zinc-800 bg-secondary/30 text-zinc-400'
              }`}
            >
              {val !== '' ? '●' : ''}
            </div>
          ))}
        </div>

        {/* Keyboard Layout */}
        <div className="grid grid-cols-3 gap-4 max-w-[280px] mx-auto pt-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              disabled={isLoading}
              className="w-16 h-16 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-primary dark:hover:border-primary hover:bg-primary/5 rounded-full flex items-center justify-center text-xl font-black text-zinc-800 dark:text-zinc-100 shadow-sm active:scale-95 transition-all disabled:opacity-50"
            >
              {num}
            </button>
          ))}
          
          <button
            onClick={handleReset}
            disabled={isLoading}
            className="w-16 h-16 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-full flex items-center justify-center text-xs font-black transition-all"
          >
            LÀM LẠI
          </button>
          
          <button
            onClick={() => handleKeyPress('0')}
            disabled={isLoading}
            className="w-16 h-16 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-primary dark:hover:border-primary hover:bg-primary/5 rounded-full flex items-center justify-center text-xl font-black text-zinc-800 dark:text-zinc-100 shadow-sm active:scale-95 transition-all disabled:opacity-50"
          >
            0
          </button>
          
          <button
            onClick={handleBackspace}
            disabled={isLoading}
            className="w-16 h-16 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 rounded-full flex items-center justify-center text-xs font-black transition-all"
          >
            XÓA VỀ
          </button>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-sm rounded-[3rem] flex items-center justify-center z-10">
            <RefreshCw className="w-10 h-10 text-primary animate-spin" />
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default NfcSetupPin;
