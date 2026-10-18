import React, { useState, useEffect } from 'react';
import {
  Shield,
  Cpu,
  Layers,
  Database,
  CheckCircle2,
  AlertCircle,
  FileText,
  Activity
} from 'lucide-react';
import { ModelInfo } from '../types';
import { api } from '../services/api';

export const ModelInfoPage: React.FC = () => {
  const [info, setInfo] = useState<ModelInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadInfo() {
      try {
        setLoading(true);
        const data = await api.getModelInfo();
        setInfo(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadInfo();
  }, []);

  const featureCatalog = [
    { name: 'file_modification_rate', unit: 'files/sec', desc: 'Frequency of file write and update operations within sliding temporal window', benign: '0.0 - 5.0', attack: '25.0 - 350.0' },
    { name: 'file_rename_rate', unit: 'files/sec', desc: 'Frequency of rename/move calls (mass file extension mutation pattern)', benign: '0.0 - 1.0', attack: '15.0 - 250.0' },
    { name: 'entropy_change_mean', unit: 'Delta H (bits/byte)', desc: 'Mean Shannon entropy differential between original and modified file blocks', benign: '-0.5 - 0.8', attack: '2.2 - 4.2' },
    { name: 'suspicious_extension_ratio', unit: 'ratio (0-1)', desc: 'Proportion of modified files matching known ransom extensions or high-entropy suffixes', benign: '0.0', attack: '0.45 - 1.0' },
    { name: 'directory_traversal_depth', unit: 'nesting levels', desc: 'Maximum folder traversal depth observed during mass file access', benign: '1 - 4', attack: '5 - 16' },
    { name: 'rapid_file_deletion_rate', unit: 'files/sec', desc: 'Rate of unlinking/deleting original plaintexts following encryption', benign: '0.0 - 0.5', attack: '5.0 - 120.0' },
    { name: 'process_cpu_usage_burst', unit: '% CPU', desc: 'Spike in processor utilization during un-throttled cryptographic loop execution', benign: '1.0 - 35.0', attack: '65.0 - 100.0' },
    { name: 'canary_file_modified', unit: 'binary flag (0/1)', desc: 'Tampering detected in hidden decoy canary files deployed across user directories', benign: '0', attack: '1' },
    { name: 'shadow_copy_access_attempt', unit: 'binary flag (0/1)', desc: 'Tampering with Volume Shadow Copies (e.g., vssadmin delete shadows, bcdedit)', benign: '0', attack: '1' },
    { name: 'ransom_note_detected', unit: 'binary flag (0/1)', desc: 'Creation of payment demand text/HTML files (HOW_TO_DECRYPT, README_RESTORE)', benign: '0', attack: '1' },
    { name: 'file_read_to_write_ratio', unit: 'ratio', desc: 'Symmetry of bytes read vs written (ransomware read/encrypt/write approaches 1.0)', benign: '0.05 - 4.5', attack: '0.88 - 1.15' },
    { name: 'unique_file_extensions_accessed', unit: 'distinct count', desc: 'Diversity of targeted extensions touched (.docx, .pdf, .xlsx, .db, .jpg)', benign: '1 - 4', attack: '8 - 30' }
  ];

  if (!info) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Activity className="h-5 w-5 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="cyber-card p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Cpu className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              {info.model_name} Specification & Architecture
            </h2>
            <p className="text-xs text-slate-400">
              Version {info.version} • Algorithm: <span className="text-cyan-400 font-bold">{info.algorithm}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Dataset & Training Specs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="cyber-card p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase">Training Samples</p>
          <p className="text-2xl font-black text-white mt-1">{info.training_samples.toLocaleString()}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">70% Stratified Split</p>
        </div>

        <div className="cyber-card p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase">Validation Samples</p>
          <p className="text-2xl font-black text-white mt-1">{info.validation_samples.toLocaleString()}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">15% Model Selection Split</p>
        </div>

        <div className="cyber-card p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase">Test Samples (Held-Out)</p>
          <p className="text-2xl font-black text-white mt-1">{info.test_samples.toLocaleString()}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">15% Zero-Leakage Test</p>
        </div>

        <div className="cyber-card p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase">Feature Vector Size</p>
          <p className="text-2xl font-black text-cyan-400 mt-1">{info.feature_count} Features</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Behavioral Indicators</p>
        </div>
      </div>

      {/* Feature Catalog Table */}
      <div className="cyber-card overflow-hidden">
        <div className="p-5 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="h-4 w-4 text-cyan-400" />
            Behavioral Telemetry Feature Catalog
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Calibrated behavioral indicators derived from empirical ransomware literature (CryptoDrop, RansomWatch, ShieldFS)
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 uppercase font-mono text-[11px] text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Feature Name</th>
                <th className="py-3 px-4">Metric Unit</th>
                <th className="py-3 px-4">Behavioral Description</th>
                <th className="py-3 px-4 text-emerald-400">Normal Range</th>
                <th className="py-3 px-4 text-rose-400">Ransomware Range</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {featureCatalog.map((feat) => (
                <tr key={feat.name} className="hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-bold text-white font-sans">{feat.name}</td>
                  <td className="py-3 px-4 text-cyan-300">{feat.unit}</td>
                  <td className="py-3 px-4 font-sans text-slate-300 max-w-sm">{feat.desc}</td>
                  <td className="py-3 px-4 text-emerald-400 font-semibold">{feat.benign}</td>
                  <td className="py-3 px-4 text-rose-400 font-semibold">{feat.attack}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Academic Limitations & Transparency */}
      <div className="cyber-card p-6 border-amber-500/20 bg-amber-950/10">
        <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-400" />
          Academic Rigor & Known Limitations
        </h3>
        <ul className="space-y-2 text-xs text-slate-300 leading-relaxed list-disc list-inside">
          {info.limitations.map((lim, idx) => (
            <li key={idx}>
              <span className="text-slate-200">{lim}</span>
            </li>
          ))}
          <li>
            <span className="text-slate-200">
              <strong>SHAP Attribution vs Legal Causality:</strong> SHAP values explain how the machine learning model weighed input features to reach its classification score. They describe model behavior rather than establishing legal or forensic proof of malicious intent.
            </span>
          </li>
          <li>
            <span className="text-slate-200">
              <strong>Low-and-Slow Attack Evasion:</strong> Advanced ransomware executing intermittent delay loops (e.g. 1 file modification every 10 minutes) requires temporal aggregation windows wider than short real-time intervals.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};
