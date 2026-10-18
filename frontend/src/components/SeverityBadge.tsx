import React from 'react';

interface SeverityBadgeProps {
  severity: string;
  size?: 'sm' | 'md' | 'lg';
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, size = 'md' }) => {
  const sev = severity ? severity.toLowerCase() : 'informational';

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-semibold',
    lg: 'px-3 py-1.5 text-sm font-bold'
  };

  const styleClasses: Record<string, string> = {
    critical: 'bg-rose-950/80 text-rose-300 border border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.3)] animate-pulse',
    high: 'bg-orange-950/70 text-orange-300 border border-orange-500/40',
    medium: 'bg-amber-950/60 text-amber-300 border border-amber-500/40',
    low: 'bg-blue-950/60 text-blue-300 border border-blue-500/30',
    informational: 'bg-slate-800/80 text-slate-300 border border-slate-700'
  };

  const currentStyle = styleClasses[sev] || styleClasses.informational;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full uppercase tracking-wider ${sizeClasses[size]} ${currentStyle}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${sev === 'critical' ? 'bg-rose-400' : sev === 'high' ? 'bg-orange-400' : sev === 'medium' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
      {severity}
    </span>
  );
};
