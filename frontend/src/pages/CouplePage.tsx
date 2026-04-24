import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Calendar, Image as ImageIcon, MessageSquare, Sparkles, Clock } from 'lucide-react';
import axios from 'axios';

interface CoupleData {
  coupleName: string;
  coupleSlug: string;
  startDate: string;
  avatarAUrl?: string;
  avatarBUrl?: string;
  nfcScanCount: number;
  todayMessage?: string;
  memories: Array<{
    id: string;
    imageUrl: string;
    caption?: string;
    createdAt: string;
  }>;
}

const CouplePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<CoupleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [daysPassed, setDaysPassed] = useState(0);

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
    <div className="min-h-screen bg-background pb-20">
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
              {data.avatarAUrl ? <img src={data.avatarAUrl} alt="Partner A" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Heart className="text-primary/20" /></div>}
            </div>
            <div className="z-10 bg-white dark:bg-zinc-900 p-3 rounded-full shadow-lg">
              <Heart className="w-6 h-6 text-primary fill-primary" />
            </div>
            <div className="w-24 h-24 rounded-full border-4 border-background shadow-xl overflow-hidden bg-muted">
              {data.avatarBUrl ? <img src={data.avatarBUrl} alt="Partner B" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Heart className="text-primary/20" /></div>}
            </div>
          </div>

          <h1 className="text-2xl font-bold text-muted-foreground">{data.coupleName}</h1>
          
          <div className="space-y-1">
            <div className="text-7xl font-black text-primary tracking-tighter">
              {daysPassed}
            </div>
            <div className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground flex items-center justify-center gap-2">
              <Calendar className="w-4 h-4" />
              Ngày hạnh phúc
            </div>
          </div>
        </motion.div>
      </section>

      {/* Daily Message */}
      <section className="px-4 max-w-2xl mx-auto -mt-10 mb-12 relative z-20">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass p-6 rounded-3xl shadow-xl border-primary/10 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Sparkles className="w-12 h-12 text-primary" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-bold">Thông điệp hôm nay</h3>
          </div>
          <p className="text-lg italic leading-relaxed text-zinc-700 dark:text-zinc-300">
            "{data.todayMessage || 'Hãy luôn yêu thương và trân trọng nhau nhé!'}"
          </p>
        </motion.div>
      </section>

      {/* Memories Gallery */}
      <section className="px-4 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <ImageIcon className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Album kỷ niệm</h2>
          </div>
          <button className="text-sm font-medium text-primary hover:underline">Xem tất cả</button>
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
              <img src={memory.imageUrl} alt={memory.caption} className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-110" />
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
    </div>
  );
};

export default CouplePage;
