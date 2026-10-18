import {
  DashboardSummary,
  ModelInfo,
  ModelMetrics,
  DetectionEvent,
  Alert,
  SimulationStatus,
  SimulationLog
} from '../types';

const API_BASE = '/api';

export const api = {
  async getDashboardSummary(): Promise<DashboardSummary> {
    const res = await fetch(`${API_BASE}/dashboard/summary`);
    if (!res.ok) throw new Error('Failed to fetch dashboard summary');
    return res.json();
  },

  async getModelInfo(): Promise<ModelInfo> {
    const res = await fetch(`${API_BASE}/model/info`);
    if (!res.ok) throw new Error('Failed to fetch model info');
    return res.json();
  },

  async getModelMetrics(): Promise<ModelMetrics> {
    const res = await fetch(`${API_BASE}/model/metrics`);
    if (!res.ok) throw new Error('Failed to fetch model metrics');
    return res.json();
  },

  async getDetections(params?: {
    skip?: number;
    limit?: number;
    severity?: string;
    prediction?: string;
    is_simulated?: boolean;
  }): Promise<DetectionEvent[]> {
    const query = new URLSearchParams();
    if (params?.skip !== undefined) query.append('skip', params.skip.toString());
    if (params?.limit !== undefined) query.append('limit', params.limit.toString());
    if (params?.severity) query.append('severity', params.severity);
    if (params?.prediction) query.append('prediction', params.prediction);
    if (params?.is_simulated !== undefined) query.append('is_simulated', params.is_simulated.toString());

    const res = await fetch(`${API_BASE}/detections?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch detections');
    return res.json();
  },

  async getDetectionById(id: string): Promise<DetectionEvent> {
    const res = await fetch(`${API_BASE}/detections/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch detection event ${id}`);
    return res.json();
  },

  async getAlerts(params?: {
    status?: string;
    severity?: string;
  }): Promise<Alert[]> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.severity) query.append('severity', params.severity);

    const res = await fetch(`${API_BASE}/alerts?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch alerts');
    return res.json();
  },

  async updateAlert(id: string, update: { status?: string; analyst_notes?: string }): Promise<Alert> {
    const res = await fetch(`${API_BASE}/alerts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update)
    });
    if (!res.ok) throw new Error(`Failed to update alert ${id}`);
    return res.json();
  },

  async analyzeTelemetry(telemetry: Record<string, any>): Promise<DetectionEvent> {
    const res = await fetch(`${API_BASE}/detection/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(telemetry)
    });
    if (!res.ok) throw new Error('Failed to analyze telemetry');
    return res.json();
  },

  async startSimulation(scenario: string, eventCount = 8, intervalSeconds = 0.8): Promise<any> {
    const res = await fetch(`${API_BASE}/simulation/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario,
        event_count: eventCount,
        interval_seconds: intervalSeconds
      })
    });
    if (!res.ok) throw new Error('Failed to start simulation');
    return res.json();
  },

  async stopSimulation(): Promise<any> {
    const res = await fetch(`${API_BASE}/simulation/stop`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to stop simulation');
    return res.json();
  },

  async getSimulationStatus(): Promise<SimulationStatus> {
    const res = await fetch(`${API_BASE}/simulation/status`);
    if (!res.ok) throw new Error('Failed to fetch simulation status');
    return res.json();
  },

  async getSimulationLogs(): Promise<SimulationLog[]> {
    const res = await fetch(`${API_BASE}/simulation/logs?limit=30`);
    if (!res.ok) throw new Error('Failed to fetch simulation logs');
    return res.json();
  },

  getExportCsvUrl(): string {
    return `${API_BASE}/export/csv`;
  }
};
