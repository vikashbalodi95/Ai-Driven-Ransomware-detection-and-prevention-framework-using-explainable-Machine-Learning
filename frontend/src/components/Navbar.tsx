import React from 'react';
import {
  ShieldAlert,
  Activity,
  Layers,
  BellRing,
  Cpu,
  PlayCircle,
  Download,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';

export type NavTab = 'overview' | 'live' | 'xai' | 'alerts' | 'model' | 'simulation';

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  autoRefresh: boolean;
  setAutoRefresh: (val: boolean) => void;
  alertCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  autoRefresh,
  setAutoRefresh,
  alertCount
}) => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Activity className="h-4 w-4" /> },
    { id: 'live', label: 'Live Telemetry', icon: <Layers className="h-4 w-4" /> },
    { id: 'xai', label: 'Explainability & XAI', icon: <Cpu className="h-4 w-4" /> },
    {
      id: 'alerts',
      label: 'Alerts & Audit',
      icon: <BellRing className="h-4 w-4" />,
      badge: alertCount > 0 ? alertCount : undefined
    },
    { id: 'model', label: 'Model Metrics', icon: <ShieldAlert className="h-4 w-4" /> },
    { id: 'simulation', label: 'Simulation Sandbox', icon: <PlayCircle className="h-4 w-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)]">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-white">RansomGuard</span>
                <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-500/30">
                  XAI-SOC
                </span>
              </div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                AI Behavioral Detection
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as NavTab)}
                  className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-150 ${
                    isActive
                      ? 'bg-slate-800/90 text-white shadow-inner border border-slate-700/60'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  {tab.badge !== undefined && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-[0_0_8px_rgba(244,63,94,0.6)]">
                      {tab.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-cyan-400 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Auto-Refresh Toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
                autoRefresh
                  ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-400'
                  : 'border-slate-800 bg-slate-900 text-slate-400'
              }`}
              title="Toggle Live Stream Auto-Refresh (5s)"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${autoRefresh ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{autoRefresh ? 'LIVE (5s)' : 'PAUSED'}</span>
            </button>

            {/* CSV Export */}
            <a
              href={api.getExportCsvUrl()}
              download="ransomware_audit_log.csv"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold tracking-wide transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Export Audit CSV</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};
