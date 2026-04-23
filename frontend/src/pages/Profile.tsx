import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Settings, Shield, Smartphone, Heart, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import axiosInstance from '../api/axiosInstance';
import { Link } from 'react-router-dom';

const Profile = () => {
  const { user } = useAuthStore();
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real app, fetch user profile and their keychain/couple status
    const fetchProfile = async () => {
      try {
        // const res = await axiosInstance.get('/users/me');
        // setProfileData(res.data.data);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="flex items-center gap-6 mb-12">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center p-1 border-2 border-primary/20">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full rounded-full object-cover" />
          ) : (
            <User className="w-10 h-10 text-primary" />
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold">{user?.displayName}</h1>
          <p className="text-muted-foreground">{user?.email}</p>
          <div className="inline-block mt-2 px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wider">
            {user?.role === 'Admin' ? 'Quản trị viên' : 'Thành viên'}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold mb-4">Quản lý</h2>
        
        <ProfileItem 
          icon={<Heart className="w-5 h-5 text-pink-500" />} 
          title="Trang cặp đôi" 
          description="Xem và chỉnh sửa trang chung của hai bạn"
          link="/c/demo" // Should be dynamic
        />
        
        <ProfileItem 
          icon={<Smartphone className="w-5 h-5 text-blue-500" />} 
          title="Keychain của tôi" 
          description="Quản lý móc khóa NFC đã kích hoạt"
        />

        <ProfileItem 
          icon={<Shield className="w-5 h-5 text-green-500" />} 
          title="Bảo mật" 
          description="Đổi mật khẩu và quản lý phiên đăng nhập"
        />

        <ProfileItem 
          icon={<Settings className="w-5 h-5 text-muted-foreground" />} 
          title="Cài đặt" 
          description="Thông báo và giao diện"
        />
      </div>

      {user?.role === 'Admin' && (
        <div className="mt-12">
           <Link to="/admin" className="w-full flex items-center justify-center gap-2 p-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-black transition-all">
             <Shield className="w-5 h-5" /> Truy cập Admin Panel
           </Link>
        </div>
      )}
    </div>
  );
};

const ProfileItem = ({ icon, title, description, link }: any) => {
  const content = (
    <div className="flex items-center justify-between p-4 glass rounded-2xl hover:bg-secondary/50 transition-all group">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-background rounded-xl shadow-sm">{icon}</div>
        <div>
          <h3 className="font-bold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
    </div>
  );

  return link ? <Link to={link}>{content}</Link> : <div className="cursor-pointer">{content}</div>;
};

export default Profile;
