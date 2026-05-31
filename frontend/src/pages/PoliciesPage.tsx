import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, ShieldCheck, RefreshCw } from 'lucide-react';
import { axiosInstance } from '../api/axiosInstance';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { useTranslation } from 'react-i18next';

const PoliciesPage = () => {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { i18n } = useTranslation();

  useEffect(() => {
    fetchPolicy(activeTab, i18n.language || 'vi');
  }, [activeTab, i18n.language]);

  const fetchPolicy = async (tab: 'terms' | 'privacy', lang: string) => {
    setIsLoading(true);
    try {
      const code = tab === 'terms' ? 'TERMS' : 'PRIVACY';
      const res = await axiosInstance.get(`/policies/${code}/${lang}`);
      setContent(res.data.data.content || 'Nội dung đang được cập nhật...');
    } catch (err) {
      setContent('Không thể tải nội dung chính sách. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-black mb-4">Chính sách & Điều khoản</h1>
        <p className="text-muted-foreground">TouchLove cam kết bảo vệ quyền lợi và dữ liệu của bạn.</p>
      </motion.div>

      <div className="flex justify-center gap-4 mb-8">
        <button
          onClick={() => setActiveTab('terms')}
          className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${
            activeTab === 'terms'
              ? 'bg-primary text-primary-foreground shadow-lg'
              : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
          }`}
        >
          <FileText className="w-5 h-5" /> Điều khoản sử dụng
        </button>
        <button
          onClick={() => setActiveTab('privacy')}
          className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${
            activeTab === 'privacy'
              ? 'bg-primary text-primary-foreground shadow-lg'
              : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
          }`}
        >
          <ShieldCheck className="w-5 h-5" /> Chính sách bảo mật
        </button>
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="glass p-8 md:p-12 rounded-[2.5rem] min-h-[500px] relative"
      >
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="prose prose-zinc dark:prose-invert max-w-none prose-headings:font-black prose-a:text-primary">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
              {content}
            </ReactMarkdown>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default PoliciesPage;
