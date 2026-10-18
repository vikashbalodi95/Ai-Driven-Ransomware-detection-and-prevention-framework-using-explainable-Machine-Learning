import React from 'react';
import {
  X,
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Clock,
  Terminal,
  FileCode,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';
import { DetectionEvent } from '../types';
import { SeverityBadge } from './SeverityBadge';
import { ShapWaterfallChart } from '../charts/ShapWaterfallChart';

interface DetectionDetailModalProps {
  event: DetectionEvent | null;
  onClose: () => void;
  onAcknowledgeAlert?: (eventId: string) => void;
}

export const DetectionDetailModal: React.FC<DetectionDetailModalProps> = ({
  event,
  onClose,
  onAcknowledgeAlert
}) => {
  if (!event) return null;

  const isRansom = event.is_ransomware;
  const explanation = event.explanation;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl text-slate-100">
        {/* Top Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isRansom ? 'border-rose-900/50 bg-rose-950/20' : 'border-emerald-900/50 bg-emerald-950/20'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl border ${isRansom ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.3)]' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'}`}>
              {isRansom ? <ShieldAlert className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold tracking-tight text-white">
                  {event.process_name}
                </h2>
                <SeverityBadge severity={event.severity} size="sm" />
                {event.is_simulated && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-950/60 text-amber-300 border border-amber-500/40">
                    SIMULATED
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                Event ID: {event.id} • PID: {event.pid} • {new Date(event.timestamp).toLocaleString()}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Verdict and Risk Score Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-xl border ${isRansom ? 'bg-rose-950/30 border-rose-500/30' : 'bg-emerald-950/30 border-emerald-500/30'} flex flex-col justify-center`}>
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Prediction Verdict</span>
              <span className={`text-2xl font-black mt-1 ${isRansom ? 'text-rose-400' : 'text-emerald-400'}`}>
                {event.prediction.toUpperCase()}
              </span>
              <span className="text-xs text-slate-400 mt-1 font-mono">
                Model Confidence: {(event.confidence * 100).toFixed(1)}%
              </span>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col justify-center">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Risk Score</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-3xl font-black ${event.risk_score >= 80 ? 'text-rose-400' : event.risk_score >= 50 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {event.risk_score}
                </span>
                <span className="text-slate-500 font-mono text-sm">/ 100</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className={`h-full ${event.risk_score >= 80 ? 'bg-rose-500' : event.risk_score >= 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${event.risk_score}%` }}
                />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col justify-center">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Severity Tier</span>
              <span className="text-2xl font-black text-white mt-1">
                {event.severity}
              </span>
              <span className="text-xs text-slate-400 mt-1">
                {isRansom ? 'Incident Response Action Required' : 'Normal Baseline Activity'}
              </span>
            </div>
          </div>

          {/* Plain-English AI Explanation Narrative */}
          <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-5 shadow-lg">
            <div className="flex items-center gap-2 mb-2 text-cyan-400">
              <Terminal className="h-4 w-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Explainable AI (XAI) Synthesis</h3>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-normal">
              {explanation?.plain_english_explanation || event.explanation_summary || 'Analysis in progress...'}
            </p>
          </div>

          {/* SHAP Waterfall / Attribution Chart */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-cyan-400" />
                  SHAP Local Feature Attribution
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Visualizes exact Shapley values pushing prediction toward Ransomware (+SHAP) vs Benign (-SHAP)
                </p>
              </div>
              {explanation?.base_value !== undefined && (
                <span className="text-xs font-mono text-slate-400">
                  Base (Expected) Value: <span className="text-white font-bold">{explanation.base_value}</span>
                </span>
              )}
            </div>

            {explanation?.contributions ? (
              <ShapWaterfallChart contributions={explanation.contributions} />
            ) : (
              <div className="text-center py-8 text-slate-500 text-xs">No local attribution metrics recorded.</div>
            )}
          </div>

          {/* Observed Feature Values Table */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <FileCode className="h-4 w-4 text-cyan-400" />
              Observed Behavioral Telemetry vs Normal Baseline
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {Object.entries(event.features).map(([key, val]) => {
                const isTripped = (key === 'canary_file_modified' || key === 'shadow_copy_access_attempt' || key === 'ransom_note_detected') && val === 1;
                return (
                  <div
                    key={key}
                    className={`flex items-center justify-between p-2.5 rounded-lg border ${isTripped ? 'border-rose-500/50 bg-rose-950/30' : 'border-slate-800/80 bg-slate-900/60'}`}
                  >
                    <span className="text-slate-400 capitalize">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span className={`font-mono font-bold ${isTripped ? 'text-rose-400' : 'text-slate-200'}`}>
                      {typeof val === 'number' ? val.toLocaleString() : String(val)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-800 bg-slate-950/40">
          <span className="text-xs text-slate-500 font-mono">
            Model Engine: XGBoost / RansomGuard-XAI v1.0.0
          </span>
          <div className="flex items-center gap-3">
            {isRansom && onAcknowledgeAlert && (
              <button
                onClick={() => {
                  onAcknowledgeAlert(event.id);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white shadow-lg transition-colors"
              >
                <CheckCircle2 className="h-4 w-4" />
                Acknowledge Alert
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              Close Inspector
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
