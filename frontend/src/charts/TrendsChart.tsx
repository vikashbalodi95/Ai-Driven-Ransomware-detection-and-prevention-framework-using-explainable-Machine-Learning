import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import { TimelineTrendPoint } from '../types';

interface TrendsChartProps {
  data: TimelineTrendPoint[];
}

export const TrendsChart: React.FC<TrendsChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="text-center py-6 text-slate-500">No trend telemetry available.</div>;
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorBenign" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
            </linearGradient>
            <linearGradient id="colorRansom" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.5}/>
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0}/>
            </linearGradient>
          </defs>
          <XAxis
            dataKey="time_label"
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
          />
          <YAxis
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border border-slate-700 bg-slate-900/95 p-3 shadow-xl backdrop-blur-md text-xs">
                    <p className="font-semibold text-white mb-2">Timestamp: {label}</p>
                    <p className="text-emerald-400 font-medium">
                      Benign Events: {payload[0]?.value}
                    </p>
                    <p className="text-rose-400 font-medium">
                      Ransomware Events: {payload[1]?.value}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend
            verticalAlign="top"
            height={36}
            iconType="circle"
            formatter={(value) => <span className="text-xs text-slate-300 ml-1">{value}</span>}
          />
          <Area
            type="monotone"
            dataKey="benign_count"
            name="Benign Telemetry"
            stroke="#10b981"
            fillOpacity={1}
            fill="url(#colorBenign)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="ransomware_count"
            name="Ransomware Outbreak Telemetry"
            stroke="#f43f5e"
            fillOpacity={1}
            fill="url(#colorRansom)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
