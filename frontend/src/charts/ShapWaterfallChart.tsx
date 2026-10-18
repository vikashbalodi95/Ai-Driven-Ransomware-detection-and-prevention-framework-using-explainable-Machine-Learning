import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ReferenceLine
} from 'recharts';
import { FeatureContribution } from '../types';

interface ShapWaterfallChartProps {
  contributions: FeatureContribution[];
  baseValue?: number;
}

export const ShapWaterfallChart: React.FC<ShapWaterfallChartProps> = ({
  contributions
}) => {
  if (!contributions || contributions.length === 0) {
    return <div className="text-center py-6 text-slate-500">No SHAP attribution data available.</div>;
  }

  // Take top 8 most influential features for clear display
  const data = contributions.slice(0, 8).map(c => ({
    name: c.display_name,
    shap: c.shap_value,
    actual: c.actual_value,
    unit: c.unit,
    direction: c.direction,
    isPositive: c.shap_value > 0
  })).reverse();

  return (
    <div className="w-full h-80">
      <div className="flex items-center justify-between mb-2 text-xs">
        <span className="flex items-center gap-1.5 text-emerald-400">
          <span className="h-2 w-2 rounded-sm bg-emerald-500" /> Pushes Toward Benign (-SHAP)
        </span>
        <span className="flex items-center gap-1.5 text-rose-400">
          <span className="h-2 w-2 rounded-sm bg-rose-500" /> Pushes Toward Ransomware (+SHAP)
        </span>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 10, right: 30, left: 110, bottom: 10 }}
        >
          <XAxis
            type="number"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            axisLine={{ stroke: '#334155' }}
            tickLine={{ stroke: '#334155' }}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: '#e2e8f0', fontSize: 11 }}
            axisLine={{ stroke: '#334155' }}
            tickLine={false}
            width={110}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="rounded-lg border border-slate-700 bg-slate-900/95 p-3 shadow-xl backdrop-blur-md text-xs">
                    <p className="font-semibold text-white mb-1">{item.name}</p>
                    <p className="text-slate-300">
                      Measured Value: <span className="font-mono text-cyan-300">{item.actual} {item.unit}</span>
                    </p>
                    <p className={item.isPositive ? 'text-rose-400 font-medium' : 'text-emerald-400 font-medium'}>
                      SHAP Attribution: {item.shap > 0 ? `+${item.shap}` : item.shap}
                    </p>
                    <p className="text-slate-400 mt-1 italic">
                      {item.isPositive ? 'Elevates suspicious/ransomware risk' : 'Suppresses risk toward benign'}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <ReferenceLine x={0} stroke="#64748b" strokeDasharray="3 3" />
          <Bar dataKey="shap" radius={[4, 4, 4, 4]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.isPositive ? '#f43f5e' : '#10b981'}
                fillOpacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
