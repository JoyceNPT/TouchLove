import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import * as signalR from '@microsoft/signalr';
import { motion, AnimatePresence } from 'framer-motion';
import { getInitials } from '../utils/helpers';
import { 
  User, 
  Settings, 
  Lock, 
  Share2, 
  Heart, 
  Save, 
  Check, 
  Copy, 
  RefreshCw, 
  HelpCircle,
  Eye,
  EyeOff,
  Camera,
  Bell,
  Plus,
  Trash2,
  CalendarHeart,
  Repeat,
  X,
  Edit2,
  ArrowRight,
  Clock,
  AlertCircle,
} from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import { useAuthStore } from '../store/authStore';
import { toast } from '../store/useToastStore';

interface NfcProfileData {
  id: string;
  displayName: string;
  nickname?: string;
  avatarUrl?: string;
  gender?: string;
  dateOfBirth?: string; // YYYY-MM-DD
  bio?: string;
  nfcPassword?: string;
  isProfilePublic: boolean;
  userType: string;
  keyId: string;
  isPaired: boolean;
  coupleId?: string;
  inviteCode?: string;
  pairingPendingRole?: 'initiator' | 'acceptor';
  pairingPendingPartnerName?: string;
  pairingPendingInvitationId?: string;
}

interface AnniversaryReminder {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  isRecurring: boolean;
}

type ProfileTab = 'profile' | 'reminders';

