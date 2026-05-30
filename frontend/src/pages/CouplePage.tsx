import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  Calendar, 
  Image as ImageIcon, 
  MessageSquare, 
  Star, 
  Clock, 
  Plus, 
  Bell, 
  ArrowRight, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Film, 
  Check, 
  AlertCircle, 
  Link as LinkIcon, 
  Lock,
  Settings,
  LayoutGrid,
  GitBranch,
  Images,
  User,
  Globe
} from 'lucide-react';
import axios from '../api/axiosInstance';
import * as signalR from '@microsoft/signalr';
import { toast } from '../store/useToastStore';
import PhotoUploadModal from '../components/shared/PhotoUploadModal';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface CoupleData {
  id: string;
  coupleName: string;
  coupleSlug: string;
  startDate: string;
  avatarUrl?: string;
  partnerAvatarUrl?: string;
  partnerName?: string;
  partnerAName?: string;
  partnerBName?: string;
  description?: string;
  nfcScanCount: number;
  todayMessage?: string;
  isStartDateConfirmed: boolean;
  proposedStartDate?: string;
  proposedByUserId?: string;
  memories: Array<{
    id: string;
    url: string;
    additionalUrls?: string[];
    caption?: string;
    createdAt: string;
    mimeType: string;
    uploadedBy?: string;
  }>;
  isPublic: boolean;
  isAlbumPublic: boolean;
  isAnniversariesPublic: boolean;
  isAchievementsPublic: boolean;
  partnerAUserId?: string;
  partnerBUserId?: string;
}

type MemoryViewMode = 'album' | 'timeline';

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

