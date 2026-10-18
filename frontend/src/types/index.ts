export interface FeatureContribution {
  feature: string;
  display_name: string;
  shap_value: number;
  actual_value: number;
  unit: string;
  direction: 'pushes_toward_ransomware' | 'pushes_toward_benign';
  description: string;
  benign_range: number[];
  is_anomalous: boolean;
}

export interface Explanation {
  predicted_class: string;
  predicted_probability: number;
  base_value: number;
  contributions: FeatureContribution[];
  top_risk_factors: FeatureContribution[];
  top_mitigating_factors: FeatureContribution[];
  plain_english_explanation: string;
}

export interface DetectionEvent {
  id: string;
  timestamp: string;
  process_name: string;
  pid: number;
  prediction: 'Ransomware' | 'Benign';
  is_ransomware: boolean;
  confidence: number;
  probability: number;
  risk_score: number;
  severity: 'Informational' | 'Low' | 'Medium' | 'High' | 'Critical';
  features: Record<string, number>;
  explanation_summary?: string;
  explanation?: Explanation;
  is_simulated: boolean;
  simulation_session_id?: string;
}

export interface Alert {
  id: string;
  event_id: string;
  severity: 'Informational' | 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'NEW' | 'ACKNOWLEDGED' | 'INVESTIGATING' | 'RESOLVED';
  analyst_notes?: string;
  created_at: string;
  updated_at: string;
  process_name?: string;
  risk_score?: number;
  prediction?: string;
  is_simulated?: boolean;
}

export interface TimelineTrendPoint {
  time_label: string;
  benign_count: number;
  ransomware_count: number;
  avg_risk_score: number;
}

export interface DashboardSummary {
  total_events: number;
  benign_count: number;
  ransomware_count: number;
  active_alerts_count: number;
  critical_alerts_count: number;
  high_alerts_count: number;
  accuracy: number;
  recall: number;
  champion_model: string;
  recent_events: DetectionEvent[];
  timeline_trends: TimelineTrendPoint[];
}

export interface ModelInfo {
  model_name: string;
  version: string;
  algorithm: string;
  feature_count: number;
  features: string[];
  training_samples: number;
  validation_samples: number;
  test_samples: number;
  trained_at: string;
  limitations: string[];
}

export interface ModelMetrics {
  champion_model: string;
  test_metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    roc_auc: number;
    false_positive_rate: number;
    false_negative_rate: number;
    confusion_matrix: {
      true_negatives: number;
      false_positives: number;
      false_negatives: number;
      true_positives: number;
      matrix: number[][];
    };
    roc_curve: Array<{ fpr: number; tpr: number }>;
    pr_curve: Array<{ recall: number; precision: number }>;
  };
  candidate_comparison: Record<string, {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    roc_auc: number;
    false_negative_rate: number;
    false_positive_rate: number;
  }>;
  global_feature_importance: Array<{
    feature: string;
    display_name: string;
    mean_abs_shap: number;
    relative_importance_pct: number;
    description: string;
  }>;
  evaluated_at: string;
}

export interface SimulationStatus {
  is_running: boolean;
  scenario?: string;
  events_generated: number;
  suspicious_count: number;
  session_id?: string;
  message: string;
}

export interface SimulationLog {
  step: number;
  timestamp: string;
  process_name: string;
  prediction: string;
  risk_score: number;
  severity: string;
  explanation_summary?: string;
  event_id: string;
}
