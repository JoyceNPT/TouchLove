import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, AlertCircle, ArrowLeft, Delete } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import { useAuthStore } from '../store/authStore';

const NfcUnlock = () => {
  const { keyId } = useParams();
  const navigate = useNavigate();
  const setToken = useAuthStore(state => state.setToken); // Assuming authStore has setToken or similar method

  const [pin, setPin] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleKeyPress = (num: string) => {
    if (pin.length < 6 && !isSubmitting) {
      setPin(prev => [...prev, num]);
      setError(null);
    }
  };

  const handleBackspace = () => {
    if (pin.length > 0 && !isSubmitting) {
      setPin(prev => prev.slice(0, -1));
    }
  };

  useEffect(() => {
    if (pin.length === 6) {
      submitPin();
    }
  }, [pin]);

  const submitPin = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const passcode = pin.join('');
      const res = await axiosInstance.post('/nfc/unlock', { keyId, passcode });
      if (res.data.success && res.data.data) {
        setIsUnlocked(true);
        
        // Save the authentication token
        const token = res.data.data.accessToken;
        const user = res.data.data.user;
        
        // Store in auth store
        useAuthStore.setState({
          token,
          user,
          isAuthenticated: true
        });

        // Trigger cart count sync if needed
        setTimeout(() => {
          const redirectTarget = res.data.data.user.role === 'Admin' 
            ? '/admin' 
            : res.data.data.coupleId 
              ? `/couple/${res.data.data.coupleId}` 
              : '/nfc-profile';
          navigate(redirectTarget);
        }, 1200);
      } else {
        setError(res.data.message || 'Mật mã quét NFC không chính xác.');
        setPin([]);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi xác thực.');
      setPin([]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between p-6 relative overflow-hidden">
      {/* Sleek animated radial glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[60%] bg-primary/10 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[80%] h-[60%] bg-pink-500/10 rounded-full blur-[120px] -z-10" />

      {/* Header back button */}
      <header className="flex items-center">
        <button 
          onClick={() => navigate('/')} 
          className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors border border-white/5"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </header>

      {/* Main Lock Area */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full space-y-12">
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Padlock Glow */}
          <div className="relative w-24 h-24 flex items-center justify-center">
            <motion.div 
              animate={isUnlocked ? { scale: [1, 1.2, 0.9, 1.1, 1] } : {}}
              className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center border transition-all duration-500 ${
                isUnlocked 
                  ? 'bg-green-500/20 border-green-500 text-green-400 shadow-[0_0_30px_rgba(34,197,94,0.3)]' 
                  : error 
                    ? 'bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.3)]'
                    : 'bg-white/5 border-white/10 text-white/80'
              }`}
            >
              {isUnlocked ? (
                <Unlock className="w-8 h-8 animate-pulse" />
              ) : (
                <Lock className="w-8 h-8" />
              )}
            </motion.div>
            <div className={`absolute inset-0 rounded-full blur-xl opacity-30 transition-colors duration-500 ${isUnlocked ? 'bg-green-500' : 'bg-primary'}`} />
          </div>

          <h2 className="text-2xl font-black tracking-tight">Yêu Cầu Mở Khóa NFC 🔒</h2>
          <p className="text-zinc-500 text-sm max-w-[280px]">
            Móc khóa này đã được thiết lập mật mã. Hãy nhập mã PIN gồm 6 chữ số để tiếp tục.
          </p>
        </div>

        {/* PIN dots container */}
        <div className="space-y-4 w-full">
          <div className="flex justify-center gap-4">
            {Array.from({ length: 6 }).map((_, index) => {
              const isFilled = index < pin.length;
              return (
                <motion.div
                  key={index}
                  animate={isFilled ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.15 }}
                  className={`w-4 h-4 rounded-full border transition-all duration-300 ${
                    isUnlocked 
                      ? 'bg-green-500 border-green-500' 
                      : error 
                        ? 'bg-red-500 border-red-500' 
                        : isFilled 
                          ? 'bg-primary border-primary shadow-[0_0_12px_var(--color-primary)]' 
                          : 'border-white/20 bg-transparent'
                  }`}
                />
              );
            })}
          </div>

          {/* Errors display */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-red-400 text-xs font-bold text-center flex items-center justify-center gap-1.5"
              >
                <AlertCircle className="w-4 h-4" /> {error}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Custom iOS Numeric Keypad */}
        <div className="grid grid-cols-3 gap-6 w-full max-w-[280px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className="w-16 h-16 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-xl font-bold hover:bg-white/10 active:scale-90 active:bg-white/20 transition-all outline-none"
            >
              {num}
            </button>
          ))}
          <div className="w-16 h-16" /> {/* Spacer */}
          <button
            onClick={() => handleKeyPress('0')}
            className="w-16 h-16 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-xl font-bold hover:bg-white/10 active:scale-90 active:bg-white/20 transition-all outline-none"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="w-16 h-16 flex items-center justify-center hover:text-red-400 active:scale-90 transition-all outline-none"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>
      </main>

      <footer className="text-center py-4 text-xs text-zinc-600">
        TouchLove Security System • Bảo mật mã hóa nâng cao
      </footer>
    </div>
  );
};

export default NfcUnlock;
