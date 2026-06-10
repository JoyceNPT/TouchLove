import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Search, 
  ShieldAlert, 
  ShieldCheck,
  Mail,
  Calendar,
  MoreVertical,
  RefreshCw,
  User as UserIcon
} from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import { toast } from '../../store/useToastStore';
import ConfirmModal from '../../components/shared/ConfirmModal';

interface User {
  id: string;
  displayName: string;
  email: string;
  isSalesActive: boolean;
  isNfcActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  gender?: string;
  dateOfBirth?: string;
  bio?: string;
  userType: string;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState<string>(''); // '' means all
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning' as 'danger' | 'warning' | 'info',
    onConfirm: () => {}
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get(`/admin/users?userType=${userTypeFilter}`);
      if (res.data.success) setUsers(res.data.data.items);
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [userTypeFilter]);

  const toggleSalesStatus = async (user: User) => {
    const action = user.isSalesActive ? 'Khóa mua hàng' : 'Mở khóa mua hàng';
    setConfirmConfig({
      isOpen: true,
      title: action,
      message: `Bạn có chắc muốn ${action.toLowerCase()} người dùng này?`,
      type: user.isSalesActive ? 'danger' : 'info',
      onConfirm: async () => {
        try {
          const res = await axiosInstance.post(`/admin/users/${user.id}/toggle-sales`);
          if (res.data.success) {
            setUsers(prev => prev.map(u => 
              u.id === user.id ? { ...u, isSalesActive: !u.isSalesActive } : u
            ));
            toast.success(`${action} thành công!`);
          }
        } catch (err) {
          toast.error('Lỗi khi cập nhật trạng thái mua hàng.');
        }
      }
    });
  };

  const toggleNfcStatus = async (user: User) => {
    const action = user.isNfcActive ? 'Khóa NFC' : 'Mở khóa NFC';
    setConfirmConfig({
      isOpen: true,
      title: action,
      message: `Bạn có chắc muốn ${action.toLowerCase()} không gian NFC của người dùng này?`,
      type: user.isNfcActive ? 'danger' : 'info',
      onConfirm: async () => {
        try {
          const res = await axiosInstance.post(`/admin/users/${user.id}/toggle-nfc`);
          if (res.data.success) {
            setUsers(prev => prev.map(u => 
              u.id === user.id ? { ...u, isNfcActive: !u.isNfcActive } : u
            ));
            toast.success(`${action} thành công!`);
          }
        } catch (err) {
          toast.error('Lỗi khi cập nhật trạng thái NFC.');
        }
      }
    });
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">Quản lý Người dùng</h1>
        <p className="text-zinc-500 text-sm">Xem danh sách và quản lý trạng thái hoạt động của thành viên.</p>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Tìm theo tên hoặc email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-0 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>
          <select
            value={userTypeFilter}
            onChange={(e) => setUserTypeFilter(e.target.value)}
            className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-0 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all text-sm font-bold"
          >
            <option value="">Tất cả tài khoản</option>
            <option value="Sales">Tài khoản Mua hàng</option>
            <option value="NFC">Tài khoản NFC</option>
          </select>
          <button onClick={fetchUsers} className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-800/30 text-xs font-bold text-zinc-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Người dùng</th>
                <th className="px-6 py-4">Xác minh</th>
                <th className="px-6 py-4">Trạng thái Mua hàng</th>
                <th className="px-6 py-4">Trạng thái NFC</th>
                <th className="px-6 py-4">Ngày tham gia</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-4 h-16 bg-zinc-50/50 dark:bg-zinc-800/20" />
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-zinc-500 font-bold">Không tìm thấy người dùng nào.</td>
                </tr>
              ) : filteredUsers.map((u) => (
                <React.Fragment key={u.id}>
                  <tr 
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group cursor-pointer"
                    onClick={() => setExpandedUserId(expandedUserId === u.id ? null : u.id)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">
                            {u.displayName}
                            <span className="ml-2 text-[10px] uppercase bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-300">
                              {u.userType}
                            </span>
                          </p>
                          <p className="text-xs text-zinc-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {u.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {u.isEmailVerified ? (
                        <span className="text-green-500 text-xs font-bold">Đã xác minh</span>
                      ) : (
                        <span className="text-zinc-400 text-xs font-bold">Chưa xác minh</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                        u.isSalesActive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {u.isSalesActive ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                        u.isNfcActive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {u.isNfcActive ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {new Date(u.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => toggleSalesStatus(u)}
                          className={`p-2 rounded-lg transition-all ${
                            u.isSalesActive ? 'text-red-500 hover:bg-red-500/10' : 'text-green-500 hover:bg-green-500/10'
                          }`}
                          title={u.isSalesActive ? 'Khóa mua hàng' : 'Mở khóa mua hàng'}
                        >
                          {u.isSalesActive ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                          <span className="sr-only">Sale</span>
                        </button>
                        <button 
                          onClick={() => toggleNfcStatus(u)}
                          className={`p-2 rounded-lg transition-all ${
                            u.isNfcActive ? 'text-red-500 hover:bg-red-500/10' : 'text-green-500 hover:bg-green-500/10'
                          }`}
                          title={u.isNfcActive ? 'Khóa NFC' : 'Mở khóa NFC'}
                        >
                          {u.isNfcActive ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                          <span className="sr-only">NFC</span>
                        </button>
                        <button 
                          onClick={() => setExpandedUserId(expandedUserId === u.id ? null : u.id)}
                          className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-zinc-600 dark:text-zinc-400"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedUserId === u.id && (
                    <tr className="bg-zinc-50/50 dark:bg-zinc-800/10">
                      <td colSpan={6} className="px-8 py-6 border-t border-b border-zinc-150 dark:border-zinc-800">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                          <div className="space-y-1 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-800/50">
                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-1">Giới tính</span>
                            <span className="font-bold text-zinc-800 dark:text-zinc-200">{u.gender || 'Chưa thiết lập'}</span>
                          </div>
                          <div className="space-y-1 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-800/50">
                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-1">Ngày sinh</span>
                            <span className="font-bold text-zinc-800 dark:text-zinc-200">
                              {u.dateOfBirth ? new Date(u.dateOfBirth).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Chưa thiết lập'}
                            </span>
                          </div>
                          <div className="space-y-1 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-800/50 md:col-span-3">
                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-1">Tiểu sử (Bio)</span>
                            <p className="italic text-zinc-600 dark:text-zinc-300 font-medium">
                              "{u.bio || 'Chưa thiết lập tiểu sử cá nhân.'}"
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default AdminUsers;
