import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';

interface FeatureImportanceItem {
  feature: string;
  display_name: string;
  mean_abs_shap: number;
  relative_importance_pct: number;
  description: string;
}

interface FeatureImportanceChartProps {
  importances: FeatureImportanceItem[];
}

export const FeatureImportanceChart: React.FC<FeatureImportanceChartProps> = ({ importances }) => {
  if (!importances || importances.length === 0) {
    return <div className="text-center py-6 text-slate-500">No feature importance data available.</div>;
  }

  const data = [...importances].reverse();

  return (
    <div className="w-full h-96">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 10, right: 30, left: 140, bottom: 10 }}
        >
          <XAxis
            type="number"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={{ stroke: '#334155' }}
            tickLine={{ stroke: '#334155' }}
            unit="%"
          />
          <YAxis
            type="category"
            dataKey="display_name"
            tick={{ fill: '#e2e8f0', fontSize: 11 }}
            axisLine={{ stroke: '#334155' }}
            tickLine={false}
            width={140}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as FeatureImportanceItem;
                return (
                  <div className="rounded-lg border border-slate-700 bg-slate-900/95 p-3 shadow-xl backdrop-blur-md text-xs max-w-xs">
                    <p className="font-semibold text-white mb-1">{item.display_name}</p>
                    <p className="text-cyan-400 font-medium">
                      Relative Importance: {item.relative_importance_pct}%
                    </p>
                    <p className="text-slate-300">
                      Mean |SHAP| Value: {item.mean_abs_shap}
                    </p>
                    <p className="text-slate-400 mt-2 text-[11px] leading-tight">
                      {item.description}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar
            dataKey="relative_importance_pct"
            fill="#06b6d4"
            radius={[0, 4, 4, 0]}
            fillOpacity={0.85}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
