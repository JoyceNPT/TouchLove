import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Heart, 
  Search, 
  Compass, 
  ExternalLink, 
  UserCheck, 
  Calendar,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import { toast } from '../store/useToastStore';

interface PublicNfcProfile {
  displayName: string;
  gender?: string;
  age?: number;
  bio?: string;
  keyId: string;
  isPaired: boolean;
  inviteCode?: string;
}

interface PublicCouple {
  id: string;
  coupleName: string;
  coupleSlug: string;
  startDate: string;
  loveDays: number;
}

const Explore = () => {
  const navigate = useNavigate();
  const [unpaired, setUnpaired] = useState<PublicNfcProfile[]>([]);
  const [couples, setCouples] = useState<PublicCouple[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'singles' | 'couples'>('singles');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchExploreData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get('/nfc/explore');
      if (res.data.success && res.data.data) {
        setUnpaired(res.data.data.unpairedProfiles || []);
        setCouples(res.data.data.couples || []);
      } else {
        setError(res.data.message || 'Không thể tải danh sách khám phá.');
      }
    } catch (err) {
      console.error(err);
      setError('Lỗi kết nối máy chủ.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExploreData();
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredSingles = unpaired.filter(s => 
    s.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.bio && s.bio.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredCouples = couples.filter(c => 
    c.coupleName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl space-y-12">
      {/* Radial glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[40%] bg-primary/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[40%] bg-pink-500/10 rounded-full blur-[120px] -z-10" />

      {/* Explore Hero Banner */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-gradient-to-tr from-primary to-pink-500 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-primary/25">
          <Compass className="w-8 h-8 text-white animate-spin-slow" />
        </div>
        <h1 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent leading-tight">
          Khám Phá Kết Nối 💕
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto text-base">
          Ghé thăm không gian lãng mạn của các cặp đôi công khai hoặc tìm kiếm một nửa của mình thông qua hồ sơ móc khóa NFC.
        </p>
      </div>

      {/* Search & Tabs control bar */}
      <div className="glass p-4 rounded-[2rem] border border-white/20 dark:border-zinc-800/40 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xl backdrop-blur-md">
        {/* Tabs switcher */}
        <div className="flex bg-secondary dark:bg-zinc-800/60 p-1.5 rounded-2xl w-full md:w-auto">
          <button
            onClick={() => { setActiveTab('singles'); setSearchTerm(''); }}
            className={`flex-1 md:flex-initial px-6 py-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === 'singles' 
                ? 'bg-white dark:bg-zinc-700 text-primary shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="w-4 h-4" /> Cá Nhân Tìm Kiếm
          </button>
          <button
            onClick={() => { setActiveTab('couples'); setSearchTerm(''); }}
            className={`flex-1 md:flex-initial px-6 py-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === 'couples' 
                ? 'bg-white dark:bg-zinc-700 text-primary shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Heart className="w-4 h-4" /> Cặp Đôi Công Khai
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder={activeTab === 'singles' ? 'Tìm theo tên, bio...' : 'Tìm cặp đôi...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-secondary dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary text-sm transition-all"
          />
        </div>
      </div>

      {error && (
        <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold rounded-[2rem] flex items-center gap-3">
          <AlertCircle className="w-6 h-6 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Main Content Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-32">
          <RefreshCw className="w-12 h-12 text-primary animate-spin" />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {activeTab === 'singles' ? (
            <motion.div
              key="singles"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {filteredSingles.length === 0 ? (
                <div className="col-span-full text-center py-20 text-zinc-500 font-bold">
                  Không tìm thấy hồ sơ cá nhân công khai nào.
                </div>
              ) : (
                filteredSingles.map((single, index) => (
                  <motion.div
                    key={single.keyId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass p-6 rounded-[2.5rem] border border-white/20 dark:border-zinc-800/40 hover:shadow-2xl hover:-translate-y-1.5 transition-all shadow-lg flex flex-col justify-between space-y-6"
                  >
                    <div className="space-y-4">
                      {/* Avatar and Gender Badge */}
                      <div className="flex items-start justify-between">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary/10 to-pink-500/10 border border-primary/20 flex items-center justify-center font-black text-2xl text-primary">
                          {single.displayName.charAt(0)}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-black ${
                          single.gender === 'Nam' 
                            ? 'bg-blue-500/10 text-blue-500' 
                            : single.gender === 'Nữ' 
                              ? 'bg-pink-500/10 text-pink-500' 
                              : 'bg-purple-500/10 text-purple-500'
                        }`}>
                          {single.gender || 'Bí mật'} {single.age ? `• ${single.age} tuổi` : ''}
                        </span>
                      </div>

                      {/* Info */}
                      <div>
                        <h3 className="text-xl font-bold mb-1.5">{single.displayName}</h3>
                        <p className="text-zinc-500 text-sm leading-relaxed line-clamp-3 min-h-[60px]">
                          {single.bio || 'Chưa thiết lập lời tự sự cá nhân.'}
                        </p>
                      </div>
                    </div>

                    {/* Invite Code Action */}
                    {single.inviteCode ? (
                      <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
                        <div className="flex items-center justify-between px-3 py-2 bg-secondary dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-800 font-mono text-sm font-bold tracking-widest text-primary">
                          <span>MÃ: {single.inviteCode}</span>
                          <button
                            onClick={() => handleCopyCode(single.inviteCode!)}
                            className="p-1.5 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded-lg transition-all"
                          >
                            {copiedCode === single.inviteCode ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        <button
                          onClick={() => {
                            // Copy code and navigate to own single profile to paste it
                            handleCopyCode(single.inviteCode!);
                            toast.success('Đã sao chép mã kết đôi! Hệ thống sẽ đưa bạn đến trang cá nhân của bạn để ghép đôi.');
                            navigate('/nfc-profile');
                          }}
                          className="w-full py-3 bg-gradient-to-r from-primary to-pink-500 text-white rounded-xl font-bold text-xs shadow-md shadow-primary/10 flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-95 transition-all"
                        >
                          <UserCheck className="w-4 h-4" /> Ghép Đôi Với Tôi ✨
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 bg-zinc-500/10 text-zinc-400 text-xs font-bold rounded-xl text-center">
                        Không có mã kết đôi nào đang bật.
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </motion.div>
          ) : (
            <motion.div
              key="couples"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {filteredCouples.length === 0 ? (
                <div className="col-span-full text-center py-20 text-zinc-500 font-bold">
                  Không tìm thấy cặp đôi công khai nào.
                </div>
              ) : (
                filteredCouples.map((couple, index) => (
                  <motion.div
                    key={couple.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass p-6 rounded-[2.5rem] border border-white/20 dark:border-zinc-800/40 hover:shadow-2xl hover:-translate-y-1.5 transition-all shadow-lg flex flex-col justify-between space-y-6"
                  >
                    <div className="space-y-4">
                      {/* Avatar and scanned count */}
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-pink-500/10 text-pink-500 rounded-full flex items-center justify-center font-bold">
                          <Heart className="w-6 h-6 fill-pink-500/20 text-pink-500" />
                        </div>
                        <div>
                          <h3 className="font-bold text-base line-clamp-1">{couple.coupleName}</h3>
                          <span className="text-zinc-500 text-xs flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Yêu từ {new Date(couple.startDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Love day statistics */}
                      <div className="p-4 bg-gradient-to-br from-primary/5 to-pink-500/5 rounded-2xl border border-primary/10 text-center">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Thời gian yêu thương</p>
                        <p className="text-3xl font-black bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent mt-1">
                          {couple.loveDays} ngày
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(`/couple/${couple.id}`)}
                      className="w-full py-3 bg-secondary hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      Ghé Thăm Không Gian <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

export default Explore;
