import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Calendar, Image as ImageIcon, MessageSquare, Sparkles, Clock, Plus, Bell, ArrowRight } from 'lucide-react';
import axios from '../api/axiosInstance';
import * as signalR from '@microsoft/signalr';
import PhotoUploadModal from '../components/shared/PhotoUploadModal';
import MilestonesWidget from '../components/couple/MilestonesWidget';
import { Link } from 'react-router-dom';

interface CoupleData {
  id: string;
  coupleName: string;
  coupleSlug: string;
  startDate: string;
  avatarUrl?: string;
  partnerAvatarUrl?: string;
  partnerName?: string;
  description?: string;
  nfcScanCount: number;
  todayMessage?: string;
  memories: Array<{
    id: string;
    url: string;
    caption?: string;
    createdAt: string;
  }>;
}

const FloatingHeart = ({ id, onComplete }: { id: number, onComplete: (id: number) => void }) => {
  return (
    <motion.div
      initial={{ y: 0, x: 0, opacity: 1, scale: 1 }}
      animate={{ 
        y: -400, 
        x: (Math.random() - 0.5) * 200,
        opacity: 0,
        scale: 1.5,
        rotate: (Math.random() - 0.5) * 45
      }}
      transition={{ duration: 3, ease: "easeOut" }}
      onAnimationComplete={() => onComplete(id)}
      className="absolute bottom-10 left-1/2 -translate-x-1/2 pointer-events-none text-primary"
    >
      <Heart className="w-8 h-8 fill-current" />
    </motion.div>
  );
};

const CouplePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<CoupleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [daysPassed, setDaysPassed] = useState(0);
  const [nudging, setNudging] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [hearts, setHearts] = useState<{ id: number }[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  const spawnHearts = () => {
    const newHearts = Array.from({ length: 12 }).map(() => ({
      id: Math.random()
    }));
    setHearts(prev => [...prev, ...newHearts]);
  };

  const removeHeart = (id: number) => {
    setHearts(prev => prev.filter(h => h.id !== id));
  };

  const handleNudge = async () => {
    if (!data) return;
    setNudging(true);
    try {
      await axios.post(`/api/couples/${data.id}/nudge`);
      spawnHearts();
    } catch (error) {
      console.error('Failed to send nudge', error);
    } finally {
      setTimeout(() => setNudging(false), 2000);
    }
  };

  const handleUploadSuccess = (newMemory: any) => {
    if (data) {
      setData({
        ...data,
        memories: [newMemory, ...data.memories]
      });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`/api/couples/${slug}`);
        if (response.data.success) {
          setData(response.data.data);
          calculateDays(response.data.data.startDate);
        }
      } catch (error) {
        console.error('Failed to fetch couple data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  useEffect(() => {
    if (data?.id && !connectionRef.current) {
      const connection = new signalR.HubConnectionBuilder()
        .withUrl('/hubs/couple')
        .withAutomaticReconnect()
        .build();

      connection.start()
        .then(() => {
          connection.invoke('JoinCoupleGroup', data.id);
          
          connection.on('ReceiveNudge', (senderName) => {
            setNotification(`${senderName} đang nhớ bạn!`);
            spawnHearts();
            setTimeout(() => setNotification(null), 5000);
          });
        })
        .catch(err => console.error('SignalR Connection Error: ', err));

      connectionRef.current = connection;
    }

    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop();
        connectionRef.current = null;
      }
    };
  }, [data?.id]);

  const calculateDays = (startDateStr: string) => {
    const start = new Date(startDateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    setDaysPassed(diff);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Heart className="w-12 h-12 text-primary fill-primary" />
        </motion.div>
      </div>
    );
  }

  if (!data) return <div className="text-center py-20">Không tìm thấy thông tin cặp đôi.</div>;

  return (
    <div className="min-h-screen bg-background pb-20 relative overflow-hidden">
      {/* Floating Hearts Container */}
      <div className="fixed inset-0 pointer-events-none z-50">
        <AnimatePresence>
          {hearts.map(heart => (
            <FloatingHeart key={heart.id} id={heart.id} onComplete={removeHeart} />
          ))}
        </AnimatePresence>
      </div>

      {/* Nudge Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-[60] bg-white dark:bg-zinc-900 shadow-2xl rounded-full px-6 py-3 flex items-center gap-3 border border-primary/20"
          >
            <div className="bg-primary/10 p-2 rounded-full">
              <Bell className="w-5 h-5 text-primary animate-bounce" />
            </div>
            <span className="font-bold text-sm text-zinc-800 dark:text-zinc-100">{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section / Day Counter */}
      <section className="relative h-[60vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden">
        {/* Background Decorative Circles */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg aspect-square bg-primary/5 blur-3xl rounded-full -z-10" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-center -space-x-6">
            <div className="w-24 h-24 rounded-full border-4 border-background shadow-xl overflow-hidden bg-muted">
              {data.avatarUrl ? <img src={data.avatarUrl} alt="You" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-primary/40 bg-primary/5">TL</div>}
            </div>
            <div className="z-10 bg-white dark:bg-zinc-900 p-3 rounded-full shadow-lg">
              <Heart className="w-6 h-6 text-primary fill-primary" />
            </div>
            <div className="w-24 h-24 rounded-full border-4 border-background shadow-xl overflow-hidden bg-muted">
              {data.partnerAvatarUrl ? <img src={data.partnerAvatarUrl} alt={data.partnerName} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-primary/40 bg-primary/5">TL</div>}
            </div>
          </div>

          <h1 className="text-2xl font-bold text-muted-foreground">{data.coupleName}</h1>
          
          <div className="space-y-1">
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 100 }}
              className="text-7xl font-black text-primary tracking-tighter"
            >
              {daysPassed}
            </motion.div>
            <div className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground flex items-center justify-center gap-2">
              <Calendar className="w-4 h-4" />
              Ngày hạnh phúc
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNudge}
            disabled={nudging}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary/10 text-primary rounded-full font-bold hover:bg-primary/20 transition-colors disabled:opacity-50"
          >
            <Heart className={`w-5 h-5 ${nudging ? 'animate-ping' : 'fill-primary'}`} />
            {nudging ? 'Đang gửi yêu thương...' : 'Nhớ bạn'}
          </motion.button>
        </motion.div>
      </section>

      {/* Daily Message & Milestones */}
      <section className="px-4 max-w-5xl mx-auto -mt-10 mb-12 relative z-20">
        <div className="grid lg:grid-cols-3 gap-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 glass p-6 md:p-10 rounded-[2.5rem] shadow-xl border-primary/10 relative overflow-hidden group h-fit"
          >
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <Sparkles className="w-16 h-16 text-primary" />
            </div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-xl">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Thông điệp hôm nay</h2>
              </div>
              <Link 
                to={`/c/${slug}/messages`}
                className="text-sm font-bold text-primary hover:underline flex items-center gap-1"
              >
                Xem lịch sử <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <p className="text-xl md:text-2xl italic leading-relaxed text-zinc-700 dark:text-zinc-300 font-medium">
              "{data.todayMessage || 'Hãy luôn yêu thương và trân trọng nhau nhé!'}"
            </p>
          </motion.div>

          <div className="lg:col-span-1">
            <MilestonesWidget slug={slug!} />
          </div>
        </div>
      </section>

      {/* Memories Gallery */}
      <section className="px-4 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <ImageIcon className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Album kỷ niệm</h2>
          </div>
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            Thêm kỷ niệm
          </button>
        </div>

        <div className="columns-2 md:columns-3 gap-4 space-y-4">
          {data.memories.map((memory, idx) => (
            <motion.div 
              key={memory.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="relative rounded-2xl overflow-hidden group shadow-lg"
            >
              <img src={memory.url} alt={memory.caption} className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                <p className="text-white text-sm font-medium line-clamp-2">{memory.caption}</p>
                <div className="flex items-center gap-2 text-white/70 text-[10px] mt-2">
                  <Clock className="w-3 h-3" />
                  {new Date(memory.createdAt).toLocaleDateString()}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {data.memories.length === 0 && (
          <div className="text-center py-20 bg-muted/30 rounded-3xl border-2 border-dashed border-muted">
            <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Chưa có kỷ niệm nào được tải lên.</p>
          </div>
        )}
      </section>

      {/* Upload Modal */}
      <PhotoUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        coupleId={data.id}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
};

export default CouplePage;