/** Carousel modal for a single memory with multiple media files */
const MemoryCarouselModal = ({ 
  memory, 
  onClose 
}: { 
  memory: CoupleData['memories'][0] | null;
  onClose: () => void;
}) => {
  const [idx, setIdx] = useState(0);
  
  useEffect(() => { setIdx(0); }, [memory?.id]);

  if (!memory) return null;

  const allMedia = [
    { url: memory.url, mimeType: memory.mimeType },
    ...(memory.additionalUrls || []).map(u => ({
      url: u,
      mimeType: u.match(/\.(mp4|webm|mov|avi)$/i) ? 'video/mp4' : 'image/jpeg'
    }))
  ];

  const current = allMedia[idx];
  const isVideo = current.mimeType?.startsWith('video/');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-md flex flex-col justify-between p-4"
        onClick={onClose}
      >
        {/* Header */}
        <div className="flex items-center justify-between w-full p-4 z-20">
          <span className="text-white/70 text-xs font-black uppercase tracking-widest">
            {allMedia.length > 1 ? `Ảnh ${idx + 1} / ${allMedia.length}` : 'Chi tiết kỷ niệm'}
          </span>
          <button 
            onClick={onClose}
            className="p-3 bg-zinc-900/60 hover:bg-zinc-800 rounded-full text-white backdrop-blur-md transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Media viewer */}
        <div className="relative flex-1 flex items-center justify-center p-4">
          {allMedia.length > 1 && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); setIdx(i => i > 0 ? i - 1 : allMedia.length - 1); }}
                className="absolute left-2 sm:left-6 p-4 bg-zinc-900/60 hover:bg-zinc-800 text-white rounded-full backdrop-blur-md transition-all shadow-xl z-20"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setIdx(i => i < allMedia.length - 1 ? i + 1 : 0); }}
                className="absolute right-2 sm:right-6 p-4 bg-zinc-900/60 hover:bg-zinc-800 text-white rounded-full backdrop-blur-md transition-all shadow-xl z-20"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          <AnimatePresence mode="wait">
            <motion.div 
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="max-w-4xl max-h-[70vh] rounded-3xl overflow-hidden shadow-2xl border border-zinc-800"
              onClick={(e) => e.stopPropagation()}
            >
              {isVideo ? (
                <video src={current.url} className="w-full h-full max-h-[70vh] object-contain mx-auto bg-black" controls autoPlay />
              ) : (
                <img src={current.url} alt={memory.caption} className="w-full h-full max-h-[70vh] object-contain mx-auto" />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Thumbnail strip for multi-media */}
        {allMedia.length > 1 && (
          <div className="flex justify-center gap-2 py-2 overflow-x-auto">
            {allMedia.map((m, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setIdx(i); }}
                className={`w-12 h-12 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${i === idx ? 'border-primary scale-110' : 'border-zinc-700 opacity-50 hover:opacity-80'}`}
              >
                {m.mimeType?.startsWith('video/') ? (
                  <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-white">
                    <Film className="w-4 h-4" />
                  </div>
                ) : (
                  <img src={m.url} alt="" className="w-full h-full object-cover" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Footer info */}
        <div 
          className="w-full max-w-2xl mx-auto glass p-5 rounded-3xl border border-zinc-800 text-white shadow-2xl z-20 space-y-3 mb-2"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/45 text-primary flex items-center justify-center font-black shadow-inner text-sm">
              {memory.uploadedBy ? memory.uploadedBy.substring(0, 2).toUpperCase() : 'TL'}
            </div>
            <div>
              <h4 className="font-bold text-sm">Đăng bởi {memory.uploadedBy || 'Ẩn danh'}</h4>
              <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {new Date(memory.createdAt).toLocaleDateString('vi-VN', { 
                  year: 'numeric', month: 'long', day: 'numeric',
                  hour: '2-digit', minute: '2-digit' 
                })}
              </span>
            </div>
          </div>
          {memory.caption && (
            <p className="text-zinc-200 text-sm leading-relaxed italic bg-white/5 p-4 rounded-2xl border border-white/5">
              "{memory.caption}"
            </p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

const CouplePage = () => {
  const { coupleId } = useParams<{ coupleId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [data, setData] = useState<CoupleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [daysPassed, setDaysPassed] = useState(0);
  const [nudging, setNudging] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [hearts, setHearts] = useState<{ id: number }[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  // States for proposing start date
  const [proposedDateInput, setProposedDateInput] = useState('');
  const [isSubmittingDate, setIsSubmittingDate] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);

  // State for pairing modal helper
  const [isPairingModalOpen, setIsPairingModalOpen] = useState(false);

  // Memory carousel modal
  const [selectedMemory, setSelectedMemory] = useState<CoupleData['memories'][0] | null>(null);

  // Privacy toggles states
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [isAlbumPublic, setIsAlbumPublic] = useState(true);
  const [isAnniversariesPublic, setIsAnniversariesPublic] = useState(true);
  const [isAchievementsPublic, setIsAchievementsPublic] = useState(true);
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);

  // Album / Timeline mode
  const [memoryViewMode, setMemoryViewMode] = useState<MemoryViewMode>('album');

  // Compute Ownership
  const isOwner = !!user && !!data && (user.id === data.partnerAUserId || user.id === data.partnerBUserId);

  // Build display names: prefer nickname
  const coupleDisplayName = data
    ? (data.partnerAName && data.partnerBName
      ? `${data.partnerAName} 💕 ${data.partnerBName}`
      : data.coupleName)
    : '';

  // Demo placeholder memories
  const memoriesToShow = data?.memories && data.memories.length > 0
    ? data.memories
    : [
        {
          id: 'demo-1',
          url: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&q=80&w=600',
          caption: 'Lần đầu tiên hai đứa gặp nhau ở quán cà phê nhỏ, ngượng ngùng không dám nhìn thẳng mắt nhau... 💕',
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          mimeType: 'image/jpeg',
          uploadedBy: data?.partnerName || 'Đối phương'
        },
        {
          id: 'demo-2',
          url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=600',
          caption: 'Chuyến đi phượt cuối tuần đầy ắp tiếng cười. Cùng nhau đi trốn đến nơi xa xôi rộng lớn 🚗✨',
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          mimeType: 'image/jpeg',
          uploadedBy: 'TouchLove'
        },
        {
          id: 'demo-3',
          url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=600',
          caption: 'Cùng ngắm hoàng hôn đỏ rực buông xuống. Mong rằng hoàng hôn nào chúng ta cũng có nhau!',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          mimeType: 'image/jpeg',
          uploadedBy: 'Bạn'
        },
        {
          id: 'demo-4',
          url: 'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&q=80&w=600',
          caption: 'Khoảnh khắc bình yên nhất là khi được ở bên em. Không cần đi đâu xa 🌸',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          mimeType: 'image/jpeg',
          uploadedBy: 'Hệ thống'
        }
      ];

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
      await axios.post(`/couples/${data.id}/nudge`);
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

  const fetchCoupleData = async () => {
    try {
      const response = await axios.get(`/couples/${coupleId}`);
      if (response.data.success) {
        const cd = response.data.data;
        cd.memories = cd.recentMemories || [];
        cd.avatarUrl = cd.avatarAUrl;
        cd.partnerAvatarUrl = cd.avatarBUrl;
        cd.partnerName = cd.partnerBName;

        setData(cd);
        setIsPublic(cd.isPublic);
        setIsAlbumPublic(cd.isAlbumPublic);
        setIsAnniversariesPublic(cd.isAnniversariesPublic);
        setIsAchievementsPublic(cd.isAchievementsPublic);

        if (cd.isStartDateConfirmed) {
          calculateDays(cd.startDate);
        }
      } else {
        setData(null);
      }
    } catch (error) {
      console.error('Failed to fetch couple data', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupleData();
  }, [coupleId]);

  useEffect(() => {
    if (data?.id && !connectionRef.current) {
      const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
      const connection = new signalR.HubConnectionBuilder()
        .withUrl(`${backendUrl}/hubs/couple`)
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

  const handleProposeDate = async () => {
    if (!proposedDateInput || !data) return;
    setIsSubmittingDate(true);
    setDateError(null);
    try {
      const response = await axios.post(`/couples/${data.id}/propose-start-date`, { proposedDate: proposedDateInput });
      if (response.data.success) {
        setData({
          ...data,
          proposedStartDate: proposedDateInput,
          proposedByUserId: user?.id
        });
      } else {
        setDateError(response.data.message || 'Không thể đề xuất ngày yêu');
      }
    } catch (err: any) {
      setDateError(err.response?.data?.message || 'Có lỗi xảy ra khi đề xuất');
    } finally {
      setIsSubmittingDate(false);
    }
  };

  const handleConfirmDate = async () => {
    if (!data) return;
    setLoading(true);
    try {
      const response = await axios.post(`/couples/${data.id}/confirm-start-date`);
      if (response.data.success) {
        await fetchCoupleData();
      }
    } catch (err) {
      console.error('Confirm date failed', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectDate = async () => {
    if (!data) return;
    setLoading(true);
    try {
      const response = await axios.post(`/couples/${data.id}/reject-start-date`);
      if (response.data.success) {
        await fetchCoupleData();
      }
    } catch (err) {
      console.error('Reject date failed', err);
    } finally {
      setLoading(false);
    }
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

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass max-w-md w-full p-8 md:p-10 rounded-[3rem] shadow-2xl border border-zinc-150 dark:border-zinc-700 text-center space-y-8"
        >
          <div className="w-20 h-20 rounded-full bg-pink-500/10 text-pink-500 flex items-center justify-center mx-auto shadow-inner">
            <Heart className="w-10 h-10 animate-pulse text-primary fill-primary" />
          </div>
          
          <div className="space-y-3">
            <h2 className="text-2xl font-black text-zinc-800 dark:text-zinc-100">
              Không tìm thấy thông tin cặp đôi
            </h2>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Tài khoản hoặc thiết bị này chưa được kết nối ghép đôi với nhau. Hãy tiến hành ghép đôi hai thẻ NFC để kích hoạt không gian tình yêu chung.
            </p>
          </div>

          <button 
            onClick={() => setIsPairingModalOpen(true)}
            className="w-full bg-primary hover:bg-primary/95 text-white font-black py-4 rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
          >
            <LinkIcon className="w-5 h-5" />
            Ghép đôi ngay
          </button>
        </motion.div>
      </div>
    );
  }

  if (!isOwner && !data.isPublic) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass max-w-md w-full p-8 md:p-10 rounded-[3rem] shadow-2xl border border-zinc-150 dark:border-zinc-700 text-center space-y-8"
        >
          <div className="w-20 h-20 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-10 h-10 animate-bounce text-primary" />
          </div>
          
          <div className="space-y-3">
            <h2 className="text-2xl font-black text-zinc-800 dark:text-zinc-100">
              Không Gian Riêng Tư 🔒
            </h2>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Không gian tình yêu này đã được chủ sở hữu thiết lập ở chế độ riêng tư. Chỉ có hai người trong cuộc mới có quyền truy cập.
            </p>
          </div>

          <button 
            onClick={() => navigate('/explore')}
            className="w-full bg-primary hover:bg-primary/95 text-white font-black py-4 rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
          >
            Quay lại trang Khám Phá
          </button>
        </motion.div>
      </div>
    );
  }

  const isProposedByMe = data.proposedByUserId === user?.id;
  const hasProposedDate = !!data.proposedStartDate;

  return (
    <div className="min-h-screen bg-background pb-20 relative overflow-hidden">
      {/* Floating Hearts */}
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

      {/* ===================== HERO SECTION ===================== */}
      <section className="relative min-h-[60vh] flex flex-col items-center justify-center text-center px-4 pt-16 pb-12 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg aspect-square bg-primary/5 blur-3xl rounded-full -z-10" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 sm:space-y-8 w-full max-w-xl mx-auto"
        >
          {/* ECG & Avatars */}
          <div className="relative w-full max-w-md sm:max-w-lg h-36 mx-auto mb-2 flex items-center justify-between px-6 sm:px-12 z-10">
            {/* ECG SVG */}
            <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
              <svg viewBox="0 0 600 120" className="w-full h-full overflow-visible" fill="none">
                <defs>
                  <linearGradient id="heartbeat-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ec4899" />
                    <stop offset="50%" stopColor="#f43f5e" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
                <motion.path
                  d="M 10,60 H 220 L 230,30 L 242,90 L 254,50 L 260,70 L 266,60 H 280 C 280,42 290,38 300,55 C 300,72 290,88 300,105"
                  stroke="#f43f5e" strokeWidth="6" opacity="0.15"
                  strokeLinecap="round" strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: [0, 1, 1, 0] }}
                  transition={{ duration: 4, ease: "easeInOut", repeat: Infinity, times: [0, 0.6, 0.9, 1] }}
                />
                <motion.path
                  d="M 10,60 H 220 L 230,30 L 242,90 L 254,50 L 260,70 L 266,60 H 280 C 280,42 290,38 300,55 C 300,72 290,88 300,105"
                  stroke="url(#heartbeat-gradient)" strokeWidth="3.5"
                  strokeLinecap="round" strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: [0, 1, 1, 0] }}
                  transition={{ duration: 4, ease: "easeInOut", repeat: Infinity, times: [0, 0.6, 0.9, 1] }}
                />
                <motion.path
                  d="M 590,60 H 380 L 370,30 L 358,90 L 346,50 L 340,70 L 334,60 H 320 C 320,42 310,38 300,55 C 300,72 310,88 300,105"
                  stroke="#f43f5e" strokeWidth="6" opacity="0.15"
                  strokeLinecap="round" strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: [0, 1, 1, 0] }}
                  transition={{ duration: 4, ease: "easeInOut", repeat: Infinity, times: [0, 0.6, 0.9, 1] }}
                />
                <motion.path
                  d="M 590,60 H 380 L 370,30 L 358,90 L 346,50 L 340,70 L 334,60 H 320 C 320,42 310,38 300,55 C 300,72 310,88 300,105"
                  stroke="url(#heartbeat-gradient)" strokeWidth="3.5"
                  strokeLinecap="round" strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: [0, 1, 1, 0] }}
                  transition={{ duration: 4, ease: "easeInOut", repeat: Infinity, times: [0, 0.6, 0.9, 1] }}
                />
              </svg>
            </div>

            {/* Left Avatar */}
            <div className="relative z-10 flex flex-col items-center gap-1 hover:scale-105 transition-transform duration-300">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-white dark:border-zinc-800 shadow-2xl overflow-hidden bg-muted relative group ring-4 ring-primary/10">
                {data.avatarUrl ? <img src={data.avatarUrl} alt="You" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-primary/40 bg-primary/5">Bạn</div>}
              </div>
            </div>

            {/* Center Pulsing Heart */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.2, 1, 1.2, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                onClick={spawnHearts}
                className="w-11 h-11 sm:w-14 sm:h-14 bg-white/70 dark:bg-zinc-900/80 border border-primary/20 rounded-full flex items-center justify-center backdrop-blur-md shadow-lg shadow-primary/10 text-primary cursor-pointer hover:bg-primary hover:text-white transition-colors"
                title="Bấm để gửi ngàn trái tim yêu thương!"
              >
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 fill-current animate-pulse text-primary hover:text-inherit" />
              </motion.div>
            </div>

            {/* Right Avatar */}
            <div className="relative z-10 flex flex-col items-center gap-1 hover:scale-105 transition-transform duration-300">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-white dark:border-zinc-800 shadow-2xl overflow-hidden bg-muted relative group ring-4 ring-primary/10">
                {data.partnerAvatarUrl ? <img src={data.partnerAvatarUrl} alt={data.partnerName} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-primary/40 bg-primary/5">TL</div>}
              </div>
            </div>
          </div>

          {/* Couple Name & actions */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center justify-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-zinc-850 to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
                {coupleDisplayName}
              </h1>
              {isOwner && (
                <button 
                  onClick={() => setIsPrivacyModalOpen(true)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border shadow-sm ${
                    isPublic 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 dark:hover:bg-emerald-500/20' 
                      : 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700 dark:hover:bg-zinc-700'
                  }`}
                  title="Cài đặt riêng tư không gian"
                >
                  {isPublic ? (
                    <><Globe className="w-3.5 h-3.5" /> Công khai</>
                  ) : (
                    <><Lock className="w-3.5 h-3.5" /> Riêng tư</>
                  )}
                </button>
              )}
            </div>
            {isOwner && (
              <Link
                to="/nfc-profile"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-secondary hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-sm font-bold text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition-all"
              >
                <User className="w-4 h-4 text-primary" />
                Về hồ sơ cá nhân
              </Link>
            )}
          </div>
          
          {/* Start Date flow */}
          {!data.isStartDateConfirmed ? (
            isOwner ? (
              <div className="glass p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-primary/20 shadow-2xl space-y-5 sm:space-y-6 max-w-md mx-auto">
                {!hasProposedDate ? (
                  <>
                    <div className="space-y-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 text-pink-500 text-xs font-black">
                        <AlertCircle className="w-3.5 h-3.5" /> Chưa kích hoạt bộ đếm
                      </span>
                      <h3 className="text-lg font-black text-zinc-800 dark:text-zinc-100">Kích hoạt bộ đếm ngày yêu</h3>
                      <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
                        Để bắt đầu đếm ngược số ngày hạnh phúc bên nhau, hãy nhập ngày hai bạn chính thức yêu nhau. Đối phương sẽ cần xác nhận ngày này!
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto">
                      <input 
                        type="date" 
                        value={proposedDateInput}
                        onChange={(e) => setProposedDateInput(e.target.value)}
                        className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <button 
                        onClick={handleProposeDate}
                        disabled={!proposedDateInput || isSubmittingDate}
                        className="bg-primary hover:bg-primary/95 text-white font-bold px-6 py-3 rounded-2xl shadow-lg shadow-primary/20 transition-all text-sm disabled:opacity-50"
                      >
                        {isSubmittingDate ? 'Đang gửi...' : 'Đề xuất'}
                      </button>
                    </div>
                    {dateError && <p className="text-xs font-semibold text-red-500 mt-2">{dateError}</p>}
                  </>
                ) : isProposedByMe ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl max-w-sm mx-auto flex items-center gap-3">
                      <div className="p-2 bg-yellow-500/10 text-yellow-600 rounded-xl">
                        <Clock className="w-5 h-5 animate-pulse" />
                      </div>
                      <div className="text-left">
                        <h4 className="text-sm font-bold text-yellow-600">Đang chờ đối phương</h4>
                        <p className="text-[10px] text-zinc-500">
                          Đã gửi đề xuất ngày bắt đầu yêu là: <span className="font-bold">{new Date(data.proposedStartDate!).toLocaleDateString('vi-VN')}</span>
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-400">Chúng tôi sẽ thông báo ngay khi đối phương xác nhận!</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 text-xs font-black">
                        <AlertCircle className="w-3.5 h-3.5" /> Có đề xuất từ đối phương
                      </span>
                      <h3 className="text-lg font-black text-zinc-800 dark:text-zinc-100">Xác nhận ngày yêu nhau</h3>
                      <p className="text-xs text-zinc-500 leading-relaxed max-w-sm mx-auto">
                        Đối phương đề xuất ngày bắt đầu yêu là: <span className="font-black text-primary text-sm">{new Date(data.proposedStartDate!).toLocaleDateString('vi-VN')}</span>. Bạn có đồng ý không?
                      </p>
                    </div>
                    <div className="flex justify-center gap-3">
                      <button 
                        onClick={handleRejectDate}
                        className="border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold px-6 py-3 rounded-2xl text-sm transition-all"
                      >
                        Từ chối / Thay đổi
                      </button>
                      <button 
                        onClick={handleConfirmDate}
                        className="bg-primary hover:bg-primary/95 text-white font-bold px-8 py-3 rounded-2xl text-sm shadow-lg shadow-primary/20 flex items-center gap-2 transition-all"
                      >
                        <Check className="w-4 h-4" /> Đồng ý xác nhận
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="glass p-8 rounded-[2.5rem] text-center flex flex-col items-center justify-center max-w-md mx-auto opacity-70 border border-dashed border-zinc-250">
                <Heart className="w-8 h-8 text-zinc-400 mb-3 animate-pulse" />
                <p className="text-zinc-500 text-sm font-bold">Chưa kích hoạt bộ đếm ngày yêu</p>
                <p className="text-xs text-zinc-400 mt-1">Cặp đôi này đang thiết lập không gian chung của họ.</p>
              </div>
            )
          ) : (
            // Activated love days counter
            <div className="space-y-4">
              <div className="space-y-1">
                <motion.div 
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 100 }}
                  className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-primary tracking-tighter leading-none"
                >
                  {daysPassed}
                </motion.div>
                <div className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center justify-center gap-1.5 mt-2">
                  <Calendar className="w-4 h-4" />
                  Ngày hạnh phúc bên nhau
                </div>
              </div>

              {isOwner && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNudge}
                  disabled={nudging}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary/10 text-primary rounded-full font-bold hover:bg-primary/20 transition-colors disabled:opacity-50 shadow-md shadow-primary/5"
                >
                  <Heart className={`w-5 h-5 ${nudging ? 'animate-ping' : 'fill-primary'}`} />
                  {nudging ? 'Đang gửi yêu thương...' : 'Nhớ bạn'}
                </motion.button>
              )}
            </div>
          )}
        </motion.div>
      </section>

      {/* ===================== DAILY MESSAGE ===================== */}
      <section className="px-4 max-w-5xl mx-auto -mt-6 mb-10 relative z-20">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass p-5 sm:p-8 lg:p-10 rounded-[2rem] sm:rounded-[2.5rem] shadow-xl border-primary/10 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Star className="w-16 h-16 text-primary" />
          </div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-xl">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl font-bold">Thông điệp hôm nay</h2>
            </div>
            {isOwner && (
              <Link 
                to={`/couple/${coupleId}/messages`}
                className="text-sm font-bold text-primary hover:underline flex items-center gap-1"
              >
                Xem lịch sử <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
          <p className="text-xl md:text-2xl italic leading-relaxed text-zinc-700 dark:text-zinc-300 font-medium">
            "{data.todayMessage || 'Hãy luôn yêu thương và trân trọng nhau nhé!'}"
          </p>
        </motion.div>
      </section>

      {/* ===================== MEMORIES SECTION ===================== */}
      <section className="px-4 max-w-5xl mx-auto mb-12">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <ImageIcon className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Kỷ niệm</h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Mode Toggle */}
            <div className="flex items-center bg-secondary dark:bg-zinc-800 rounded-xl p-1 border border-zinc-200 dark:border-zinc-700">
              <button
                onClick={() => setMemoryViewMode('album')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${memoryViewMode === 'album' ? 'bg-primary text-white shadow-md' : 'text-zinc-500 hover:text-foreground'}`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Album
              </button>
              <button
                onClick={() => setMemoryViewMode('timeline')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${memoryViewMode === 'timeline' ? 'bg-primary text-white shadow-md' : 'text-zinc-500 hover:text-foreground'}`}
              >
                <GitBranch className="w-3.5 h-3.5" /> Timeline
              </button>
            </div>
            {isOwner && (
              <button 
                onClick={() => setIsUploadModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
              >
                <Plus className="w-4 h-4" />
                Thêm
              </button>
            )}
          </div>
        </div>

        {/* Access control */}
        {!isOwner && !data.isAlbumPublic ? (
          <div className="glass p-12 rounded-[2.5rem] border border-dashed border-zinc-200 dark:border-zinc-800 text-center flex flex-col items-center justify-center space-y-4 shadow-xl">
            <div className="p-4 bg-zinc-150 dark:bg-zinc-800 text-zinc-400 rounded-full w-16 h-16 flex items-center justify-center shadow-inner">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Album Kỷ Niệm Riêng Tư 🔒</h3>
            <p className="text-sm text-zinc-500 max-w-sm leading-relaxed">
              Chủ sở hữu đã khóa album ảnh & video này. Chỉ có thành viên của không gian mới có quyền xem các khoảnh khắc ngọt ngào bên nhau.
            </p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {memoryViewMode === 'album' ? (
              /* ===== ALBUM MODE ===== */
              <motion.div
                key="album"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                {data.memories.length === 0 && isOwner && (
                  <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
                    <div className="flex items-center gap-2 text-primary font-bold text-center sm:text-left">
                      <Star className="w-4 h-4 text-primary shrink-0" />
                      <span>Chế độ Demo: Hiển thị các câu chuyện mẫu ngọt ngào! Tải lên kỷ niệm thật của hai bạn ngay.</span>
                    </div>
                    <button 
                      onClick={() => setIsUploadModalOpen(true)}
                      className="text-primary font-black hover:underline shrink-0 bg-primary/10 sm:bg-transparent px-4 py-2 sm:p-0 rounded-xl"
                    >
                      Bắt đầu tải lên ✨
                    </button>
                  </div>
                )}
                <div className="columns-1 sm:columns-2 md:columns-3 gap-4 space-y-4">
                  {memoriesToShow.map((memory, idx) => {
                    const isVideo = memory.mimeType?.startsWith('video/');
                    const hasMultiple = (memory.additionalUrls?.length ?? 0) > 0;
                    return (
                      <motion.div 
                        key={memory.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.07 }}
                        className="relative rounded-2xl overflow-hidden group shadow-lg cursor-pointer break-inside-avoid"
                        onClick={() => setSelectedMemory(memory)}
                      >
                        {isVideo ? (
                          <div className="relative w-full h-full overflow-hidden bg-black">
                            <video src={memory.url} className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105" muted loop autoPlay playsInline />
                            <div className="absolute top-3 right-3 p-2 bg-black/55 rounded-full text-white backdrop-blur-md z-10 shadow-lg">
                              <Film className="w-4 h-4" />
                            </div>
                          </div>
                        ) : (
                          <img src={memory.url} alt={memory.caption} className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105" />
                        )}

                        {/* Multi-media badge */}
                        {hasMultiple && (
                          <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-full text-white text-[10px] font-bold z-10">
                            <Images className="w-3 h-3" />
                            {(memory.additionalUrls?.length ?? 0) + 1}
                          </div>
                        )}

                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                          <p className="text-white text-sm font-semibold line-clamp-2">{memory.caption}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/45 text-primary flex items-center justify-center text-[10px] font-black shadow-inner">
                              {memory.uploadedBy ? memory.uploadedBy.substring(0, 2).toUpperCase() : 'TL'}
                            </div>
                            <span className="text-white/80 text-[10px] font-bold">Đăng bởi {memory.uploadedBy || 'Ẩn danh'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-white/50 text-[9px] mt-2">
                            <Clock className="w-3 h-3" />
                            {new Date(memory.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              /* ===== TIMELINE MODE ===== */
              <motion.div
                key="timeline"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="flex gap-0"
              >
                {/* Left column: time milestones (1/4 width) */}
                <div className="w-1/4 relative pr-4">
                  {/* Vertical line */}
                  <div className="absolute right-3 top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary/50 via-primary/20 to-transparent rounded-full" />
                  
                  <div className="space-y-0">
                    {memoriesToShow.map((memory, idx) => {
                      const d = new Date(memory.createdAt);
                      return (
                        <motion.div
                          key={`tl-left-${memory.id}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.08 }}
                          className="relative flex flex-col items-end pr-6 py-4"
                          style={{ minHeight: '120px' }}
                        >
                          {/* Dot on the line */}
                          <div className="absolute right-[7px] top-6 w-3 h-3 rounded-full bg-primary border-2 border-background shadow-md shadow-primary/30" />
                          
                          <div className="text-right space-y-0.5">
                            <p className="text-xs font-black text-primary">
                              {d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-medium">
                              {d.getFullYear()}
                            </p>
                            <p className="text-[9px] text-zinc-400">
                              {d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Right column: overview cards (3/4 width) */}
                <div className="w-3/4 pl-2 space-y-4">
                  {memoriesToShow.map((memory, idx) => {
                    const isVideo = memory.mimeType?.startsWith('video/');
                    const hasMultiple = (memory.additionalUrls?.length ?? 0) > 0;
                    return (
                      <motion.div
                        key={`tl-right-${memory.id}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.08 }}
                        onClick={() => setSelectedMemory(memory)}
                        className="glass rounded-2xl overflow-hidden shadow-md cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 border border-zinc-100/50 dark:border-zinc-800/50 group"
                        style={{ minHeight: '104px' }}
                      >
                        <div className="flex gap-3 p-3">
                          {/* Thumbnail */}
                          <div className="relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-muted">
                            {isVideo ? (
                              <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                                <Film className="w-6 h-6 text-zinc-400" />
                              </div>
                            ) : (
                              <img src={memory.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            )}
                            {hasMultiple && (
                              <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center text-white text-[9px] font-black">
                                +{(memory.additionalUrls?.length ?? 0)}
                              </div>
                            )}
                          </div>
                          
                          {/* Info */}
                          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                            <div>
                              {memory.caption ? (
                                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 line-clamp-2 leading-snug">
                                  {memory.caption}
                                </p>
                              ) : (
                                <p className="text-sm font-semibold text-zinc-400 italic line-clamp-2 leading-snug">
                                  Kỷ niệm #{idx + 1}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[9px] font-black flex items-center justify-center">
                                  {memory.uploadedBy?.substring(0, 1).toUpperCase() || 'T'}
                                </div>
                                <span className="text-[10px] text-zinc-400 truncate max-w-[80px]">{memory.uploadedBy || 'Ẩn danh'}</span>
                              </div>
                              <span className="text-[10px] text-primary font-bold">Xem chi tiết →</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </section>

      {/* ===================== PRIVACY MODAL ===================== */}
      <AnimatePresence>
        {isPrivacyModalOpen && isOwner && (
          <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl max-w-md w-full space-y-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 text-primary rounded-full">
                  <Settings className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Cài đặt Riêng tư Không gian</h3>
                  <p className="text-xs text-zinc-500">Thiết lập quyền truy cập cho không gian tình yêu</p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { label: 'Không gian Công khai', desc: 'Cho phép khách vãng lai và mọi người vào xem không gian của hai bạn.', val: isPublic, set: setIsPublic },
                  { label: 'Công khai Album kỷ niệm', desc: 'Cho phép người ngoài xem lưới ảnh và video kỷ niệm.', val: isAlbumPublic, set: setIsAlbumPublic },
                  { label: 'Công khai Ngày kỷ niệm', desc: 'Mọi người có thể thấy các ngày kỷ niệm lớn sắp tới.', val: isAnniversariesPublic, set: setIsAnniversariesPublic },
                ].map(({ label, desc, val, set }) => (
                  <div key={label} className="flex items-center justify-between p-3 bg-secondary dark:bg-zinc-800/40 rounded-2xl border border-zinc-105 dark:border-zinc-800">
                    <div className="space-y-0.5 max-w-[70%] text-left">
                      <h4 className="font-bold text-xs">{label}</h4>
                      <p className="text-zinc-500 text-[10px] leading-relaxed">{desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                      <input type="checkbox" checked={val} onChange={(e) => set(e.target.checked)} className="sr-only peer" />
                      <div className="w-11 h-6 bg-zinc-200 dark:bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                    </label>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPrivacyModalOpen(false)}
                  className="flex-1 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-bold py-3 rounded-xl transition-all text-xs text-center"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={isUpdatingPrivacy}
                  onClick={async () => {
                    setIsUpdatingPrivacy(true);
                    try {
                      const res = await axios.post(`/couples/${data.id}/privacy-settings`, {
                        isPublic,
                        isAlbumPublic,
                        isAnniversariesPublic,
                        isAchievementsPublic
                      });
                      if (res.data.success) {
                        toast.success('Cập nhật cài đặt riêng tư thành công!');
                        setIsPrivacyModalOpen(false);
                        fetchCoupleData();
                      } else {
                        toast.error(res.data.message || 'Cập nhật thất bại.');
                      }
                    } catch (err: any) {
                      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật.');
                    } finally {
                      setIsUpdatingPrivacy(false);
                    }
                  }}
                  className="flex-1 bg-primary text-white font-bold py-3 rounded-xl shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-xs text-center disabled:opacity-50"
                >
                  {isUpdatingPrivacy ? 'Đang lưu...' : 'Lưu cài đặt'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Upload Modal */}
      <PhotoUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        coupleId={data.id}
        onSuccess={handleUploadSuccess}
      />

      {/* Memory Carousel Modal */}
      <MemoryCarouselModal
        memory={selectedMemory}
        onClose={() => setSelectedMemory(null)}
      />
    </div>
  );
};

class PageErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 text-red-400 p-8 font-mono space-y-4 flex flex-col items-center justify-center text-center max-w-xl mx-auto z-[200]">
          <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white">Lỗi Giao Diện (Runtime Crash)</h1>
          <p className="text-zinc-400 text-sm max-w-md">
            Đã xảy ra lỗi không mong đợi khi vẽ giao diện cặp đôi. Chi tiết lỗi kỹ thuật:
          </p>
          <pre className="bg-zinc-900 border border-red-500/20 p-4 rounded-xl overflow-auto text-xs text-red-300 max-w-full text-left w-full leading-relaxed max-h-[300px]">
            {this.state.error?.toString()}
            {"\n\nStack Trace:\n"}
            {this.state.error?.stack}
          </pre>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-all"
          >
            Tải lại trang
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const CouplePageWithErrorBoundary = () => (
  <PageErrorBoundary>
    <CouplePage />
  </PageErrorBoundary>
);

export default CouplePageWithErrorBoundary;
