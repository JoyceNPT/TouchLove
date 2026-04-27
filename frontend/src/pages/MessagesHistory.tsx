import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Sparkles, 
  Calendar, 
  Bookmark, 
  BookmarkCheck,
  Search,
  MessageSquare
} from 'lucide-react';
import axiosInstance from '../api/axiosInstance';

interface DailyMessage {
  id: string;
  content: string;
  sentAt: string;
  isBookmarked: boolean;
}

const MessagesHistory = () => {
  const { slug } = useParams<{ slug: string }>();
  const [messages, setMessages] = useState<DailyMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        // First get couple info to get ID
        const coupleRes = await axiosInstance.get(`/couples/${slug}`);
        if (coupleRes.data.success) {
          const coupleId = coupleRes.data.data.id;
          const res = await axiosInstance.get(`/couples/${coupleId}/messages?days=90`);
          if (res.data.success) setMessages(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch messages history', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [slug]);

  const toggleBookmark = async (msgId: string) => {
    try {
      await axiosInstance.post(`/messages/${msgId}/bookmark`);
      setMessages(prev => prev.map(m => 
        m.id === msgId ? { ...m, isBookmarked: !m.isBookmarked } : m
      ));
    } catch (err) {
      console.error('Failed to toggle bookmark', err);
    }
  };

  const filteredMessages = messages.filter(m => 
    m.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-30">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <Link to={`/c/${slug}`} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-bold">Lịch sử thông điệp</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Tìm kiếm nội dung tin nhắn..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] outline-none shadow-sm focus:ring-2 focus:ring-primary transition-all"
          />
        </div>

        {/* Message List */}
        <div className="space-y-6">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 bg-white dark:bg-zinc-900 animate-pulse rounded-[2rem]" />
            ))
          ) : filteredMessages.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-[2.5rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800">
              <MessageSquare className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
              <p className="text-zinc-500">Chưa tìm thấy thông điệp nào.</p>
            </div>
          ) : filteredMessages.map((msg, idx) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-sm border border-zinc-200 dark:border-zinc-800 relative group overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 opacity-5">
                <Sparkles className="w-12 h-12 text-primary" />
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-zinc-500 text-sm font-bold">
                  <Calendar className="w-4 h-4" />
                  {new Date(msg.sentAt).toLocaleDateString('vi-VN', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </div>
                <button 
                  onClick={() => toggleBookmark(msg.id)}
                  className={`p-2 rounded-xl transition-all ${
                    msg.isBookmarked 
                      ? 'bg-primary/10 text-primary' 
                      : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {msg.isBookmarked ? <BookmarkCheck className="w-5 h-5 fill-current" /> : <Bookmark className="w-5 h-5" />}
                </button>
              </div>

              <p className="text-lg italic leading-relaxed text-zinc-800 dark:text-zinc-200">
                "{msg.content}"
              </p>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default MessagesHistory;
