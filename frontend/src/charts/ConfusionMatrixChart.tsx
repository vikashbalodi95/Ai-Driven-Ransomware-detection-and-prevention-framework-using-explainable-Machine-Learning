import React from 'react';

interface ConfusionMatrixProps {
  matrix: {
    true_negatives: number;
    false_positives: number;
    false_negatives: number;
    true_positives: number;
  };
}

export const ConfusionMatrixChart: React.FC<ConfusionMatrixProps> = ({ matrix }) => {
  if (!matrix) return null;

  const total = matrix.true_negatives + matrix.false_positives + matrix.false_negatives + matrix.true_positives;
  const tnPct = total > 0 ? ((matrix.true_negatives / total) * 100).toFixed(1) : '0';
  const fpPct = total > 0 ? ((matrix.false_positives / total) * 100).toFixed(1) : '0';
  const fnPct = total > 0 ? ((matrix.false_negatives / total) * 100).toFixed(1) : '0';
  const tpPct = total > 0 ? ((matrix.true_positives / total) * 100).toFixed(1) : '0';

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
        {/* True Negatives */}
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-center backdrop-blur-sm">
          <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">True Negatives (TN)</p>
          <p className="text-3xl font-extrabold text-white mt-1">{matrix.true_negatives}</p>
          <p className="text-xs text-slate-400 mt-1 font-mono">{tnPct}% of test set</p>
          <p className="text-[11px] text-emerald-300/80 mt-1">Benign correctly identified</p>
        </div>

        {/* False Positives */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-center backdrop-blur-sm">
          <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">False Positives (FP)</p>
          <p className="text-3xl font-extrabold text-white mt-1">{matrix.false_positives}</p>
          <p className="text-xs text-slate-400 mt-1 font-mono">{fpPct}% of test set</p>
          <p className="text-[11px] text-amber-300/80 mt-1">Benign flagged as ransomware</p>
        </div>

        {/* False Negatives */}
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-4 text-center backdrop-blur-sm">
          <p className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">False Negatives (FN)</p>
          <p className="text-3xl font-extrabold text-white mt-1">{matrix.false_negatives}</p>
          <p className="text-xs text-slate-400 mt-1 font-mono">{fnPct}% of test set</p>
          <p className="text-[11px] text-rose-300/80 mt-1">Missed ransomware (Critical risk)</p>
        </div>

        {/* True Positives */}
        <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-4 text-center backdrop-blur-sm">
          <p className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">True Positives (TP)</p>
          <p className="text-3xl font-extrabold text-white mt-1">{matrix.true_positives}</p>
          <p className="text-xs text-slate-400 mt-1 font-mono">{tpPct}% of test set</p>
          <p className="text-[11px] text-cyan-300/80 mt-1">Ransomware caught</p>
        </div>
      </div>
      
      <div className="mt-4 text-center text-xs text-slate-400 font-mono">
        Total Held-Out Test Evaluation Samples: <span className="text-white font-bold">{total}</span>
      </div>
    </div>
  );
};