const NfcProfile = () => {
  const { user, updateUser } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const [pairingNotification, setPairingNotification] = useState<string | null>(null);

  const [profile, setProfile] = useState<NfcProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [partnerInviteCode, setPartnerInviteCode] = useState('');
  const [isPairing, setIsPairing] = useState(false);
  const [isConfirmingPairing, setIsConfirmingPairing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState<ProfileTab>('profile');

  // Form states
  const [displayName, setDisplayName] = useState('');
  const [nickname, setNickname] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [gender, setGender] = useState('Nam');
  const [dob, setDob] = useState('');
  const [bio, setBio] = useState('');
  const [nfcPassword, setNfcPassword] = useState('');
  const [isProfilePublic, setIsProfilePublic] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Anniversary reminders
  const [reminders, setReminders] = useState<AnniversaryReminder[]>([]);
  const [remindersLoading, setRemindersLoading] = useState(false);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState<AnniversaryReminder | null>(null);
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderRecurring, setReminderRecurring] = useState(true);
  const [reminderError, setReminderError] = useState<string | null>(null);
  const [isSavingReminder, setIsSavingReminder] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get('/nfc/profile');
      if (res.data.success && res.data.data) {
        const data = res.data.data;
        setProfile(data);
        setDisplayName(data.displayName || '');
        setNickname(data.nickname || '');
        setAvatarUrl(data.avatarUrl || '');
        setGender(data.gender || 'Nam');
        setDob(data.dateOfBirth || '');
        setBio(data.bio || '');
        setNfcPassword(data.nfcPassword || '');
        setIsProfilePublic(data.isProfilePublic);

        if (data.isPaired && data.coupleId) {
          updateUser({ coupleId: data.coupleId });
        }
      } else {
        setError(res.data.message || 'Không thể tải thông tin profile.');
      }
    } catch (err) {
      console.error(err);
      setError('Lỗi kết nối máy chủ.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReminders = async () => {
    setRemindersLoading(true);
    try {
      const res = await axiosInstance.get('/nfc/reminders');
      if (res.data.success) {
        setReminders(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch reminders', err);
    } finally {
      setRemindersLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    const inviteFromUrl = searchParams.get('invite');
    if (inviteFromUrl) {
      setPartnerInviteCode(inviteFromUrl.toUpperCase().slice(0, 6));
      setSearchParams({}, { replace: true });
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'reminders') {
      fetchReminders();
    }
  }, [activeTab]);

  useEffect(() => {
    if (!user?.id) return;

    const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${backendUrl}/hubs/couple`, {
        accessTokenFactory: () => localStorage.getItem('accessToken') || '',
      })
      .withAutomaticReconnect()
      .build();

    connection
      .start()
      .then(() => {
        connection.on('ReceivePairingRequest', (requesterName: string) => {
          setPairingNotification(`${requesterName} muốn ghép đôi với bạn! Hãy xác nhận bên dưới.`);
          fetchProfile();
          setTimeout(() => setPairingNotification(null), 8000);
        });
        connection.on('ReceivePairingConfirmed', (coupleId: string) => {
          setPairingNotification('Ghép đôi thành công! 💕');
          updateUser({ coupleId });
          fetchProfile();
          setTimeout(() => setPairingNotification(null), 8000);
        });
      })
      .catch((err) => console.error('SignalR pairing notifications:', err));

    connectionRef.current = connection;
    return () => {
      connection.stop();
      connectionRef.current = null;
    };
  }, [user?.id]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setError(null);
    setSuccessMsg(null);

    if (nfcPassword && (nfcPassword.length !== 6 || !/^\d+$/.test(nfcPassword))) {
      setError('Mật mã PIN quét NFC phải đúng 6 chữ số.');
      setIsUpdating(false);
      return;
    }

    try {
      const res = await axiosInstance.post('/nfc/profile/update', {
        displayName,
        nickname,
        gender,
        dateOfBirth: dob ? dob : null,
        bio,
        isProfilePublic,
        nfcPassword: nfcPassword ? nfcPassword : null
      });

      if (res.data.success) {
        toast.success('Cập nhật hồ sơ NFC cá nhân thành công!');
        setSuccessMsg('Cập nhật hồ sơ NFC cá nhân thành công!');
        
        const { user: authUser, setUser } = useAuthStore.getState();
        if (authUser) {
          setUser({ ...authUser, displayName, nickname });
        }

        fetchProfile();
      } else {
        setError(res.data.message || 'Cập nhật thất bại.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi khi gửi yêu cầu cập nhật.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploadingAvatar(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await axiosInstance.post('/nfc/profile/avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (res.data.success && res.data.data) {
          const newAvatarUrl = res.data.data;
          setAvatarUrl(newAvatarUrl);
          toast.success('Tải lên ảnh đại diện thành công!');

          const { user: authUser, setUser } = useAuthStore.getState();
          if (authUser) {
            setUser({ ...authUser, avatarUrl: newAvatarUrl });
          }
        } else {
          setError(res.data.message || 'Không thể tải ảnh lên.');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Có lỗi xảy ra khi tải ảnh đại diện.');
      } finally {
        setIsUploadingAvatar(false);
      }
    }
  };

  const handlePairing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerInviteCode) return;
    setIsPairing(true);
    setError(null);
    try {
      const res = await axiosInstance.post('/pairing/accept', { inviteCode: partnerInviteCode.toUpperCase().trim() });
      if (res.data.success && res.data.data?.status === 'pending_confirmation') {
        toast.success(res.data.message || 'Đã gửi yêu cầu ghép đôi. Chờ đối phương xác nhận! 💕');
        setPartnerInviteCode('');
        await fetchProfile();
      } else if (res.data.success) {
        toast.error('Phản hồi không hợp lệ từ máy chủ. Vui lòng thử lại.');
      } else {
        setError(res.data.message || 'Mã ghép đôi không hợp lệ hoặc đã hết hạn.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi ghép đôi.');
    } finally {
      setIsPairing(false);
    }
  };

  const handleConfirmPairing = async () => {
    setIsConfirmingPairing(true);
    setError(null);
    try {
      const res = await axiosInstance.post('/pairing/confirm');
      if (res.data.success && res.data.data) {
        updateUser({ coupleId: res.data.data.id });
        toast.success('Ghép đôi thành công! Bạn có thể vào không gian couple 💕');
        await fetchProfile();
      } else {
        setError(res.data.message || 'Không thể xác nhận ghép đôi.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi khi xác nhận ghép đôi.');
    } finally {
      setIsConfirmingPairing(false);
    }
  };

  const handleRejectPairing = async () => {
    setIsConfirmingPairing(true);
    setError(null);
    try {
      const res = await axiosInstance.post('/pairing/reject');
      if (res.data.success) {
        toast.success('Đã hủy yêu cầu ghép đôi.');
        await fetchProfile();
      } else {
        setError(res.data.message || 'Không thể hủy yêu cầu.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi khi hủy yêu cầu ghép đôi.');
    } finally {
      setIsConfirmingPairing(false);
    }
  };

  const handleCopyLink = () => {
    if (profile?.inviteCode) {
      navigator.clipboard.writeText(profile.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // --- REMINDER CRUD ---
  const openCreateReminder = () => {
    setEditingReminder(null);
    setReminderTitle('');
    setReminderDate('');
    setReminderRecurring(true);
    setReminderError(null);
    setShowReminderForm(true);
  };

  const openEditReminder = (r: AnniversaryReminder) => {
    setEditingReminder(r);
    setReminderTitle(r.title);
    setReminderDate(r.date);
    setReminderRecurring(r.isRecurring);
    setReminderError(null);
    setShowReminderForm(true);
  };

  const handleSaveReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderTitle.trim() || !reminderDate) {
      setReminderError('Vui lòng điền đầy đủ tên và ngày kỷ niệm.');
      return;
    }

    setIsSavingReminder(true);
    setReminderError(null);

    try {
      let res;
      if (editingReminder) {
        res = await axiosInstance.put(`/nfc/reminders/${editingReminder.id}`, {
          title: reminderTitle.trim(),
          date: reminderDate,
          isRecurring: reminderRecurring
        });
      } else {
        res = await axiosInstance.post('/nfc/reminders', {
          title: reminderTitle.trim(),
          date: reminderDate,
          isRecurring: reminderRecurring
        });
      }

      if (res.data.success) {
        toast.success(editingReminder ? 'Cập nhật lời nhắc thành công!' : 'Tạo lời nhắc thành công!');
        setShowReminderForm(false);
        fetchReminders();
      } else {
        setReminderError(res.data.message || 'Có lỗi xảy ra.');
      }
    } catch (err: any) {
      setReminderError(err.response?.data?.message || 'Không thể lưu lời nhắc.');
    } finally {
      setIsSavingReminder(false);
    }
  };

  const handleDeleteReminder = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await axiosInstance.delete(`/nfc/reminders/${id}`);
      if (res.data.success) {
        toast.success('Đã xóa lời nhắc.');
        setReminders(prev => prev.filter(r => r.id !== id));
      } else {
        toast.error(res.data.message || 'Không thể xóa lời nhắc.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi xóa.');
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <RefreshCw className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl overflow-x-hidden">
      {pairingNotification && (
        <div className="mb-6 p-4 bg-primary/10 border border-primary/30 rounded-2xl flex items-center gap-3 text-sm font-bold text-primary">
          <Bell className="w-5 h-5 shrink-0 animate-bounce" />
          {pairingNotification}
        </div>
      )}

      {/* Top Banner */}
      <div className="relative text-center mb-10 p-8 rounded-[3rem] bg-gradient-to-tr from-primary/10 to-pink-500/10 border border-white/20 dark:border-zinc-800/30 overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-36 h-36 bg-primary/20 rounded-full blur-2xl -z-10" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-pink-300/20 rounded-full blur-2xl -z-10" />
        <h1 className="text-4xl md:text-5xl font-black mb-3 leading-tight">
          Hồ Sơ NFC Cá Nhân 🏷️
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto text-sm">
          Thiết lập thông tin cá nhân của chip NFC. Ghép đôi cần hai bên: một người nhập mã, người kia xác nhận.
        </p>
        {profile?.isPaired && profile.coupleId && (
          <Link
            to={`/couple/${profile.coupleId}`}
            className="inline-flex items-center justify-center gap-2 mt-6 px-8 py-3.5 bg-primary hover:bg-primary/95 text-white font-black rounded-2xl shadow-lg shadow-primary/25 transition-all hover:scale-[1.02]"
          >
            <Heart className="w-5 h-5 fill-white/30" />
            Vào không gian couple
            <ArrowRight className="w-5 h-5" />
          </Link>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 mb-8 p-1.5 bg-secondary dark:bg-zinc-800/60 rounded-2xl border border-zinc-200 dark:border-zinc-700 max-w-sm">
        {([
          { key: 'profile', label: 'Hồ sơ & Cài đặt', icon: <User className="w-4 h-4" /> },
          { key: 'reminders', label: 'Nhắc nhở kỷ niệm', icon: <Bell className="w-4 h-4" /> },
        ] as { key: ProfileTab; label: string; icon: React.ReactNode }[]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.key
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'profile' ? (
          /* ===== PROFILE TAB ===== */
          <motion.div
            key="profile-tab"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="grid lg:grid-cols-3 gap-8 items-start">
              {/* Left: Pairing actions */}
              <div className="lg:col-span-1 space-y-6">
                {profile?.isPaired && profile.coupleId && (
                  <div className="glass p-8 rounded-[2.5rem] border border-primary/20 shadow-xl text-center space-y-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                      <Heart className="w-8 h-8 text-primary fill-primary/20" />
                    </div>
                    <h3 className="text-xl font-black">Đã ghép đôi</h3>
                    <p className="text-xs text-zinc-500">Bạn không thể ghép đôi thêm. Chỉ có thể vào không gian couple.</p>
                    <Link
                      to={`/couple/${profile.coupleId}`}
                      className="inline-flex w-full items-center justify-center gap-2 py-3.5 bg-primary text-white font-black rounded-2xl text-sm"
                    >
                      Vào không gian couple <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}

                {!profile?.isPaired && (
                <>
                {/* Pending: initiator must confirm */}
                {profile?.pairingPendingRole === 'initiator' && (
                  <div className="glass p-8 rounded-[2.5rem] border border-yellow-500/30 shadow-xl space-y-5 text-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-600 text-xs font-black">
                      <AlertCircle className="w-3.5 h-3.5" /> Yêu cầu ghép đôi
                    </span>
                    <h3 className="text-lg font-black">Xác nhận ghép cặp</h3>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      <span className="font-bold text-primary">{profile.pairingPendingPartnerName}</span> đã nhập mã mời của bạn. Bạn có đồng ý ghép đôi không?
                    </p>
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={handleConfirmPairing}
                        disabled={isConfirmingPairing}
                        className="w-full bg-primary text-white py-3 rounded-2xl font-bold text-sm shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" /> Đồng ý ghép đôi
                      </button>
                      <button
                        type="button"
                        onClick={handleRejectPairing}
                        disabled={isConfirmingPairing}
                        className="w-full border border-zinc-200 dark:border-zinc-700 py-3 rounded-2xl font-bold text-sm text-zinc-600 dark:text-zinc-300"
                      >
                        Từ chối
                      </button>
                    </div>
                  </div>
                )}

                {/* Pending: acceptor waiting */}
                {profile?.pairingPendingRole === 'acceptor' && (
                  <div className="glass p-8 rounded-[2.5rem] border border-yellow-500/20 shadow-xl text-center space-y-4">
                    <div className="p-3 bg-yellow-500/10 text-yellow-600 rounded-2xl inline-flex">
                      <Clock className="w-6 h-6 animate-pulse" />
                    </div>
                    <h3 className="text-lg font-black text-yellow-600">Đang chờ xác nhận</h3>
                    <p className="text-xs text-zinc-500">
                      Đã gửi yêu cầu ghép đôi tới <span className="font-bold">{profile.pairingPendingPartnerName}</span>. Họ cần xác nhận trên hồ sơ NFC.
                    </p>
                    <button
                      type="button"
                      onClick={handleRejectPairing}
                      disabled={isConfirmingPairing}
                      className="text-xs font-bold text-zinc-400 hover:text-red-500 underline"
                    >
                      Hủy yêu cầu
                    </button>
                  </div>
                )}

                {/* Invite Code card */}
                {!profile?.isPaired && profile?.pairingPendingRole !== 'acceptor' && (
                <div className="glass p-8 rounded-[2.5rem] border border-white/20 dark:border-zinc-800/40 relative overflow-hidden text-center shadow-xl">
                  <div className="absolute top-4 right-4 text-xs font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-full uppercase">Single NFC</div>
                  <div className="w-16 h-16 bg-gradient-to-tr from-primary to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/25">
                    <Share2 className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-black mb-1">Mã Kết Đôi Của Bạn</h3>
                  <p className="text-zinc-500 text-xs mb-6">Chia sẻ mã này với người kia để ghép đôi móc khóa.</p>

                  {profile?.inviteCode ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-secondary dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 font-mono font-black text-2xl tracking-widest text-primary">
                        <span className="flex-1 text-center select-all">{profile.inviteCode}</span>
                        <button 
                          onClick={handleCopyLink} 
                          className="p-2 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded-xl transition-all text-muted-foreground hover:text-foreground ml-2"
                        >
                          {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                        </button>
                      </div>
                      <p className="text-[10px] text-zinc-400">Mã có hiệu lực trong 48 giờ và sẽ tự động làm mới.</p>
                    </div>
                  ) : (
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-2xl text-xs font-bold">
                      Chưa kích hoạt mã kết đôi.
                    </div>
                  )}
                </div>
                )}

                {/* Pairing input card */}
                {!profile?.isPaired && !profile?.pairingPendingRole && (
                <div className="glass p-8 rounded-[2.5rem] border border-white/20 dark:border-zinc-800/40 relative overflow-hidden shadow-xl">
                  <div className="w-16 h-16 bg-pink-500/10 text-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-7 h-7 fill-pink-500/10 text-pink-500 animate-pulse" />
                  </div>
                  <h3 className="text-xl font-black text-center mb-1">Nhập Mã Đối Phương</h3>
                  <p className="text-zinc-500 text-xs text-center mb-6">Nhập mã 6 ký tự từ đối phương. Họ sẽ cần xác nhận trước khi ghép đôi thành công.</p>

                  <form onSubmit={handlePairing} className="space-y-4">
                    <input 
                      type="text" 
                      placeholder="Ví Dụ: A1B2C3" 
                      value={partnerInviteCode}
                      onChange={(e) => setPartnerInviteCode(e.target.value)}
                      maxLength={6}
                      className="w-full text-center py-3 bg-secondary dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary font-mono font-black text-lg tracking-widest uppercase"
                    />
                    <button
                      type="submit"
                      disabled={isPairing || !partnerInviteCode}
                      className="w-full bg-gradient-to-r from-primary to-pink-500 text-white py-4 rounded-2xl font-black text-sm shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {isPairing ? <RefreshCw className="w-4 h-4 animate-spin inline mr-1" /> : null}
                      Gửi yêu cầu ghép đôi 💕
                    </button>
                  </form>
                </div>
                )}
                </>
                )}
              </div>

              {/* Right: Profile form */}
              <div className="lg:col-span-2">
                <div className="glass p-8 md:p-10 rounded-[2.5rem] border border-white/20 dark:border-zinc-800/40 shadow-xl space-y-8">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl">
                      <Settings className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black">Thiết Lập Hồ Sơ NFC</h3>
                      <p className="text-zinc-500 text-xs">Cá nhân hóa trang NFC và cấu hình bảo mật quét thẻ.</p>
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold rounded-2xl">
                      {error}
                    </div>
                  )}

                  {successMsg && (
                    <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-500 text-sm font-bold rounded-2xl">
                      {successMsg}
                    </div>
                  )}

                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    {/* Avatar */}
                    <div className="flex flex-col items-center space-y-4 pb-6 border-b border-zinc-100 dark:border-zinc-800/50">
                      <div className="relative group w-28 h-28 rounded-full overflow-hidden border-2 border-primary/20 p-1 bg-primary/5 flex items-center justify-center cursor-pointer shadow-md transition-all hover:scale-105">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="text-3xl font-black text-primary">{getInitials(displayName || user?.displayName)}</span>
                        )}
                        <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-black cursor-pointer space-y-1">
                          <Camera className="w-5 h-5" />
                          <span>ĐỔI ẢNH</span>
                          <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                        </label>
                      </div>
                      {isUploadingAvatar && (
                        <span className="text-[10px] text-primary font-black animate-pulse uppercase tracking-wider">Đang tải ảnh lên...</span>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Display name */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <User className="w-4 h-4" /> Họ tên hiển thị
                        </label>
                        <input
                          type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required
                          className="w-full px-4 py-3 bg-secondary dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary font-medium"
                        />
                      </div>

                      {/* Nickname */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <User className="w-4 h-4" /> Biệt danh (Hiển thị navbar)
                        </label>
                        <input
                          type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Không bắt buộc"
                          className="w-full px-4 py-3 bg-secondary dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary font-medium"
                        />
                      </div>

                      {/* Gender */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Giới tính</label>
                        <select
                          value={gender} onChange={(e) => setGender(e.target.value)}
                          className="w-full px-4 py-3 bg-secondary dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary font-medium"
                        >
                          <option value="Nam">Nam</option>
                          <option value="Nữ">Nữ</option>
                          <option value="Khác">Khác</option>
                        </select>
                      </div>

                      {/* Date of Birth */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ngày sinh</label>
                        <input
                          type="date" value={dob} onChange={(e) => setDob(e.target.value)}
                          className="w-full px-4 py-3 bg-secondary dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary font-medium text-zinc-700 dark:text-zinc-300"
                        />
                      </div>

                      {/* NFC PIN */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Lock className="w-4 h-4" /> PIN Quét NFC (Mật mã 6 số)
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'} value={nfcPassword}
                            onChange={(e) => setNfcPassword(e.target.value)} maxLength={6}
                            placeholder="Trống (Không đặt mã khóa)"
                            className="w-full pl-4 pr-12 py-3 bg-secondary dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary font-mono tracking-widest font-black"
                          />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Bio */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tiểu sử ngắn (Bio)</label>
                      <textarea
                        value={bio} onChange={(e) => setBio(e.target.value)} rows={4}
                        placeholder="Viết vài dòng giới thiệu về bản thân bạn..."
                        className="w-full px-4 py-3 bg-secondary dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary font-medium resize-none"
                      />
                    </div>

                    {/* Public toggle */}
                    <div className="flex items-center justify-between p-4 bg-secondary dark:bg-zinc-800/30 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-sm">Hiển thị hồ sơ công khai</h4>
                        <p className="text-zinc-500 text-[10px]">Cho phép người dùng chưa ghép đôi khác tìm thấy bạn trên bảng Khám Phá.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={isProfilePublic} onChange={(e) => setIsProfilePublic(e.target.checked)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-zinc-200 dark:bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                      </label>
                    </div>

                    <div className="flex justify-end pt-4">
                      <button
                        type="submit" disabled={isUpdating}
                        className="bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-black text-sm shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                      >
                        {isUpdating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Lưu thay đổi hồ sơ
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* ===== REMINDERS TAB ===== */
          <motion.div
            key="reminders-tab"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="max-w-2xl mx-auto"
          >
            {/* Description card */}
            <div className="glass p-6 rounded-[2rem] border border-primary/10 bg-gradient-to-br from-primary/5 to-pink-500/5 mb-6 space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                  <CalendarHeart className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black">Nhắc nhở Kỷ niệm Cá nhân</h3>
                  <p className="text-xs text-zinc-500">Dành riêng cho bạn — đối phương không thể xem.</p>
                </div>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed pl-1">
                💌 Hệ thống sẽ gửi email nhắc nhở tinh tế <span className="font-black text-primary">trước 1 tuần</span> để bạn chuẩn bị món quà ý nghĩa cho ngày đặc biệt.
              </p>
            </div>

            {/* Action row */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-lg">Danh sách lời nhắc</h3>
              <button
                onClick={openCreateReminder}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
              >
                <Plus className="w-4 h-4" />
                Tạo lời nhắc
              </button>
            </div>

            {/* Reminder list */}
            {remindersLoading ? (
              <div className="flex justify-center py-12">
                <RefreshCw className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : reminders.length === 0 ? (
              <div className="glass p-12 rounded-[2rem] text-center flex flex-col items-center space-y-4 border border-dashed border-zinc-200 dark:border-zinc-800">
                <div className="p-4 bg-primary/5 text-primary rounded-full">
                  <Bell className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-zinc-600 dark:text-zinc-400">Chưa có lời nhắc nào</h4>
                <p className="text-xs text-zinc-500 max-w-xs">Tạo lời nhắc ngày kỷ niệm để không bao giờ bỏ lỡ khoảnh khắc quan trọng bên người thương!</p>
                <button onClick={openCreateReminder} className="text-primary font-black hover:underline text-sm">
                  Tạo lời nhắc đầu tiên ✨
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {reminders.map((r) => {
                    const d = new Date(r.date + 'T00:00:00');
                    const today = new Date();
                    const thisYear = new Date(today.getFullYear(), d.getMonth(), d.getDate());
                    if (thisYear < today) thisYear.setFullYear(today.getFullYear() + 1);
                    const daysUntil = Math.ceil((thisYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                    return (
                      <motion.div
                        key={r.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="glass p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800/50 flex items-center gap-4 group hover:border-primary/30 transition-all"
                      >
                        {/* Date badge */}
                        <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-primary/10 flex flex-col items-center justify-center border border-primary/20">
                          <span className="text-xs font-black text-primary">{d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</span>
                          {r.isRecurring && <Repeat className="w-3 h-3 text-primary/60 mt-0.5" />}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm truncate">{r.title}</h4>
                          <p className="text-[11px] text-zinc-500 mt-0.5">
                            {daysUntil === 0 ? (
                              <span className="text-primary font-black">🎉 Hôm nay!</span>
                            ) : daysUntil <= 7 ? (
                              <span className="text-orange-500 font-bold">⚠️ Còn {daysUntil} ngày</span>
                            ) : (
                              <span>Còn {daysUntil} ngày</span>
                            )}
                            {r.isRecurring && <span className="ml-2 text-zinc-400">• Hàng năm</span>}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditReminder(r)}
                            className="p-2 hover:bg-primary/10 text-primary rounded-xl transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteReminder(r.id)}
                            disabled={deletingId === r.id}
                            className="p-2 hover:bg-red-500/10 text-red-500 rounded-xl transition-colors disabled:opacity-50"
                            title="Xóa"
                          >
                            {deletingId === r.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== REMINDER FORM MODAL ===== */}
      <AnimatePresence>
        {showReminderForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-background w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-border"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 flex items-center justify-between border-b border-border">
                <div>
                  <h2 className="text-xl font-bold">
                    {editingReminder ? 'Chỉnh sửa lời nhắc' : 'Tạo lời nhắc mới'}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Email sẽ được gửi trước 7 ngày</p>
                </div>
                <button onClick={() => setShowReminderForm(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveReminder} className="p-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold">Tên ngày kỷ niệm</label>
                  <input
                    type="text"
                    value={reminderTitle}
                    onChange={(e) => setReminderTitle(e.target.value)}
                    placeholder="Ví dụ: Ngày yêu nhau, Sinh nhật anh/em..."
                    className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold">Ngày kỷ niệm</label>
                  <input
                    type="date"
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                    className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-secondary dark:bg-zinc-800/30 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-sm flex items-center gap-2">
                      <Repeat className="w-4 h-4 text-primary" /> Nhắc hàng năm
                    </h4>
                    <p className="text-zinc-500 text-[10px]">Tự động lặp lại nhắc nhở vào năm sau.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={reminderRecurring} onChange={(e) => setReminderRecurring(e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-zinc-200 dark:bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                  </label>
                </div>

                {reminderError && (
                  <p className="text-sm text-destructive font-medium bg-destructive/10 p-3 rounded-lg">
                    {reminderError}
                  </p>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowReminderForm(false)}
                    className="flex-1 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-bold py-3 rounded-xl transition-all text-sm"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingReminder}
                    className="flex-1 bg-primary text-white font-bold py-3 rounded-xl shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSavingReminder ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {editingReminder ? 'Lưu thay đổi' : 'Tạo lời nhắc'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NfcProfile;
