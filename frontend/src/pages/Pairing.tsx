import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Share2, ArrowRight, Loader2, Copy, Check } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';

const Pairing = () => {
  const { keyId } = useParams();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'selection' | 'invite' | 'accept'>('selection');
  const [inviteCode, setInviteCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerateCode = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.post('/pairing/invite');
      if (response.data.success) {
        setGeneratedCode(response.data.data);
        setMode('invite');
      } else {
        setError(response.data.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tạo mã mời.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptPairing = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.post('/pairing/accept', { inviteCode });
      if (response.data.success) {
        const couple = response.data.data;
        navigate(`/c/${couple.slug}`);
      } else {
        setError(response.data.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Mã mời không hợp lệ hoặc đã hết hạn.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <AnimatePresence mode="wait">
        {mode === 'selection' && (
          <motion.div
            key="selection"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8 text-center"
          >
            <div className="flex justify-center">
               <div className="relative">
                  <Heart className="w-20 h-20 text-primary fill-primary animate-pulse" />
                  <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-xs">US</div>
               </div>
            </div>
            <h1 className="text-3xl font-bold">Kết nối trái tim</h1>
            <p className="text-muted-foreground">
              Để bắt đầu hành trình, bạn cần kết nối với người ấy. Hãy chọn một trong hai cách dưới đây nhé!
            </p>
            
            <div className="grid gap-4">
              <button
                onClick={handleGenerateCode}
                disabled={isLoading}
                className="w-full glass p-6 rounded-3xl text-left hover:border-primary/50 transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <Share2 className="w-6 h-6 text-primary" />
                  </div>
                  {isLoading && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
                </div>
                <h3 className="font-bold text-lg group-hover:text-primary transition-colors">Tạo mã mời</h3>
                <p className="text-sm text-muted-foreground">Gửi mã cho người ấy để bắt đầu kết nối.</p>
              </button>

              <button
                onClick={() => setMode('accept')}
                className="w-full glass p-6 rounded-3xl text-left hover:border-primary/50 transition-all group"
              >
                <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-xl w-fit mb-2">
                  <ArrowRight className="w-6 h-6 text-pink-500" />
                </div>
                <h3 className="font-bold text-lg group-hover:text-primary transition-colors">Đã có mã mời?</h3>
                <p className="text-sm text-muted-foreground">Nhập mã người ấy gửi để hoàn tất kết đôi.</p>
              </button>
            </div>
          </motion.div>
        )}

        {mode === 'invite' && (
          <motion.div
            key="invite"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8 text-center"
          >
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Share2 className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-3xl font-bold">Gửi lời mời</h2>
            <p className="text-muted-foreground">Chia sẻ mã này với người ấy. Mã sẽ hết hạn sau 24 giờ.</p>
            
            <div className="relative group">
               <div className="text-5xl font-black tracking-widest py-6 bg-secondary rounded-3xl border-2 border-dashed border-primary/30 text-primary select-all">
                  {generatedCode}
               </div>
               <button 
                 onClick={copyToClipboard}
                 className="absolute top-2 right-2 p-2 bg-background/80 rounded-xl hover:bg-background transition-all border shadow-sm"
               >
                 {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
               </button>
            </div>

            <button
              onClick={() => navigate('/')}
              className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold"
            >
              Xong, chờ người ấy
            </button>
          </motion.div>
        )}

        {mode === 'accept' && (
          <motion.div
            key="accept"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="text-center">
               <h2 className="text-3xl font-bold mb-2">Nhập mã mời</h2>
               <p className="text-muted-foreground">Nhập 6 ký tự mà người ấy đã gửi cho bạn</p>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive p-4 rounded-2xl flex items-center gap-3 text-sm">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}

            <div className="space-y-4">
               <input
                 value={inviteCode}
                 onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                 className="w-full text-4xl font-black tracking-[1rem] text-center bg-secondary/50 border-0 rounded-3xl py-6 focus:ring-2 focus:ring-primary outline-none"
                 placeholder="••••••"
                 maxLength={6}
               />
               <button
                 onClick={handleAcceptPairing}
                 disabled={inviteCode.length !== 6 || isLoading}
                 className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold disabled:opacity-50 disabled:scale-100 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
               >
                 {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Chấp nhận kết đôi'}
               </button>
               <button
                 onClick={() => setMode('selection')}
                 className="w-full py-2 text-sm text-muted-foreground hover:text-foreground"
               >
                 Quay lại
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Pairing;
