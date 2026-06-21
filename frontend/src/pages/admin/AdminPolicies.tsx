import React, { useState, useEffect } from 'react';
import { FileText, Save, Globe } from 'lucide-react';
import { toast } from '../../store/useToastStore';
import { axiosInstance } from '../../api/axiosInstance';
import JoditEditor from 'jodit-react';

const AdminPolicies = () => {
  const [activeLang, setActiveLang] = useState<'vi' | 'en'>('vi');
  const [isLoading, setIsLoading] = useState(true);
  
  const [policies, setPolicies] = useState({
    vi: { terms: '', privacy: '', nfcGuide: '' },
    en: { terms: '', privacy: '', nfcGuide: '' }
  });

  const config = {
    readonly: false,
    height: 500,
    enableDragAndDropFileToEditor: true,
    uploader: {
      insertImageAsBase64URI: true
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      const [resTermsVi, resPrivacyVi, resNfcVi, resTermsEn, resPrivacyEn, resNfcEn] = await Promise.all([
        axiosInstance.get('/policies/TERMS/vi'),
        axiosInstance.get('/policies/PRIVACY/vi'),
        axiosInstance.get('/policies/NFC_GUIDE/vi'),
        axiosInstance.get('/policies/TERMS/en'),
        axiosInstance.get('/policies/PRIVACY/en'),
        axiosInstance.get('/policies/NFC_GUIDE/en')
      ]);

      setPolicies({
        vi: {
          terms: resTermsVi.data?.data?.content || '',
          privacy: resPrivacyVi.data?.data?.content || '',
          nfcGuide: resNfcVi.data?.data?.content || ''
        },
        en: {
          terms: resTermsEn.data?.data?.content || '',
          privacy: resPrivacyEn.data?.data?.content || '',
          nfcGuide: resNfcEn.data?.data?.content || ''
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
        axiosInstance.put('/admin/policies/NFC_GUIDE/vi', { content: policies.vi.nfcGuide }),
        axiosInstance.put('/admin/policies/TERMS/en', { content: policies.en.terms }),
        axiosInstance.put('/admin/policies/PRIVACY/en', { content: policies.en.privacy }),
        axiosInstance.put('/admin/policies/NFC_GUIDE/en', { content: policies.en.nfcGuide })
      ]);
      toast.success('Lưu chính sách thành công!');
    } catch (error) {
      toast.error('Lỗi khi lưu chính sách');
    }
  };

  const handleChange = (field: 'terms' | 'privacy' | 'nfcGuide', value: string) => {
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
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-sm border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-bold mb-4">Điều khoản sử dụng</h2>
            <JoditEditor
              value={policies[activeLang].terms} 
              config={config}
              onChange={(val) => handleChange('terms', val)} 
            />
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-sm border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-bold mb-4">Chính sách bảo mật</h2>
            <JoditEditor
              value={policies[activeLang].privacy} 
              config={config}
              onChange={(val) => handleChange('privacy', val)} 
            />
          </div>
          
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-sm border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-bold mb-4">Hướng dẫn sử dụng NFC</h2>
            <JoditEditor
              value={policies[activeLang].nfcGuide} 
              config={config}
              onChange={(val) => handleChange('nfcGuide', val)} 
            />
          </div>
      </div>
    </div>
  );
};

export default AdminPolicies;
