import { motion } from 'framer-motion';
import { Calendar, Trophy, Star, Lock, Heart, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import axiosInstance from '../../api/axiosInstance';

interface Milestone {
  title: string;
  targetDate: string;
  daysRemaining: number;
  isUnlocked: boolean;
  type: string;
}

interface TogetherMilestonesProps {
  slug: string;
  isOwner?: boolean;
  isAnniversariesPublic?: boolean;
  isAchievementsPublic?: boolean;
}

const TogetherMilestones = ({ 
  slug, 
  isOwner = true, 
  isAnniversariesPublic = true, 
  isAchievementsPublic = true 
}: TogetherMilestonesProps) => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get(`/couples/${slug}/milestones`)
      .then(res => {
        if (res.data && res.data.success && Array.isArray(res.data.data)) {
          setMilestones(res.data.data);
        } else {
          setMilestones([]);
        }
      })
      .catch(err => {
        console.error('Failed to fetch milestones', err);
        setMilestones([]);
      })
      .finally(() => setIsLoading(false));
  }, [slug]);

  if (isLoading) {
    return <div className="h-96 animate-pulse bg-zinc-100 dark:bg-zinc-850 rounded-[2.5rem]" />;
  }

  if (!Array.isArray(milestones) || milestones.length === 0) return null;

  // Split into unlocked (Achievements) and locked (Upcoming)
  const unlocked = milestones.filter(m => m && m.isUnlocked);
  const locked = milestones.filter(m => m && !m.isUnlocked);

  // The single next milestone is the first locked one
  const nextMilestone = locked[0];

  // Helper to get achievement badge icon
  const getBadgeIcon = (m: Milestone, isUnlocked: boolean) => {
    const colorClass = isUnlocked 
      ? m.type === 'year' 
        ? 'text-yellow-500 bg-yellow-500/10' 
        : m.type === 'month' 
        ? 'text-pink-500 bg-pink-500/10' 
        : 'text-purple-500 bg-purple-500/10'
      : 'text-zinc-400 bg-zinc-100 dark:bg-zinc-800';

    if (!isUnlocked) return <Lock className="w-6 h-6 text-zinc-400" />;

    switch (m.type) {
      case 'year':
        return <Trophy className={`w-6 h-6 ${colorClass}`} />;
      case 'month':
        return <Heart className={`w-6 h-6 fill-current ${colorClass}`} />;
      case 'day':
      default:
        return <Star className={`w-6 h-6 ${colorClass}`} />;
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Next Milestone Reminder Widget */}
      {nextMilestone && (
        isOwner || isAnniversariesPublic ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative glass p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-primary/20 shadow-xl overflow-hidden group"
          >
            {/* Decorative glowing gradient background */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
            
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-primary/10 text-primary rounded-2xl animate-bounce">
                <Calendar className="w-6 h-6" />
              </div>
              <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">Kỷ niệm sắp tới</span>
            </div>

            <h3 className="text-2xl font-black mb-2 text-zinc-800 dark:text-zinc-100">
              {nextMilestone.title}
            </h3>
            
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6 flex items-center gap-2">
               Ngày kỷ niệm: <span className="font-bold text-zinc-700 dark:text-zinc-200">
                {new Date(nextMilestone.targetDate).toLocaleDateString('vi-VN')}
              </span>
            </p>

            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-5xl font-black tracking-tighter text-primary">
                {nextMilestone.daysRemaining}
              </span>
              <span className="text-lg font-bold text-muted-foreground">ngày nữa</span>
            </div>

            {/* Simple progress bar mock to make it feel alive */}
            <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(10, Math.min(100, (365 - nextMilestone.daysRemaining) / 3.65))}%` }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-primary to-pink-500 rounded-full"
              />
            </div>
            <p className="text-xs text-zinc-400 mt-2 text-right">Đang tiến gần đến ngày hạnh phúc...</p>
          </motion.div>
        ) : (
          <div className="glass p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-zinc-200 dark:border-zinc-850/50 text-center space-y-4 shadow-xl">
            <div className="p-3 bg-zinc-500/10 text-zinc-400 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
              <Lock className="w-5 h-5 text-zinc-400" />
            </div>
            <h4 className="font-bold text-sm text-zinc-800 dark:text-zinc-200">Kỷ Niệm Sắp Tới Riêng Tư 🔒</h4>
            <p className="text-xs text-zinc-500">Chủ nhân đã đặt mốc thời gian này ở chế độ riêng tư.</p>
          </div>
        )
      )}

      {/* 2. Achievements Shelf */}
      {isOwner || isAchievementsPublic ? (
        <div className="glass p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 rounded-2xl">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-zinc-800 dark:text-zinc-100">Thành tựu bên nhau</h3>
          </div>

          {/* Badge showcase grid - optimized for responsive layouts */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {milestones.map((m, idx) => (
              <motion.div
                key={m.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className={`p-5 rounded-3xl border flex flex-col items-center text-center justify-between transition-all duration-300 relative overflow-hidden ${
                  m.isUnlocked 
                    ? 'bg-white dark:bg-zinc-800/80 border-zinc-150 dark:border-zinc-700 shadow-md hover:shadow-lg hover:-translate-y-1' 
                    : 'bg-zinc-50/50 dark:bg-zinc-900/50 border-dashed border-zinc-200 dark:border-zinc-800 opacity-60'
                }`}
              >
                {/* Unlock badge glow */}
                {m.isUnlocked && (
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary to-pink-500" />
                )}

                {/* Icon Container */}
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 shadow-inner ${
                  m.isUnlocked 
                    ? m.type === 'year' 
                      ? 'bg-yellow-500/10' 
                      : m.type === 'month' 
                      ? 'bg-pink-500/10' 
                      : 'bg-purple-500/10'
                    : 'bg-zinc-100 dark:bg-zinc-800'
                }`}>
                  {getBadgeIcon(m, m.isUnlocked)}
                </div>

                {/* Info */}
                <div className="space-y-1">
                  <span className={`block font-bold text-sm leading-tight ${m.isUnlocked ? 'text-zinc-800 dark:text-zinc-100' : 'text-zinc-500'}`}>
                    {m.title}
                  </span>
                  
                  {m.isUnlocked ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10 px-2.5 py-0.5 rounded-full mt-1.5">
                      <CheckCircle className="w-3 h-3" /> Đã đạt được
                    </span>
                  ) : (
                    <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-1.5">
                      Khóa
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="glass p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-zinc-200 dark:border-zinc-850/50 text-center space-y-4 shadow-xl">
          <div className="p-3 bg-zinc-500/10 text-yellow-600 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
            <Trophy className="w-5 h-5 text-zinc-400" />
          </div>
          <h4 className="font-bold text-sm text-zinc-800 dark:text-zinc-200">Huy Hiệu Thành Tựu Riêng Tư 🔒</h4>
          <p className="text-xs text-zinc-500">Chủ nhân đã đặt danh sách huy hiệu ở chế độ riêng tư.</p>
        </div>
      )}
    </div>
  );
};

export default TogetherMilestones;
