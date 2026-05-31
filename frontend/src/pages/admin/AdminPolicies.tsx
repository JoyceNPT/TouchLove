import React, { useState, useEffect } from 'react';
import { FileText, Save, Globe } from 'lucide-react';
import { toast } from '../../store/useToastStore';
import { axiosInstance } from '../../api/axiosInstance';

const AdminPolicies = () => {
  const [activeLang, setActiveLang] = useState<'vi' | 'en'>('vi');
  const [isLoading, setIsLoading] = useState(true);
  
  const [policies, setPolicies] = useState({
    vi: { terms: '', privacy: '' },
    en: { terms: '', privacy: '' }
  });

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      const [resTermsVi, resPrivacyVi, resTermsEn, resPrivacyEn] = await Promise.all([
        axiosInstance.get('/policies/TERMS/vi'),
        axiosInstance.get('/policies/PRIVACY/vi'),
        axiosInstance.get('/policies/TERMS/en'),
        axiosInstance.get('/policies/PRIVACY/en')
      ]);

      setPolicies({
        vi: {
          terms: resTermsVi.data.data.content || '',
          privacy: resPrivacyVi.data.data.content || ''
        },
        en: {
          terms: resTermsEn.data.data.content || '',
          privacy: resPrivacyEn.data.data.content || ''
        }
      });
    } catch (error) {
      toast.error('Lỗi khi tải chính sách');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await Promise.all([
        axiosInstance.put('/admin/policies/TERMS/vi', { content: policies.vi.terms }),
        axiosInstance.put('/admin/policies/PRIVACY/vi', { content: policies.vi.privacy }),
        axiosInstance.put('/admin/policies/TERMS/en', { content: policies.en.terms }),
        axiosInstance.put('/admin/policies/PRIVACY/en', { content: policies.en.privacy })
      ]);
      toast.success('Lưu chính sách thành công!');
    } catch (error) {
      toast.error('Lỗi khi lưu chính sách');
    }
  };

  const handleChange = (field: 'terms' | 'privacy', value: string) => {
    setPolicies(prev => ({
      ...prev,
      [activeLang]: {
        ...prev[activeLang],
        [field]: value
      }
    }));
  };

  if (isLoading) return <div className="animate-pulse h-[600px] bg-white dark:bg-zinc-900 rounded-3xl" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Chính sách & Điều khoản
          </h1>
          <p className="text-zinc-500 text-sm">Quản lý nội dung chính sách (hỗ trợ đa ngôn ngữ).</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
            <button 
              onClick={() => setActiveLang('vi')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                activeLang === 'vi' ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'text-zinc-500'
              }`}
            >
              🇻🇳 Tiếng Việt
            </button>
            <button 
              onClick={() => setActiveLang('en')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                activeLang === 'en' ? 'bg-white dark:bg-zinc-700 shadow-sm' : 'text-zinc-500'
              }`}
            >
              🇬🇧 English
            </button>
          </div>
          <button 
            onClick={handleSave}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-all"
          >
            <Save className="w-4 h-4" />
            Lưu thay đổi
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Terms */}
        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm flex flex-col h-[600px]">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-500" />
            Điều khoản Dịch vụ (Terms of Service)
          </h3>
          <textarea
            value={policies[activeLang].terms}
            onChange={(e) => handleChange('terms', e.target.value)}
            className="w-full flex-1 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 resize-none outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
          />
        </div>

        {/* Privacy */}
        <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm flex flex-col h-[600px]">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-green-500" />
            Chính sách Bảo mật (Privacy Policy)
          </h3>
          <textarea
            value={policies[activeLang].privacy}
            onChange={(e) => handleChange('privacy', e.target.value)}
            className="w-full flex-1 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 resize-none outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
          />
        </div>
      </div>
    </div>
  );
};

export default AdminPolicies;
