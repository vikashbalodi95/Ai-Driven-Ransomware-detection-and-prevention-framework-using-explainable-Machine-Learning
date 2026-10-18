import React, { useState, useEffect } from 'react';
import {
  Cpu,
  BarChart2,
  Sliders,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  FileText,
  Play
} from 'lucide-react';
import { ModelMetrics, DetectionEvent } from '../types';
import { api } from '../services/api';
import { FeatureImportanceChart } from '../charts/FeatureImportanceChart';
import { ConfusionMatrixChart } from '../charts/ConfusionMatrixChart';
import { ShapWaterfallChart } from '../charts/ShapWaterfallChart';

export const ExplainabilityPage: React.FC = () => {
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Interactive Live What-If Test Sandbox State
  const [testFeatures, setTestFeatures] = useState({
    file_modification_rate: 140.0,
    file_rename_rate: 95.0,
    entropy_change_mean: 3.25,
    suspicious_extension_ratio: 0.85,
    directory_traversal_depth: 8,
    rapid_file_deletion_rate: 35.0,
    process_cpu_usage_burst: 88.0,
    canary_file_modified: 1,
    shadow_copy_access_attempt: 1,
    ransom_note_detected: 1,
    file_read_to_write_ratio: 1.02,
    unique_file_extensions_accessed: 18
  });

  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<DetectionEvent | null>(null);

  useEffect(() => {
    async function loadMetrics() {
      try {
        setLoading(true);
        const data = await api.getModelMetrics();
        setMetrics(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadMetrics();
  }, []);

  const runWhatIfAnalysis = async () => {
    try {
      setAnalyzing(true);
      const res = await api.analyzeTelemetry({
        process_name: 'sandbox_evaluator.exe',
        pid: 7777,
        is_simulated: true,
        ...testFeatures
      });
      setTestResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const setPreset = (type: 'benign' | 'wannacry' | 'lockbit' | 'stealthy') => {
    if (type === 'benign') {
      setTestFeatures({
        file_modification_rate: 1.2,
        file_rename_rate: 0.1,
        entropy_change_mean: 0.05,
        suspicious_extension_ratio: 0.0,
        directory_traversal_depth: 2,
        rapid_file_deletion_rate: 0.02,
        process_cpu_usage_burst: 12.0,
        canary_file_modified: 0,
        shadow_copy_access_attempt: 0,
        ransom_note_detected: 0,
        file_read_to_write_ratio: 1.2,
        unique_file_extensions_accessed: 2
      });
    } else if (type === 'wannacry') {
      setTestFeatures({
        file_modification_rate: 195.0,
        file_rename_rate: 140.0,
        entropy_change_mean: 3.75,
        suspicious_extension_ratio: 0.95,
        directory_traversal_depth: 10,
        rapid_file_deletion_rate: 48.0,
        process_cpu_usage_burst: 94.0,
        canary_file_modified: 1,
        shadow_copy_access_attempt: 1,
        ransom_note_detected: 1,
        file_read_to_write_ratio: 1.01,
        unique_file_extensions_accessed: 24
      });
    } else if (type === 'lockbit') {
      setTestFeatures({
        file_modification_rate: 260.0,
        file_rename_rate: 210.0,
        entropy_change_mean: 3.90,
        suspicious_extension_ratio: 0.98,
        directory_traversal_depth: 14,
        rapid_file_deletion_rate: 75.0,
        process_cpu_usage_burst: 98.0,
        canary_file_modified: 1,
        shadow_copy_access_attempt: 1,
        ransom_note_detected: 1,
        file_read_to_write_ratio: 0.99,
        unique_file_extensions_accessed: 26
      });
    } else {
      setTestFeatures({
        file_modification_rate: 28.0,
        file_rename_rate: 18.0,
        entropy_change_mean: 2.15,
        suspicious_extension_ratio: 0.45,
        directory_traversal_depth: 5,
        rapid_file_deletion_rate: 4.5,
        process_cpu_usage_burst: 45.0,
        canary_file_modified: 0,
        shadow_copy_access_attempt: 0,
        ransom_note_detected: 1,
        file_read_to_write_ratio: 1.08,
        unique_file_extensions_accessed: 9
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Overview Intro Card */}
      <div className="cyber-card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Cpu className="h-6 w-6 text-cyan-400" />
              Explainable AI (XAI) Center: SHAP TreeExplainer
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              TreeSHAP calculates exact, mathematically sound Shapley values from cooperative game theory.
              Instead of treating the ML classifier as an opaque black-box, each prediction decomposes into
              interpretable feature attributions that explain exactly why a behavioral pattern was classified as ransomware or benign.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-cyan-300">
            Champion Model: <span className="font-bold text-white">{metrics?.champion_model || 'XGBoost'}</span>
          </div>
        </div>
      </div>

      {/* Global Feature Importance Chart */}
      <div className="cyber-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-cyan-400" />
              Global Behavioral Feature Importance (Mean |SHAP|)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Identifies which behavioral telemetry features have the greatest impact across the entire dataset
            </p>
          </div>
        </div>
        {metrics && <FeatureImportanceChart importances={metrics.global_feature_importance} />}
      </div>

      {/* Interactive What-If XAI Testing Sandbox */}
      <div className="cyber-card p-6 border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.05)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="h-5 w-5 text-cyan-400" />
              Interactive "What-If" Predictor & Local SHAP Inspector
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Adjust any behavioral parameters below or select an attack archetype to trigger live ML inference and SHAP decomposition
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold mr-1">Presets:</span>
            <button
              onClick={() => setPreset('benign')}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 text-xs font-semibold"
            >
              Benign Normal
            </button>
            <button
              onClick={() => setPreset('wannacry')}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-rose-400 border border-rose-500/30 text-xs font-semibold"
            >
              WannaCry Burst
            </button>
            <button
              onClick={() => setPreset('lockbit')}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-rose-400 border border-rose-500/30 text-xs font-semibold"
            >
              LockBit 3.0 Aggressive
            </button>
            <button
              onClick={() => setPreset('stealthy')}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 text-xs font-semibold"
            >
              Low & Slow Evasion
            </button>
          </div>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
          {/* Col 1 */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">File Modification Rate</span>
                <span className="font-mono text-cyan-400 font-bold">{testFeatures.file_modification_rate} files/s</span>
              </div>
              <input
                type="range"
                min="0"
                max="350"
                step="1"
                value={testFeatures.file_modification_rate}
                onChange={(e) => setTestFeatures({ ...testFeatures, file_modification_rate: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">File Rename Rate</span>
                <span className="font-mono text-cyan-400 font-bold">{testFeatures.file_rename_rate} files/s</span>
              </div>
              <input
                type="range"
                min="0"
                max="250"
                step="1"
                value={testFeatures.file_rename_rate}
                onChange={(e) => setTestFeatures({ ...testFeatures, file_rename_rate: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Entropy Change Mean (Delta H)</span>
                <span className="font-mono text-cyan-400 font-bold">+{testFeatures.entropy_change_mean} bits</span>
              </div>
              <input
                type="range"
                min="-0.5"
                max="4.5"
                step="0.05"
                value={testFeatures.entropy_change_mean}
                onChange={(e) => setTestFeatures({ ...testFeatures, entropy_change_mean: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Suspicious Extension Ratio</span>
                <span className="font-mono text-cyan-400 font-bold">{testFeatures.suspicious_extension_ratio}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1.0"
                step="0.02"
                value={testFeatures.suspicious_extension_ratio}
                onChange={(e) => setTestFeatures({ ...testFeatures, suspicious_extension_ratio: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400"
              />
            </div>
          </div>

          {/* Col 2 */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Rapid File Deletion Rate</span>
                <span className="font-mono text-cyan-400 font-bold">{testFeatures.rapid_file_deletion_rate} files/s</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={testFeatures.rapid_file_deletion_rate}
                onChange={(e) => setTestFeatures({ ...testFeatures, rapid_file_deletion_rate: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Directory Traversal Depth</span>
                <span className="font-mono text-cyan-400 font-bold">{testFeatures.directory_traversal_depth} levels</span>
              </div>
              <input
                type="range"
                min="1"
                max="16"
                step="1"
                value={testFeatures.directory_traversal_depth}
                onChange={(e) => setTestFeatures({ ...testFeatures, directory_traversal_depth: parseInt(e.target.value) })}
                className="w-full accent-cyan-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Process CPU Usage Burst</span>
                <span className="font-mono text-cyan-400 font-bold">{testFeatures.process_cpu_usage_burst}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={testFeatures.process_cpu_usage_burst}
                onChange={(e) => setTestFeatures({ ...testFeatures, process_cpu_usage_burst: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Target Extensions Count</span>
                <span className="font-mono text-cyan-400 font-bold">{testFeatures.unique_file_extensions_accessed} extensions</span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                step="1"
                value={testFeatures.unique_file_extensions_accessed}
                onChange={(e) => setTestFeatures({ ...testFeatures, unique_file_extensions_accessed: parseInt(e.target.value) })}
                className="w-full accent-cyan-400"
              />
            </div>
          </div>

          {/* Col 3: Binary Honeypots & Flags */}
          <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Critical Honeypot & Evasion Flags
            </h4>

            <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 cursor-pointer">
              <span className="text-xs text-slate-300 font-medium">Canary Trap File Tripped</span>
              <input
                type="checkbox"
                checked={testFeatures.canary_file_modified === 1}
                onChange={(e) => setTestFeatures({ ...testFeatures, canary_file_modified: e.target.checked ? 1 : 0 })}
                className="h-4 w-4 rounded accent-rose-500"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 cursor-pointer">
              <span className="text-xs text-slate-300 font-medium">Shadow Copy Tampering (VSS)</span>
              <input
                type="checkbox"
                checked={testFeatures.shadow_copy_access_attempt === 1}
                onChange={(e) => setTestFeatures({ ...testFeatures, shadow_copy_access_attempt: e.target.checked ? 1 : 0 })}
                className="h-4 w-4 rounded accent-rose-500"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 cursor-pointer">
              <span className="text-xs text-slate-300 font-medium">Ransom Payment Note Dropped</span>
              <input
                type="checkbox"
                checked={testFeatures.ransom_note_detected === 1}
                onChange={(e) => setTestFeatures({ ...testFeatures, ransom_note_detected: e.target.checked ? 1 : 0 })}
                className="h-4 w-4 rounded accent-rose-500"
              />
            </label>

            <button
              onClick={runWhatIfAnalysis}
              disabled={analyzing}
              className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white shadow-lg transition-all"
            >
              <Play className="h-4 w-4" />
              {analyzing ? 'Evaluating Model...' : 'Execute What-If Inference'}
            </button>
          </div>
        </div>

        {/* Live Test Results Display */}
        {testResult && (
          <div className="mt-6 pt-6 border-t border-slate-800 space-y-4 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-4 rounded-xl border ${testResult.is_ransomware ? 'bg-rose-950/40 border-rose-500/40 text-rose-300' : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'}`}>
                <span className="text-xs uppercase font-bold text-slate-400">Model Prediction</span>
                <p className="text-2xl font-black mt-1">{testResult.prediction}</p>
                <p className="text-xs mt-1 font-mono">Confidence: {(testResult.confidence * 100).toFixed(1)}%</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60">
                <span className="text-xs uppercase font-bold text-slate-400">Assigned Risk Score</span>
                <p className="text-2xl font-black text-white mt-1">{testResult.risk_score} / 100</p>
                <p className="text-xs text-slate-400 mt-1">Severity: <span className="font-bold text-cyan-400">{testResult.severity}</span></p>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60">
                <span className="text-xs uppercase font-bold text-slate-400">XAI Base Reference</span>
                <p className="text-2xl font-black text-white mt-1 font-mono">
                  {testResult.explanation?.base_value ?? 0.0}
                </p>
                <p className="text-xs text-slate-400 mt-1">Expected prior log-odds</p>
              </div>
            </div>

            {/* Plain-English synthesis */}
            <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/20 text-xs text-slate-200 leading-relaxed">
              <span className="font-bold text-cyan-300 uppercase block mb-1">Generated XAI Plain-English Verdict:</span>
              {testResult.explanation?.plain_english_explanation}
            </div>

            {/* Waterfall bar chart */}
            {testResult.explanation?.contributions && (
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
                  Sample-Level SHAP Waterfall Attribution Chart
                </h4>
                <ShapWaterfallChart contributions={testResult.explanation.contributions} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Model Performance Benchmark & Confusion Matrix */}
      {metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Confusion Matrix */}
          <div className="cyber-card p-6">
            <h3 className="text-base font-bold text-white uppercase tracking-wider mb-2">
              Empirical Confusion Matrix on Held-Out Test Set
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Evaluated strictly on unseen held-out samples with zero data leakage.
            </p>
            <ConfusionMatrixChart matrix={metrics.test_metrics.confusion_matrix} />
          </div>

          {/* Candidate Comparison Table */}
          <div className="cyber-card p-6">
            <h3 className="text-base font-bold text-white uppercase tracking-wider mb-2">
              Candidate Algorithm Benchmark Comparison
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Comparing linear baseline vs ensemble algorithms. F1-score & Recall prioritized.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Algorithm</th>
                    <th className="py-2.5 px-3">Accuracy</th>
                    <th className="py-2.5 px-3">Recall</th>
                    <th className="py-2.5 px-3">Precision</th>
                    <th className="py-2.5 px-3">F1-Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {Object.entries(metrics.candidate_comparison).map(([name, stats]) => {
                    const isChamp = name === metrics.champion_model;
                    return (
                      <tr key={name} className={isChamp ? 'bg-cyan-950/20 text-cyan-300 font-bold' : 'text-slate-300'}>
                        <td className="py-2.5 px-3 font-sans flex items-center gap-1.5">
                          {name}
                          {isChamp && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                              Selected
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">{(stats.accuracy * 100).toFixed(1)}%</td>
                        <td className="py-2.5 px-3">{(stats.recall * 100).toFixed(1)}%</td>
                        <td className="py-2.5 px-3">{(stats.precision * 100).toFixed(1)}%</td>
                        <td className="py-2.5 px-3">{(stats.f1_score * 100).toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400">
              <span className="font-bold text-slate-200">Cybersecurity Note:</span> In ransomware defense, False Negatives (missed active attacks) are catastrophic, so Recall and False Negative Rate (FNR) take priority alongside Precision.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
