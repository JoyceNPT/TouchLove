import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Key, 
  Search, 
  MoreVertical, 
  RefreshCw,
  Ban,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Trash2,
  Unlink
} from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import { toast } from '../../store/useToastStore';
import ConfirmModal from '../../components/shared/ConfirmModal';

interface Keychain {
  id: string;
  keyId: string;
  status: string;
  createdAt: string;
  activatedAt?: string;
  coupleId?: string;
  coupleName?: string;
  coupleSlug?: string;
  userId?: string;
  userDisplayName?: string;
  userGender?: string;
  userDateOfBirth?: string;
  userBio?: string;
  nfcPassword?: string;
}

const AdminKeychains = () => {
  const [keychains, setKeychains] = useState<Keychain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [count, setCount] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedKeychainId, setExpandedKeychainId] = useState<string | null>(null);
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning' as 'danger' | 'warning' | 'info',
    onConfirm: () => {}
  });

  const fetchKeychains = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get('/admin/keychains');
      if (res.data.success) setKeychains(res.data.data.items);
    } catch (err) {
      console.error('Failed to fetch keychains', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKeychains();
  }, []);

  const handleReactivate = async (keyId: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Mở khóa thiết bị',
      message: 'Bạn có chắc muốn mở khóa thiết bị này?',
      type: 'warning',
      onConfirm: async () => {
        try {
          const res = await axiosInstance.post(`/admin/keychains/${keyId}/reactivate`);
          if (res.data.success) {
            toast.success('Đã mở khóa thiết bị thành công!');
            fetchKeychains();
          }
        } catch (err) {
          toast.error('Lỗi khi mở khóa thiết bị.');
        }
      }
    });
  };

  const handleUnpair = async (keyId: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Gỡ ghép đôi thiết bị',
      message: 'Bạn có chắc muốn gỡ ghép đôi thiết bị này? Không gian cặp đôi sẽ bị xóa (nếu không còn dữ liệu)!',
      type: 'danger',
      onConfirm: async () => {
        try {
          const res = await axiosInstance.post(`/admin/keychains/${keyId}/unpair`);
          if (res.data.success) {
            toast.success('Đã gỡ ghép đôi thành công!');
            fetchKeychains();
          }
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Lỗi khi gỡ ghép đôi.');
        }
      }
    });
  };

  const handleDelete = async (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Xóa thiết bị',
      message: 'Bạn có chắc chắn muốn XÓA VĨNH VIỄN thiết bị này khỏi hệ thống? Dữ liệu sẽ không thể khôi phục.',
      type: 'danger',
      onConfirm: async () => {
        try {
          const res = await axiosInstance.delete(`/admin/keychains/${id}`);
          if (res.data.success) {
            toast.success('Đã xóa thiết bị thành công!');
            fetchKeychains();
          }
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Lỗi khi xóa thiết bị.');
        }
      }
    });
  };

  const handleBulkCreate = async () => {
    setIsGenerating(true);
    try {
      const res = await axiosInstance.post('/admin/keychains/bulk', { count });
      if (res.data.success) {
        toast.success(`Đã tạo thành công ${count} mã định danh mới!`);
        fetchKeychains();
      }
    } catch (err) {
      toast.error('Lỗi khi tạo mã định danh.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/activate/${text}`);
    toast.success('Đã sao chép link kích hoạt!');
  };

  const filteredKeychains = keychains.filter(k => 
    k.keyId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">Quản lý Móc khóa</h1>
          <p className="text-zinc-500 text-sm">Tạo và quản lý các mã định danh NFC cho sản phẩm.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-1">
            <input 
              type="number" 
              value={count} 
              onChange={(e) => setCount(parseInt(e.target.value))}
              className="w-16 px-3 py-2 bg-transparent outline-none text-sm font-bold"
              min="1"
              max="100"
            />
            <button 
              onClick={handleBulkCreate}
              disabled={isGenerating}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
            >
              {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Tạo hàng loạt
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm theo Key ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-0 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>
          <button className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
            <RefreshCw className="w-5 h-5" onClick={fetchKeychains} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-800/30 text-xs font-bold text-zinc-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Key ID</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4">Ngày tạo</th>
                <th className="px-6 py-4">Kích hoạt lúc</th>
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
              ) : filteredKeychains.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-zinc-500 font-bold">Không tìm thấy móc khóa nào.</td>
                </tr>
              ) : filteredKeychains.map((k) => (
                <React.Fragment key={k.id}>
                  <tr 
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group cursor-pointer"
                    onClick={() => setExpandedKeychainId(expandedKeychainId === k.id ? null : k.id)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                          <Key className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                        </div>
                        <span className="font-mono font-bold text-sm">{k.keyId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={k.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500">
                      {new Date(k.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500">
                      {k.activatedAt ? new Date(k.activatedAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => copyToClipboard(k.keyId)}
                          className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-zinc-600 dark:text-zinc-400"
                          title="Copy Activation Link"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(k.id);
                          }}
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-500 transition-colors"
                          title="Xóa thiết bị"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setExpandedKeychainId(expandedKeychainId === k.id ? null : k.id)}
                          className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-zinc-600 dark:text-zinc-400"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedKeychainId === k.id && (
                    <tr className="bg-zinc-50/50 dark:bg-zinc-800/10">
                      <td colSpan={5} className="px-8 py-6 border-t border-b border-zinc-150 dark:border-zinc-800">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                          {/* NFC Owner Details Card */}
                          <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-150 dark:border-zinc-800/60 space-y-4 shadow-sm">
                            <h4 className="font-black text-sm text-primary flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-800/50 pb-2">
                              👤 Người Sở Hữu NFC Shadow User
                            </h4>
                            {k.userId ? (
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Họ tên</span>
                                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{k.userDisplayName}</span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Giới tính</span>
                                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{k.userGender || 'Chưa đặt'}</span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Ngày sinh</span>
                                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{k.userDateOfBirth || 'Chưa đặt'}</span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">PIN Khóa NFC</span>
                                    <span className="font-mono font-black text-primary tracking-widest">{k.nfcPassword || 'Không khóa (Trống)'}</span>
                                  </div>
                                </div>
                                <div className="text-xs pt-1">
                                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Tiểu sử (Bio)</span>
                                  <p className="italic text-zinc-500 dark:text-zinc-400 mt-0.5">"{k.userBio || 'Không có tiểu sử.'}"</p>
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-zinc-400 font-bold py-4 text-center">Chưa có thông tin shadow user (thiết bị chưa kích hoạt).</p>
                            )}
                          </div>

                          {/* Couple Space details Card */}
                          <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-150 dark:border-zinc-800/60 space-y-4 shadow-sm">
                            <h4 className="font-black text-sm text-pink-500 flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-800/50 pb-2">
                              💖 Không Gian Cặp Đôi (Couple Space)
                            </h4>
                            {k.coupleId ? (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Tên cặp đôi</span>
                                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{k.coupleName}</span>
                                  </div>
                                  <div>
                                     <span className="text-[10px] uppercase font-bold text-muted-foreground block">Couple ID</span>
                                     <span className="font-mono font-bold text-zinc-850 dark:text-zinc-250 block truncate">{k.coupleId}</span>
                                  </div>
                                </div>
                                <div className="pt-2 flex items-center gap-2">
                                  <a 
                                    href={`/couple/${k.coupleId}`} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-pink-50 text-pink-600 dark:bg-pink-950/20 dark:text-pink-400 rounded-xl text-xs font-black hover:bg-pink-100 transition-colors"
                                  >
                                    Ghé thăm không gian công khai <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                  <button
                                    onClick={() => handleUnpair(k.keyId)}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 rounded-xl text-xs font-black hover:bg-red-100 transition-colors"
                                  >
                                    <Unlink className="w-3.5 h-3.5" /> Gỡ ghép đôi
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-zinc-400 font-bold py-4 text-center">Móc khóa này chưa được ghép đôi.</p>
                            )}
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

const StatusBadge = ({ status }: { status: string | number }) => {
  const s = status.toString().toLowerCase();
  switch (s) {
    case 'available':
    case '0':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-500">
          <CheckCircle2 className="w-3 h-3" /> Sẵn sàng
        </span>
      );
    case 'activated':
    case 'paired':
    case '1':
    case '2':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-500">
          <ExternalLink className="w-3 h-3" /> Đã dùng
        </span>
      );
    case 'revoked':
    case '3':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-zinc-500/10 text-zinc-500">
          <Ban className="w-3 h-3" /> Đã thu hồi
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/10 text-yellow-500">
          <AlertCircle className="w-3 h-3" /> {status}
        </span>
      );
  }
};

export default AdminKeychains;
