import React, { useState, useEffect } from 'react';
import {
  PlayCircle,
  StopCircle,
  Terminal,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Briefcase,
  Code2,
  ExternalLink,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { SimulationStatus, SimulationLog, DetectionEvent } from '../types';
import { SeverityBadge } from '../components/SeverityBadge';
import { api } from '../services/api';

interface SimulationPageProps {
  onSelectEventId: (eventId: string) => void;
}

export const SimulationPage: React.FC<SimulationPageProps> = ({ onSelectEventId }) => {
  const [status, setStatus] = useState<SimulationStatus>({
    is_running: false,
    events_generated: 0,
    suspicious_count: 0,
    message: 'Simulation Idle'
  });

  const [selectedScenario, setSelectedScenario] = useState<string>('fast_ransomware');
  const [eventCount, setEventCount] = useState<number>(8);
  const [intervalSec, setIntervalSec] = useState<number>(0.8);
  const [logs, setLogs] = useState<SimulationLog[]>([]);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Poll status & logs during simulation
  useEffect(() => {
    let timer: any = null;

    async function checkStatus() {
      try {
        const s = await api.getSimulationStatus();
        setStatus(s);
        if (s.is_running) {
          const l = await api.getSimulationLogs();
          setLogs(l);
        }
      } catch (err) {
        console.error(err);
      }
    }

    checkStatus();
    timer = setInterval(checkStatus, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleStart = async () => {
    try {
      setActionLoading(true);
      await api.startSimulation(selectedScenario, eventCount, intervalSec);
      const s = await api.getSimulationStatus();
      setStatus(s);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStop = async () => {
    try {
      setActionLoading(true);
      await api.stopSimulation();
      const s = await api.getSimulationStatus();
      setStatus(s);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const scenarios = [
    {
      id: 'fast_ransomware',
      title: 'Aggressive Crypto-Ransomware',
      subtitle: 'LockBit 3.0 / WannaCry Outbreak Burst',
      icon: <Flame className="h-5 w-5 text-rose-400" />,
      desc: 'Simulates rapid directory crawling, high file rename frequency, entropy surges (>3.5 Delta H), canary file triggering, and VSS shadow copy deletion.',
      expected: 'Ransomware (Risk 90-100, Critical)',
      color: 'border-rose-500/40 bg-rose-950/20'
    },
    {
      id: 'stealthy_ransomware',
      title: 'Stealthy Low-and-Slow Ransomware',
      subtitle: 'Conti / Dharma Evasion Maneuver',
      icon: <AlertTriangle className="h-5 w-5 text-amber-400" />,
      desc: 'Simulates moderate file modification rates, intermittent renaming, encrypted file drops, and ransom note creation designed to bypass naive threshold alerts.',
      expected: 'Ransomware (Risk 70-85, High)',
      color: 'border-amber-500/40 bg-amber-950/20'
    },
    {
      id: 'benign_developer',
      title: 'Benign Developer Build & Compile',
      subtitle: 'Rust Cargo / Node / Git Checkout Burst',
      icon: <Code2 className="h-5 w-5 text-cyan-400" />,
      desc: 'Simulates heavy compilation workloads: rapid object file writes, compiler CPU spikes (75-90%), but 0 ransom notes, 0 suspicious extensions, and untouched canaries.',
      expected: 'Benign (Risk 5-25, Informational)',
      color: 'border-cyan-500/40 bg-cyan-950/20'
    },
    {
      id: 'benign_office',
      title: 'Benign Office Productivity',
      subtitle: 'Word, Excel & OneDrive Cloud Sync',
      icon: <Briefcase className="h-5 w-5 text-emerald-400" />,
      desc: 'Simulates typical corporate workstation activity: document autosaves, small spreadsheets, low entropy variance, and zero extension alterations.',
      expected: 'Benign (Risk 0-10, Informational)',
      color: 'border-emerald-500/40 bg-emerald-950/20'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Disclaimer / Safety Banner */}
      <div className="cyber-card p-4 border-emerald-500/30 bg-emerald-950/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
          <p className="text-xs text-emerald-200">
            <strong>Safe Synthetic Sandbox:</strong> This simulation generates behavioral telemetry vectors without executing live malware or harming system files. Every simulated event passes directly through the real ML inference engine and SHAP TreeExplainer.
          </p>
        </div>
        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-bold">
          Zero Host Risk
        </span>
      </div>

      {/* Scenario Picker */}
      <div className="cyber-card p-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <PlayCircle className="h-4 w-4 text-cyan-400" />
          Select Demonstration Attack / Benign Scenario
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scenarios.map((sc) => {
            const isSelected = selectedScenario === sc.id;
            return (
              <div
                key={sc.id}
                onClick={() => !status.is_running && setSelectedScenario(sc.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${sc.color} ${
                  isSelected
                    ? 'ring-2 ring-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-700">
                      {sc.icon}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{sc.title}</h4>
                      <p className="text-[11px] text-slate-400 font-medium">{sc.subtitle}</p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="scenario"
                    checked={isSelected}
                    onChange={() => setSelectedScenario(sc.id)}
                    className="h-4 w-4 accent-cyan-400"
                  />
                </div>

                <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                  {sc.desc}
                </p>

                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Target Verdict:</span>
                  <span className="font-mono font-bold text-white">{sc.expected}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Controls Bar */}
        <div className="mt-6 pt-6 border-t border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-6 text-xs">
            <div>
              <span className="text-slate-400 font-semibold block mb-1">
                Event Count: <strong className="text-white font-mono">{eventCount} events</strong>
              </span>
              <input
                type="range"
                min="3"
                max="25"
                step="1"
                disabled={status.is_running}
                value={eventCount}
                onChange={(e) => setEventCount(parseInt(e.target.value))}
                className="w-36 accent-cyan-400"
              />
            </div>

            <div>
              <span className="text-slate-400 font-semibold block mb-1">
                Emission Interval: <strong className="text-white font-mono">{intervalSec}s</strong>
              </span>
              <input
                type="range"
                min="0.3"
                max="2.0"
                step="0.1"
                disabled={status.is_running}
                value={intervalSec}
                onChange={(e) => setIntervalSec(parseFloat(e.target.value))}
                className="w-36 accent-cyan-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {status.is_running ? (
              <button
                onClick={handleStop}
                disabled={actionLoading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white shadow-lg transition-all"
              >
                <StopCircle className="h-4 w-4" />
                Halt Simulation
              </button>
            ) : (
              <button
                onClick={handleStart}
                disabled={actionLoading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white shadow-lg transition-all"
              >
                <PlayCircle className="h-4 w-4" />
                Launch Simulation Sandbox
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Live Simulation Terminal Stream */}
      <div className="cyber-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Live Terminal Event Stream & Inference Verdicts
            </h3>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className={`flex items-center gap-1.5 ${status.is_running ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`}>
              <span className={`h-2 w-2 rounded-full ${status.is_running ? 'bg-emerald-400' : 'bg-slate-600'}`} />
              {status.is_running ? 'RUNNING' : 'IDLE'}
            </span>
            <span className="text-slate-400">
              Generated: <strong className="text-white">{status.events_generated}</strong>
            </span>
            <span className="text-rose-400">
              Suspicious: <strong className="text-rose-400">{status.suspicious_count}</strong>
            </span>
          </div>
        </div>

        {/* Terminal Output Window */}
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs max-h-96 overflow-y-auto space-y-2">
          {logs.length === 0 ? (
            <div className="text-slate-500 text-center py-8 font-sans text-xs">
              Simulation terminal ready. Select a scenario above and click "Launch Simulation Sandbox" to stream live events.
            </div>
          ) : (
            logs.map((log) => {
              const isR = log.prediction === 'Ransomware';
              return (
                <div
                  key={log.event_id}
                  className={`p-3 rounded-lg border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                    isR
                      ? 'border-rose-500/30 bg-rose-950/20 text-rose-200'
                      : 'border-emerald-500/20 bg-emerald-950/10 text-emerald-200'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-2">
                    <span className="text-slate-500 font-bold">#{log.step}</span>
                    <span className="text-slate-400 text-[11px]">[{log.timestamp}]</span>
                    <span className="font-bold text-white font-sans">{log.process_name}</span>
                    <span className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${isR ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'}`}>
                      {log.prediction}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      Risk: <strong className={isR ? 'text-rose-400' : 'text-emerald-400'}>{log.risk_score}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span className="text-[11px] text-slate-400 truncate max-w-xs hidden md:inline">
                      {log.explanation_summary}
                    </span>
                    <button
                      onClick={() => onSelectEventId(log.event_id)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-sans font-medium flex items-center gap-1 transition-colors"
                    >
                      XAI <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
