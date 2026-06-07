import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

const NfcRedirect = () => {
  const { keyId } = useParams<{ keyId: string }>();

  useEffect(() => {
    if (keyId) {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const backendUrl = apiUrl.replace(/\/api$/, '');
      // Redirect browser to backend NFC processing endpoint
      window.location.href = `${backendUrl}/nfc/${keyId}`;
    }
  }, [keyId]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Premium ambient light glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[40%] bg-primary/10 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[40%] bg-pink-500/10 rounded-full blur-[120px] -z-10 animate-pulse" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass max-w-sm w-full p-8 md:p-10 rounded-[3rem] shadow-2xl border border-zinc-150 dark:border-zinc-800 text-center space-y-6 backdrop-blur-md relative"
      >
        <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
          {/* Pulsing glow background */}
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-ping" />
          
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0]
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 2,
              ease: "easeInOut"
            }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-pink-500 text-white flex items-center justify-center shadow-lg shadow-primary/20 relative z-10"
          >
            <Heart className="w-8 h-8 fill-white/20 animate-pulse" />
          </motion.div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-black text-zinc-800 dark:text-zinc-100">
            Đang chạm kết nối NFC...
          </h3>
          <p className="text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed max-w-xs mx-auto">
            Hệ thống đang định cấu hình và kết nối an toàn với móc khóa TouchLove của bạn. Vui lòng chờ trong giây lát!
          </p>
        </div>

        {/* Dynamic micro-loading dots */}
        <div className="flex justify-center gap-1.5 pt-2">
          {[0, 1, 2].map((idx) => (
            <motion.div
              key={idx}
              animate={{
                y: [0, -6, 0]
              }}
              transition={{
                repeat: Infinity,
                duration: 0.6,
                delay: idx * 0.15,
                ease: "easeInOut"
              }}
              className="w-2.5 h-2.5 rounded-full bg-primary"
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default NfcRedirect;
