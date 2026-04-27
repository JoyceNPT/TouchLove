import { useEffect, useState } from 'react';
import { 
  Users, 
  Search, 
  ShieldAlert, 
  ShieldCheck,
  Mail,
  Calendar,
  MoreVertical,
  RefreshCw
} from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';

interface User {
  id: string;
  displayName: string;
  email: string;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get('/admin/users');
      if (res.data.success) setUsers(res.data.data.items);
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleUserStatus = async (user: User) => {
    const action = user.isActive ? 'block' : 'unblock';
    if (!confirm(`Bạn có chắc muốn ${action === 'block' ? 'khóa' : 'mở khóa'} người dùng này?`)) return;

    try {
      const res = await axiosInstance.post(`/admin/users/${user.id}/${action}`);
      if (res.data.success) {
        setUsers(prev => prev.map(u => 
          u.id === user.id ? { ...u, isActive: !u.isActive } : u
        ));
      }
    } catch (err) {
      alert('Lỗi khi cập nhật trạng thái người dùng.');
    }
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
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4">Ngày tham gia</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-4 h-16 bg-zinc-50/50 dark:bg-zinc-800/20" />
                  </tr>
                ))
              ) : filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{u.displayName}</p>
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
                      u.isActive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {u.isActive ? 'Hoạt động' : 'Đã khóa'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {new Date(u.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => toggleUserStatus(u)}
                        className={`p-2 rounded-lg transition-all ${
                          u.isActive ? 'text-red-500 hover:bg-red-500/10' : 'text-green-500 hover:bg-green-500/10'
                        }`}
                        title={u.isActive ? 'Khóa người dùng' : 'Mở khóa người dùng'}
                      >
                        {u.isActive ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                      </button>
                      <button className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-zinc-600 dark:text-zinc-400">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
