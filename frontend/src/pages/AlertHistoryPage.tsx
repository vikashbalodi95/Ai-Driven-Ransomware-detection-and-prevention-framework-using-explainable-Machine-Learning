import React, { useState, useEffect } from 'react';
import {
  BellRing,
  CheckCircle2,
  Clock,
  Search,
  ExternalLink,
  MessageSquare,
  ShieldAlert,
  Download,
  RefreshCw
} from 'lucide-react';
import { Alert, DetectionEvent } from '../types';
import { SeverityBadge } from '../components/SeverityBadge';
import { api } from '../services/api';

interface AlertHistoryPageProps {
  onSelectEventId: (eventId: string) => void;
}

export const AlertHistoryPage: React.FC<AlertHistoryPageProps> = ({ onSelectEventId }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [selectedAlertForNote, setSelectedAlertForNote] = useState<Alert | null>(null);
  const [noteText, setNoteText] = useState<string>('');
  const [updating, setUpdating] = useState<boolean>(false);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const data = await api.getAlerts({
        status: statusFilter || undefined,
        severity: severityFilter || undefined
      });
      setAlerts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [statusFilter, severityFilter]);

  const handleStatusChange = async (alertId: string, newStatus: string) => {
    try {
      await api.updateAlert(alertId, { status: newStatus });
      fetchAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveNote = async () => {
    if (!selectedAlertForNote) return;
    try {
      setUpdating(true);
      await api.updateAlert(selectedAlertForNote.id, {
        analyst_notes: noteText
      });
      setSelectedAlertForNote(null);
      fetchAlerts();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="cyber-card p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BellRing className="h-5 w-5 text-rose-400" />
              Security Incident Alert Management & Audit Trail
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Auditable log of detected behavioral anomalies requiring Security Operations triage and response
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={api.getExportCsvUrl()}
              download="ransomware_alerts_audit.csv"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-cyan-400" />
              Download Audit CSV
            </a>
            <button
              onClick={fetchAlerts}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="mt-4 flex flex-wrap items-center gap-3 pt-4 border-t border-slate-800 text-xs">
          <span className="text-slate-400 font-semibold">Triage Status:</span>
          {['', 'NEW', 'ACKNOWLEDGED', 'INVESTIGATING', 'RESOLVED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-lg border font-mono transition-colors ${
                statusFilter === st
                  ? 'border-cyan-500 bg-cyan-950/60 text-cyan-300 font-bold'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
              }`}
            >
              {st === '' ? 'ALL' : st}
            </button>
          ))}

          <span className="text-slate-400 font-semibold ml-4">Severity:</span>
          {['', 'Critical', 'High', 'Medium'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-2.5 py-1 rounded-lg border font-mono transition-colors ${
                severityFilter === sev
                  ? 'border-rose-500 bg-rose-950/60 text-rose-300 font-bold'
                  : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
              }`}
            >
              {sev === '' ? 'ALL' : sev}
            </button>
          ))}
        </div>
      </div>

      {/* Alert Cards / Table */}
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="cyber-card p-12 text-center text-slate-500 text-xs">
            {loading ? 'Loading incident alerts...' : 'No security alerts matching the current filter.'}
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`cyber-card p-4 transition-all duration-150 border-l-4 ${
                alert.severity === 'Critical'
                  ? 'border-l-rose-500 bg-rose-950/10'
                  : alert.severity === 'High'
                  ? 'border-l-orange-500 bg-orange-950/10'
                  : 'border-l-amber-500 bg-amber-950/10'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl border mt-0.5 ${alert.severity === 'Critical' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' : 'bg-amber-500/20 text-amber-400 border-amber-500/40'}`}>
                    <ShieldAlert className="h-5 w-5" />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-white">
                        {alert.process_name || 'Suspicious Process'}
                      </span>
                      <SeverityBadge severity={alert.severity} size="sm" />
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${
                        alert.status === 'NEW'
                          ? 'bg-rose-950/80 text-rose-300 border-rose-500/40 animate-pulse'
                          : alert.status === 'ACKNOWLEDGED'
                          ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                          : alert.status === 'INVESTIGATING'
                          ? 'bg-blue-950/80 text-blue-300 border-blue-500/40'
                          : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                      }`}>
                        {alert.status}
                      </span>
                      {alert.is_simulated && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-amber-400 border border-amber-500/30">
                          SIM
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                      {alert.analyst_notes || 'Automated behavioral threat alert awaiting analyst investigation.'}
                    </p>

                    <p className="text-[11px] text-slate-500 mt-1 font-mono">
                      Created: {new Date(alert.created_at).toLocaleString()} • Event ID: {alert.event_id}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 self-start md:self-auto text-xs">
                  <button
                    onClick={() => onSelectEventId(alert.event_id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition-colors"
                  >
                    View XAI
                    <ExternalLink className="h-3 w-3" />
                  </button>

                  <button
                    onClick={() => {
                      setSelectedAlertForNote(alert);
                      setNoteText(alert.analyst_notes || '');
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition-colors"
                  >
                    <MessageSquare className="h-3 w-3 text-cyan-400" />
                    Note
                  </button>

                  {/* Status buttons */}
                  {alert.status !== 'ACKNOWLEDGED' && alert.status !== 'RESOLVED' && (
                    <button
                      onClick={() => handleStatusChange(alert.id, 'ACKNOWLEDGED')}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900 border border-amber-500/40 text-amber-300 font-semibold transition-colors"
                    >
                      Acknowledge
                    </button>
                  )}
                  {alert.status !== 'INVESTIGATING' && alert.status !== 'RESOLVED' && (
                    <button
                      onClick={() => handleStatusChange(alert.id, 'INVESTIGATING')}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-950/60 hover:bg-blue-900 border border-blue-500/40 text-blue-300 font-semibold transition-colors"
                    >
                      Investigate
                    </button>
                  )}
                  {alert.status !== 'RESOLVED' && (
                    <button
                      onClick={() => handleStatusChange(alert.id, 'RESOLVED')}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 font-semibold transition-colors"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Note Edit Modal */}
      {selectedAlertForNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 text-slate-100 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-cyan-400" />
              Analyst Incident Triage Notes
            </h3>
            <p className="text-xs text-slate-400">
              Document containment actions, host isolation status, or false positive determinations for Alert ID: {selectedAlertForNote.id}
            </p>

            <textarea
              rows={4}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="e.g. Host quarantined via EDR. Canary tripped by encrypted test script..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSelectedAlertForNote(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNote}
                disabled={updating}
                className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg"
              >
                {updating ? 'Saving...' : 'Save Note'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
