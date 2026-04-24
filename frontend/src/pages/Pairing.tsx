import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Send, Users, ArrowRight, Loader2, Copy, Check, Sparkles } from 'lucide-react';
import axios from 'axios';

const Pairing = () => {
  const { keyId } = useParams<{ keyId: string }>();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'selection' | 'invite' | 'accept'>('selection');
  const [loading, setLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCreateInvite = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('/api/pairing/invite');
      if (response.data.success) {
        setGeneratedCode(response.data.data);
        setMode('invite');
      } else {
        setError(response.data.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (inviteCode.length < 6) return;
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('/api/pairing/accept', { inviteCode });
      if (response.data.success) {
        // Success! Redirect to the new couple page
        navigate(`/c/${response.data.data.slug}`);
      } else {
        setError(response.data.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Mã mời không đúng hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div 
        layout
        className="glass max-w-md w-full p-8 rounded-3xl shadow-2xl overflow-hidden relative"
      >
        <AnimatePresence mode="wait">
          {mode === 'selection' && (
            <motion.div
              key="selection"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="text-center"
            >
              <Heart className="w-16 h-16 text-primary mx-auto mb-6 fill-primary/10" />
              <h1 className="text-3xl font-bold mb-4">Bạn là ai?</h1>
              <p className="text-muted-foreground mb-8">
                Hành trình kết nối bắt đầu từ đây. Hãy chọn vai trò của bạn.
              </p>

              <div className="grid gap-4">
                <button
                  onClick={handleCreateInvite}
                  disabled={loading}
                  className="group p-6 bg-white/5 border border-white/10 rounded-2xl text-left hover:border-primary/50 transition-all flex items-center justify-between"
                >
                  <div>
                    <h3 className="font-bold text-lg">Tôi muốn mời</h3>
                    <p className="text-sm text-muted-foreground">Tạo mã để gửi cho người ấy</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </div>
                </button>

                <button
                  onClick={() => setMode('accept')}
                  className="group p-6 bg-white/5 border border-white/10 rounded-2xl text-left hover:border-primary/50 transition-all flex items-center justify-between"
                >
                  <div>
                    <h3 className="font-bold text-lg">Tôi có mã mời</h3>
                    <p className="text-sm text-muted-foreground">Nhập mã người ấy đã gửi</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {mode === 'invite' && (
            <motion.div
              key="invite"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Mã mời của bạn</h1>
              <p className="text-muted-foreground mb-8">Gửi mã này cho Partner của bạn để kết đôi.</p>

              <div className="relative group cursor-pointer" onClick={copyToClipboard}>
                <div className="bg-white/5 border-2 border-dashed border-primary/30 rounded-2xl p-6 text-4xl font-black tracking-[0.5em] text-primary transition-all group-hover:border-primary group-hover:bg-primary/5">
                  {generatedCode}
                </div>
                <div className="absolute top-2 right-2 p-2 rounded-lg bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </div>
              </div>

              {copied && <p className="mt-2 text-xs text-green-500 font-medium">Đã sao chép vào bộ nhớ tạm!</p>}

              <p className="mt-8 text-sm text-muted-foreground italic">
                * Mã này có hiệu lực trong 24 giờ.
              </p>

              <button
                onClick={() => navigate('/')}
                className="mt-8 w-full py-4 rounded-2xl border border-white/10 hover:bg-white/5 transition-all text-sm font-medium"
              >
                Quay về Trang chủ
              </button>
            </motion.div>
          )}

          {mode === 'accept' && (
            <motion.div
              key="accept"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-center"
            >
              <Users className="w-16 h-16 text-primary mx-auto mb-6 fill-primary/10" />
              <h1 className="text-2xl font-bold mb-2">Nhập mã mời</h1>
              <p className="text-muted-foreground mb-8">Dán mã mời mà Partner đã gửi cho bạn.</p>

              <div className="space-y-6">
                <input
                  type="text"
                  maxLength={6}
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="VD: AB12CD"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 text-center text-3xl font-bold tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all uppercase placeholder:opacity-20"
                />

                {error && <p className="text-destructive text-sm font-medium">{error}</p>}

                <button
                  onClick={handleAcceptInvite}
                  disabled={loading || inviteCode.length < 6}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Bắt đầu hành trình 💕'}
                </button>

                <button
                  onClick={() => setMode('selection')}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Quay lại
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Pairing;
