import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Layers
} from 'lucide-react';
import { DetectionEvent } from '../types';
import { SeverityBadge } from '../components/SeverityBadge';
import { api } from '../services/api';

interface LiveMonitoringPageProps {
  onSelectEvent: (event: DetectionEvent) => void;
}

export const LiveMonitoringPage: React.FC<LiveMonitoringPageProps> = ({ onSelectEvent }) => {
  const [events, setEvents] = useState<DetectionEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [predictionFilter, setPredictionFilter] = useState<string>('');
  const [simFilter, setSimFilter] = useState<string>('all');

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 100 };
      if (severityFilter) params.severity = severityFilter;
      if (predictionFilter) params.prediction = predictionFilter;
      if (simFilter === 'simulated') params.is_simulated = true;
      if (simFilter === 'real') params.is_simulated = false;

      const data = await api.getDetections(params);
      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [severityFilter, predictionFilter, simFilter]);

  const filteredEvents = events.filter((e) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      e.process_name.toLowerCase().includes(term) ||
      e.id.toLowerCase().includes(term) ||
      String(e.pid).includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="cyber-card p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-cyan-400" />
              Live Telemetry Stream & Heuristic Monitor
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time feed of system activity, file operations, entropy deltas, and model verdicts
            </p>
          </div>

          <button
            onClick={fetchEvents}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors self-start md:self-auto"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Stream
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-slate-800">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search process name or PID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* Severity Dropdown */}
          <div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 px-3 text-xs text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
              <option value="Informational">Informational</option>
            </select>
          </div>

          {/* Prediction Dropdown */}
          <div>
            <select
              value={predictionFilter}
              onChange={(e) => setPredictionFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 px-3 text-xs text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="">All Verdicts</option>
              <option value="Ransomware">Ransomware Only</option>
              <option value="Benign">Benign Only</option>
            </select>
          </div>

          {/* Simulation Filter */}
          <div>
            <select
              value={simFilter}
              onChange={(e) => setSimFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 px-3 text-xs text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="all">All Telemetry (Real + Simulated)</option>
              <option value="simulated">Simulated Events Only</option>
              <option value="real">Real / Host Detections Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="cyber-card overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-mono text-slate-400">
            Total Captured Events: <span className="text-white font-bold">{filteredEvents.length}</span>
          </span>
          <span className="text-[11px] text-slate-500 italic">
            Click any row for complete SHAP waterfall attribution breakdown
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 uppercase font-mono text-[11px] text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Process Name</th>
                <th className="py-3 px-4">PID</th>
                <th className="py-3 px-4">ML Verdict</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">Risk Score</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 font-sans">
                    {loading ? 'Fetching telemetry stream...' : 'No telemetry events match the filter parameters.'}
                  </td>
                </tr>
              ) : (
                filteredEvents.map((event) => {
                  const isR = event.is_ransomware;
                  return (
                    <tr
                      key={event.id}
                      onClick={() => onSelectEvent(event)}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4 font-sans font-semibold text-white">
                        {event.process_name}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {event.pid}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 font-bold ${isR ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {isR ? <ShieldAlert className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                          {event.prediction}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {(event.confidence * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${event.risk_score >= 80 ? 'text-rose-400' : event.risk_score >= 50 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {event.risk_score}
                          </span>
                          <div className="w-12 bg-slate-800 h-1.5 rounded-full overflow-hidden">
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
                      <td className="py-3 px-4 font-sans">
                        {event.is_simulated ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-500/30">
                            Simulated
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                            Host Feed
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-sans">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectEvent(event);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                        >
                          Details
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
