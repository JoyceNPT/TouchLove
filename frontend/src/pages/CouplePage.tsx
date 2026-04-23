import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Calendar, Image as ImageIcon, MessageSquare, History, Camera, Bookmark, Share2 } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import { useAuthStore } from '../store/authStore';

const CouplePage = () => {
  const { slug } = useParams();
  const { user } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [todayMessage, setTodayMessage] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'album' | 'history'>('album');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [coupleRes, messageRes] = await Promise.all([
          axiosInstance.get(`/couples/${slug}`),
          axiosInstance.get(`/couples/${slug}/message/today`)
        ]);
        setData(coupleRes.data.data);
        setTodayMessage(messageRes.data.data);
      } catch (err) {
        console.error('Failed to fetch couple data', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [slug]);

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Heart className="w-12 h-12 text-primary animate-pulse fill-primary" />
    </div>
  );

  if (!data) return (
    <div className="text-center py-20">
      <h2 className="text-2xl font-bold">Không tìm thấy cặp đôi này 💔</h2>
    </div>
  );

  const daysTogether = Math.floor((new Date().getTime() - new Date(data.startDate).getTime()) / (1000 * 3600 * 24));

  return (
    <div className="max-w-4xl mx-auto px-4 pb-20">
      {/* Header / Hero */}
      <section className="pt-12 pb-8 text-center relative">
        <div className="flex justify-center items-center gap-6 mb-8">
          <AvatarWithRing url={data.avatarAUrl} name={data.partnerAName} />
          <div className="relative">
            <Heart className="w-10 h-10 text-primary fill-primary animate-bounce" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full animate-ping" />
          </div>
          <AvatarWithRing url={data.avatarBUrl} name={data.partnerBName} />
        </div>

        <h1 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
          {data.coupleName || 'Hành trình yêu'}
        </h1>
        <p className="text-muted-foreground mb-6 italic">"{data.description || 'Yêu là cùng nhau nhìn về một hướng...'}"</p>
        
        <div className="inline-flex items-center gap-3 glass px-6 py-3 rounded-full shadow-lg">
          <Calendar className="w-5 h-5 text-primary" />
          <span className="text-lg font-bold">Đã yêu nhau {daysTogether} ngày</span>
        </div>
      </section>

      {/* Daily Message Card */}
      <section className="mb-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary/5 to-pink-500/5 border border-primary/10 rounded-[2rem] p-8 relative overflow-hidden group shadow-xl"
        >
          <div className="absolute top-4 right-4 flex gap-2">
            <button className="p-2 glass rounded-full hover:bg-primary/10 transition-colors">
              <Bookmark className="w-5 h-5 text-primary" />
            </button>
            <button className="p-2 glass rounded-full hover:bg-primary/10 transition-colors">
              <Share2 className="w-5 h-5 text-primary" />
            </button>
          </div>
          
          <div className="flex items-center gap-2 text-primary font-bold mb-4">
            <MessageSquare className="w-5 h-5" />
            <span>Thông điệp hôm nay</span>
          </div>
          
          <p className="text-xl md:text-2xl font-medium leading-relaxed italic text-foreground/90">
            {todayMessage?.content || "Hôm nay là một ngày tuyệt vời để yêu em nhiều hơn..."}
          </p>
          
          <div className="mt-6 flex items-center justify-between">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              {todayMessage?.source === 'AI' ? (
                <><SparkleIcon className="w-3 h-3 text-amber-400" /> Được tạo bởi AI</>
              ) : (
                <><Heart className="w-3 h-3 text-primary" /> Từ TouchLove Team</>
              )}
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>

          {/* Decorative elements */}
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
        </motion.div>
      </section>

      {/* Tabs / Content */}
      <div className="flex gap-4 mb-8 border-b">
        <TabButton 
          active={activeTab === 'album'} 
          onClick={() => setActiveTab('album')} 
          icon={<ImageIcon className="w-5 h-5" />} 
          label="Album kỷ niệm" 
        />
        <TabButton 
          active={activeTab === 'history'} 
          onClick={() => setActiveTab('history')} 
          icon={<History className="w-5 h-5" />} 
          label="Lịch sử NFC" 
        />
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'album' ? (
          <motion.div
            key="album"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-2 sm:grid-cols-3 gap-4"
          >
            {/* Upload Button (if owner) */}
            {data.id && (
              <div className="aspect-square rounded-2xl border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Camera className="w-6 h-6 text-muted-foreground group-hover:text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground group-hover:text-primary">Thêm ảnh mới</span>
              </div>
            )}

            {data.recentMemories?.map((memory: any) => (
              <div key={memory.id} className="aspect-square rounded-2xl overflow-hidden shadow-md group relative">
                <img src={memory.url} alt={memory.caption} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                  <p className="text-[10px] text-white/90 line-clamp-2">{memory.caption}</p>
                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="history"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
             <div className="glass p-6 rounded-2xl text-center">
                <History className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-muted-foreground">Tính năng xem lịch sử chi tiết đang được phát triển.</p>
                <div className="mt-4 text-2xl font-bold text-primary">
                   Tổng cộng: {data.nfcScanCount} lượt chạm
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AvatarWithRing = ({ url, name }: { url?: string, name?: string }) => (
  <div className="relative">
    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full p-1 bg-gradient-to-br from-primary to-pink-500 shadow-xl">
      <div className="w-full h-full rounded-full bg-background overflow-hidden border-2 border-background">
        {url ? (
          <img src={url} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary text-primary font-bold text-2xl">
            {name?.[0]?.toUpperCase() || 'U'}
          </div>
        )}
      </div>
    </div>
    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white dark:bg-zinc-800 px-3 py-0.5 rounded-full shadow text-[10px] font-bold whitespace-nowrap">
      {name || 'Partner'}
    </div>
  </div>
);

const TabButton = ({ active, onClick, icon, label }: any) => (
  <button
    onClick={onClick}
    className={`pb-4 flex items-center gap-2 font-medium transition-all relative ${
      active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
    }`}
  >
    {icon}
    <span>{label}</span>
    {active && (
      <motion.div 
        layoutId="tab-underline" 
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" 
      />
    )}
  </button>
);

const SparkleIcon = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
);

export default CouplePage;
