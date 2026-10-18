import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  accent?: 'cyan' | 'rose' | 'emerald' | 'amber' | 'purple';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  accent = 'cyan'
}) => {
  const accentColors = {
    cyan: 'border-cyan-500/20 text-cyan-400 bg-cyan-950/20 shadow-[0_0_20px_rgba(6,182,212,0.1)]',
    rose: 'border-rose-500/20 text-rose-400 bg-rose-950/20 shadow-[0_0_20px_rgba(244,63,94,0.1)]',
    emerald: 'border-emerald-500/20 text-emerald-400 bg-emerald-950/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]',
    amber: 'border-amber-500/20 text-amber-400 bg-amber-950/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]',
    purple: 'border-purple-500/20 text-purple-400 bg-purple-950/20 shadow-[0_0_20px_rgba(168,85,247,0.1)]'
  };

  const iconBg = {
    cyan: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30',
    rose: 'bg-rose-500/10 text-rose-400 border border-rose-500/30',
    emerald: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
    amber: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
    purple: 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
  };

  return (
    <div className={`relative overflow-hidden rounded-xl border bg-slate-900/60 p-5 backdrop-blur-md transition-all duration-200 hover:border-slate-700 ${accentColors[accent]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">{value}</span>
          </div>
          {subtitle && <p className="mt-1 text-xs text-slate-400 font-medium">{subtitle}</p>}
        </div>
        <div className={`rounded-xl p-3 ${iconBg[accent]}`}>
          {icon}
        </div>
      </div>
      <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-gradient-to-br from-white/5 to-transparent blur-2xl" />
    </div>
  );
};
