import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  AlertTriangle,
  Cpu,
  Target,
  ExternalLink,
  Flame,
  ArrowRight
} from 'lucide-react';
import { DashboardSummary, DetectionEvent } from '../types';
import { StatCard } from '../components/StatCard';
import { SeverityBadge } from '../components/SeverityBadge';
import { TrendsChart } from '../charts/TrendsChart';

interface OverviewPageProps {
  summary: DashboardSummary | null;
  onSelectEvent: (event: DetectionEvent) => void;
  onNavigateToAlerts: () => void;
  onNavigateToSimulation: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  summary,
  onSelectEvent,
  onNavigateToAlerts,
  onNavigateToSimulation
}) => {
  if (!summary) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <Activity className="h-5 w-5 animate-spin text-cyan-400" />
          <span>Synchronizing SOC Telemetry...</span>
        </div>
      </div>
    );
  }

  const criticalCount = summary.critical_alerts_count;
  const highCount = summary.high_alerts_count;

  return (
    <div className="space-y-6">
      {/* Urgent Alert Banner (if critical alerts exist) */}
      {(criticalCount > 0 || highCount > 0) && (
        <div className="relative overflow-hidden rounded-xl border border-rose-500/40 bg-gradient-to-r from-rose-950/60 via-slate-900/80 to-slate-900/60 p-4 shadow-[0_0_25px_rgba(244,63,94,0.15)] backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Active Threat Incursions Detected
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500 text-white font-bold">
                    {criticalCount} CRITICAL • {highCount} HIGH
                  </span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Automated behavioral heuristic flags indicate active file encryption bursts or canary tampering.
                </p>
              </div>
            </div>

            <button
              onClick={onNavigateToAlerts}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white shadow-lg transition-colors whitespace-nowrap"
            >
              Triage Incident Alerts
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Telemetry Events"
          value={summary.total_events.toLocaleString()}
          subtitle="Monitored Endpoint Operations"
          icon={<Activity className="h-5 w-5" />}
          accent="cyan"
        />
        <StatCard
          title="Ransomware Detections"
          value={summary.ransomware_count.toLocaleString()}
          subtitle="High-Entropy & Burst Attacks"
          icon={<ShieldAlert className="h-5 w-5" />}
          accent="rose"
        />
        <StatCard
          title="Benign Processes"
          value={summary.benign_count.toLocaleString()}
          subtitle="Office, Builds & Normal OS"
          icon={<ShieldCheck className="h-5 w-5" />}
          accent="emerald"
        />
        <StatCard
          title="Active Alerts"
          value={summary.active_alerts_count}
          subtitle={`${summary.critical_alerts_count} Critical • ${summary.high_alerts_count} High`}
          icon={<AlertTriangle className="h-5 w-5" />}
          accent="amber"
        />
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="cyber-card p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Model Recall (Detection)</p>
            <p className="text-2xl font-black text-cyan-400 mt-1">{(summary.recall * 100).toFixed(1)}%</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Held-out test set accuracy {(summary.accuracy * 100).toFixed(1)}%</p>
          </div>
          <div className="p-3 rounded-lg bg-cyan-950/50 border border-cyan-500/20 text-cyan-400">
            <Target className="h-5 w-5" />
          </div>
        </div>

        <div className="cyber-card p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Champion Algorithm</p>
            <p className="text-2xl font-black text-purple-400 mt-1">{summary.champion_model}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">TreeSHAP Explainable Ensemble</p>
          </div>
          <div className="p-3 rounded-lg bg-purple-950/50 border border-purple-500/20 text-purple-400">
            <Cpu className="h-5 w-5" />
          </div>
        </div>

        <div className="cyber-card p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Simulation Sandbox</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">Ready</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Safe synthetic ransomware attack testing</p>
          </div>
          <button
            onClick={onNavigateToSimulation}
            className="px-3 py-2 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-colors"
          >
            Launch Test
          </button>
        </div>
      </div>

      {/* Charts Section */}
      <div className="cyber-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-400" />
              Chronological Threat Stream Activity
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live telemetry volume comparing benign activity against ransomware surges
            </p>
          </div>
        </div>
        <TrendsChart data={summary.timeline_trends} />
      </div>

      {/* Recent Telemetry Stream Table */}
      <div className="cyber-card overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Recent Monitored Telemetry Events
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any event row to inspect full SHAP attributions and behavioral feature values
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Displaying Top {summary.recent_events.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 uppercase font-mono text-[11px] text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Process / PID</th>
                <th className="py-3 px-4">Prediction</th>
                <th className="py-3 px-4">Risk Score</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Key Behavioral Indicator</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {summary.recent_events.map((event) => {
                const isR = event.is_ransomware;
                return (
                  <tr
                    key={event.id}
                    onClick={() => onSelectEvent(event)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-sans">
                      <div className="font-semibold text-white flex items-center gap-2">
                        {event.process_name}
                        {event.is_simulated && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-amber-400 border border-amber-500/30">
                            SIM
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">PID: {event.pid}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 font-bold ${isR ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {isR ? <ShieldAlert className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                        {event.prediction}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${event.risk_score >= 80 ? 'text-rose-400' : event.risk_score >= 50 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {event.risk_score}
                        </span>
                        <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${event.risk_score >= 80 ? 'bg-rose-500' : event.risk_score >= 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${event.risk_score}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <SeverityBadge severity={event.severity} size="sm" />
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-300 max-w-xs truncate">
                      {event.explanation_summary || 'Normal operation pattern'}
                    </td>
                    <td className="py-3 px-4 text-right font-sans">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEvent(event);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                      >
                        Inspect
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
