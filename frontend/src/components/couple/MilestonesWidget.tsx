import { motion } from 'framer-motion';
import { Calendar, Star, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';

import axiosInstance from '../../api/axiosInstance';

interface Milestone {
  title: string;
  targetDate: string;
  daysRemaining: number;
}

interface MilestonesWidgetProps {
  slug: string;
}

const MilestonesWidget = ({ slug }: MilestonesWidgetProps) => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get(`/couples/${slug}/milestones`)
      .then(res => {
        if (res.data.success) setMilestones(res.data.data);
      })
      .catch(err => console.error('Failed to fetch milestones', err))
      .finally(() => setIsLoading(false));
  }, [slug]);

  if (isLoading) return <div className="h-48 animate-pulse bg-zinc-100 dark:bg-zinc-800 rounded-3xl" />;
  if (milestones.length === 0) return null;

  return (
    <div className="glass p-8 rounded-[2.5rem]">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-xl">
          <Trophy className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold">Cột mốc sắp tới</h3>
      </div>

      <div className="space-y-4">
        {milestones.map((m, index) => (
          <motion.div
            key={m.title}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-4 bg-white/50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-700 hover:scale-[1.02] transition-transform"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Star className="w-5 h-5 fill-primary" />
              </div>
              <div>
                <h4 className="font-bold">{m.title}</h4>
                <p className="text-xs text-zinc-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(m.targetDate).toLocaleDateString('vi-VN')}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-black text-primary">
                {m.daysRemaining === 0 ? 'Hôm nay!' : `Còn ${m.daysRemaining} ngày`}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MilestonesWidget;
