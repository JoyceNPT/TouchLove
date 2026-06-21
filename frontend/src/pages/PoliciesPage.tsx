import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, ShieldCheck, RefreshCw, SmartphoneNfc } from 'lucide-react';
import { axiosInstance } from '../api/axiosInstance';
import { useTranslation } from 'react-i18next';

const PoliciesPage = () => {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy' | 'nfcGuide'>('terms');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { i18n } = useTranslation();

  useEffect(() => {
    const langCode = i18n.language?.startsWith('en') ? 'en' : 'vi';
    fetchPolicy(activeTab, langCode);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab, i18n.language]);

  const fetchPolicy = async (tab: 'terms' | 'privacy' | 'nfcGuide', lang: string) => {
    setIsLoading(true);
    try {
      let code = 'TERMS';
      if (tab === 'privacy') code = 'PRIVACY';
      if (tab === 'nfcGuide') code = 'NFC_GUIDE';
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
        <h1 className="text-4xl font-black mb-4">Hướng dẫn & Chính sách</h1>
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
        <button
          onClick={() => setActiveTab('nfcGuide')}
          className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${
            activeTab === 'nfcGuide'
              ? 'bg-primary text-primary-foreground shadow-lg'
              : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
          }`}
        >
          <SmartphoneNfc className="w-5 h-5" /> Hướng dẫn NFC
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
          <div 
            className="prose prose-zinc dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-primary hover:prose-a:text-primary/80 prose-img:rounded-2xl"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        )}
      </motion.div>
    </div>
  );
};

export default PoliciesPage;
