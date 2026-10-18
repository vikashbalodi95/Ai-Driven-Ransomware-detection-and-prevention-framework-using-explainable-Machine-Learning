# REST API Specification & Developer Guide

## Base URL
```
http://127.0.0.1:8000/api
```

Interactive OpenAPI / Swagger UI documentation is available at:
```
http://127.0.0.1:8000/docs
```

---

## 1. System & Health

### `GET /api/health`
Checks backend service health and readiness.

**Response:**
```json
{
  "status": "healthy",
  "service": "AI Ransomware Detection with Explainable AI",
  "version": "1.0.0"
}
```

---

## 2. Dashboard & Telemetry

### `GET /api/dashboard/summary`
Returns high-level executive SOC metrics, active alerts breakdown, recent events, and timeline threat curves.

**Response (Example):**
```json
{
  "total_events": 45,
  "benign_count": 32,
  "ransomware_count": 13,
  "active_alerts_count": 8,
  "critical_alerts_count": 4,
  "high_alerts_count": 3,
  "accuracy": 1.0,
  "recall": 1.0,
  "champion_model": "XGBoost",
  "recent_events": [...],
  "timeline_trends": [...]
}
```

---

## 3. Detection & Inference

### `POST /api/detection/analyze`
Submits an endpoint telemetry vector for real-time ML classification, risk scoring, and SHAP explainability.

**Request Body:**
```json
{
  "process_name": "svchost_updater.exe",
  "pid": 14022,
  "is_simulated": false,
  "file_modification_rate": 185.0,
  "file_rename_rate": 120.0,
  "entropy_change_mean": 3.65,
  "suspicious_extension_ratio": 0.88,
  "directory_traversal_depth": 9,
  "rapid_file_deletion_rate": 45.0,
  "process_cpu_usage_burst": 92.5,
  "canary_file_modified": 1,
  "shadow_copy_access_attempt": 1,
  "ransom_note_detected": 1,
  "file_read_to_write_ratio": 1.02,
  "unique_file_extensions_accessed": 22
}
```

**Response (Example):**
```json
{
  "id": "e9b28f3a-7f61-4648-9363-d1f56b9076bc",
  "timestamp": "2026-10-12T06:55:00Z",
  "process_name": "svchost_updater.exe",
  "pid": 14022,
  "prediction": "Ransomware",
  "is_ransomware": true,
  "confidence": 0.9994,
  "probability": 0.9994,
  "risk_score": 100,
  "severity": "Critical",
  "features": { ... },
  "explanation_summary": "The AI model classified this event as POTENTIAL RANSOMWARE with 99.9% confidence...",
  "explanation": {
    "predicted_class": "Ransomware",
    "predicted_probability": 0.9994,
    "base_value": -0.842,
    "contributions": [
      {
        "feature": "file_rename_rate",
        "display_name": "File Rename Rate",
        "shap_value": 4.7216,
        "actual_value": 120.0,
        "unit": "files/sec",
        "direction": "pushes_toward_ransomware",
        "is_anomalous": true
      }
    ],
    "top_risk_factors": [...],
    "top_mitigating_factors": [...],
    "plain_english_explanation": "..."
  },
  "is_simulated": false
}
```

### `GET /api/detections`
Lists paginated historical detection logs with optional filtering.
- `skip` (default: 0)
- `limit` (default: 50)
- `severity` (e.g. `Critical`, `High`, `Medium`, `Low`, `Informational`)
- `prediction` (`Ransomware`, `Benign`)
- `is_simulated` (`true`, `false`)

### `GET /api/detections/{event_id}`
Returns full record details for a specific detection event.

### `GET /api/detections/{event_id}/explanation`
Retrieves dedicated SHAP waterfall attributions and plain-English narrative for an event.

---

## 4. Alerts & Incident Management

### `GET /api/alerts`
Returns active security incident alerts.
- Query parameters: `status` (`NEW`, `ACKNOWLEDGED`, `INVESTIGATING`, `RESOLVED`), `severity`.

### `PATCH /api/alerts/{alert_id}`
Updates alert triage state or documents analyst notes.

**Request Body:**
```json
{
  "status": "ACKNOWLEDGED",
  "analyst_notes": "Host isolated via network containment. Memory dump acquired."
}
```

---

## 5. Safe Simulation Sandbox

### `POST /api/simulation/start`
Launches an asynchronous background telemetry simulation.

**Request Body:**
```json
{
  "scenario": "fast_ransomware",
  "event_count": 8,
  "interval_seconds": 0.8
}
```
Available Scenarios:
- `fast_ransomware`: LockBit 3.0 / WannaCry burst with canary tripping
- `stealthy_ransomware`: Conti / Dharma low-and-slow evasion
- `benign_developer`: Rust/Node compiler build workload
- `benign_office`: Office productivity document editing

### `POST /api/simulation/stop`
Cancels any currently running simulation task.

### `GET /api/simulation/status`
Returns active simulation progress, session ID, and generated event counts.

### `GET /api/simulation/logs`
Returns the recent live console logs from the simulation stream.

---

## 6. Audit & Export

### `GET /api/export/csv`
Downloads an RFC 4180-compliant CSV containing detection event histories and behavioral telemetry vectors for audit compliance.
