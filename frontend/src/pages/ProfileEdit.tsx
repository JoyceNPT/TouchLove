import React, { useState } from 'react';
import { User, Save, Upload, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { toast } from '../store/useToastStore';

const ProfileEdit = () => {
  const { user, setAuth } = useAuthStore();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    gender: user?.gender || '',
    dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
    bio: user?.bio || '',
    avatarUrl: user?.avatarUrl || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await axiosInstance.put('/users/me', formData);
      if (res.data.success) {
        toast.success('Cập nhật hồ sơ thành công!');
        setAuth(res.data.data, localStorage.getItem('accessToken') || '');
        navigate('/profile');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi cập nhật hồ sơ.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Link to="/profile" className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-primary mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Quay lại hồ sơ
      </Link>
      
      <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm">
        <h1 className="text-2xl font-black mb-6">Chỉnh sửa hồ sơ</h1>
        
        <form onSubmit={handleSave} className="space-y-6">
          {/* Avatar Upload (Mock for now) */}
          <div className="flex items-center gap-6 pb-6 border-b border-zinc-100 dark:border-zinc-800">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center p-1 border-2 border-primary/20 shrink-0">
              {formData.avatarUrl ? (
                <img src={formData.avatarUrl} alt={formData.displayName} className="w-full h-full rounded-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-primary" />
              )}
            </div>
            <div>
              <p className="text-sm font-bold mb-2">Ảnh đại diện</p>
              <div className="flex items-center gap-2">
                <button type="button" className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs font-bold hover:bg-zinc-200 transition-colors flex items-center gap-2">
                  <Upload className="w-3 h-3" /> Tải ảnh lên
                </button>
                <input 
                  type="text" 
                  name="avatarUrl" 
                  placeholder="Hoặc nhập URL ảnh..." 
                  value={formData.avatarUrl}
                  onChange={handleChange}
                  className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg text-xs border border-zinc-200 dark:border-zinc-700 outline-none" 
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 block">Họ và tên</label>
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-primary font-medium"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 block">Ngày sinh</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-primary font-medium"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 block">Giới tính</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-primary font-medium"
            >
              <option value="">Chưa thiết lập</option>
              <option value="Male">Nam</option>
              <option value="Female">Nữ</option>
              <option value="Other">Khác</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 block">Tiểu sử (Bio)</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={3}
              placeholder="Vài dòng giới thiệu về bạn..."
              className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-2 focus:ring-primary font-medium resize-none"
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
            >
              {isSaving ? 'Đang lưu...' : <><Save className="w-5 h-5" /> Lưu thay đổi</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileEdit;
