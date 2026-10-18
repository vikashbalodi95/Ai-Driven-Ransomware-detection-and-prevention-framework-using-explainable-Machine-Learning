# System Architecture & Technical Specifications

## 1. Overview
**RansomGuard AI** is a multi-tier cybersecurity system combining endpoint telemetry ingestion, high-speed machine learning inference, cooperative game theory explainability (TreeSHAP), and an interactive React 19 Security Operations Center (SOC) dashboard.

---

## 2. Component Diagram

```mermaid
graph TB
    subgraph Client Layer [Frontend - React 19 + TypeScript + Vite]
        UI_NAV[Navigation Controller]
        UI_OVERVIEW[SOC Executive Overview]
        UI_STREAM[Live Telemetry Stream]
        UI_XAI[Explainability Center & What-If Sandbox]
        UI_ALERTS[Alert Triage & Audit Management]
        UI_SIM[Simulation Sandbox Controller]
        UI_MODAL[SHAP Waterfall Modal Inspector]
    end

    subgraph API Gateway [FastAPI Backend]
        ROUTER[/api/ Router]
        CORS[CORS Middleware]
        AUTH[Telemetry Validation Pydantic V2]
    end

    subgraph Core Services
        DET_SVC[Detection Service]
        SIM_SVC[Simulation Service]
        EXP_SVC[Explainability Service]
    end

    subgraph Machine Learning Subsystem
        PRE[DataPreprocessor & Scaler]
        MODEL[Champion XGBoost Classifier]
        SHAP_ENG[TreeSHAP Explainer Engine]
        NARR_GEN[Plain-English Narrative Synthesizer]
        RISK_SCORER[Calibrated Risk Scorer 0-100]
    end

    subgraph Data Persistence
        DB[(SQLite - ransomware_detection.db)]
        EVENTS_TBL[DetectionEvent Table]
        ALERTS_TBL[Alert Table]
        SESSIONS_TBL[SimulationSession Table]
    end

    UI_NAV --> ROUTER
    UI_OVERVIEW --> ROUTER
    UI_STREAM --> ROUTER
    UI_XAI --> ROUTER
    UI_ALERTS --> ROUTER
    UI_SIM --> ROUTER
    UI_MODAL --> ROUTER

    ROUTER --> CORS --> AUTH
    AUTH --> DET_SVC
    AUTH --> SIM_SVC

    DET_SVC --> PRE
    PRE --> MODEL
    MODEL --> RISK_SCORER
    MODEL --> SHAP_ENG
    SHAP_ENG --> NARR_GEN
    RISK_SCORER --> DET_SVC
    NARR_GEN --> DET_SVC

    DET_SVC --> DB
    DB --> EVENTS_TBL
    DB --> ALERTS_TBL
    DB --> SESSIONS_TBL

    SIM_SVC --> DET_SVC
```

---

## 3. Data Flow Architecture

### Ingestion to Explanation Pipeline
1. **Telemetry Ingestion:** JSON payload containing process metadata (`process_name`, `pid`) and 12 behavioral indicators is received via `POST /api/detection/analyze`.
2. **Schema Validation:** Pydantic v2 ensures type safety, clamps valid numerical ranges, and fills safe defaults for sparse inputs.
3. **Feature Scaling:** `DataPreprocessor` scales numerical features using parameters fitted strictly on the training partition.
4. **Model Inference:** `XGBoost.predict_proba()` produces the raw probability of ransomware activity $P(Y=1|X)$.
5. **Risk Scoring & Severity Mapping:**
   - Raw probabilities are calibrated into a 0–100 integer score.
   - High-confidence sentinel events (decoy canary file modified, shadow copy deletion attempt) automatically elevate the risk score to Critical tier ($R \ge 85$).
6. **TreeSHAP Decomposition:** `RansomwareExplainer` computes exact local feature attributions $\phi_i(x)$ relative to expected prior log-odds base value.
7. **Narrative Synthesis:** The system identifies top positive attributions (pushing toward ransomware) and negative attributions (pushing toward benign) and generates a contextual security summary.
8. **Persistence:** An immutable `DetectionEvent` record is stored in SQLite. If severity is $\ge \text{Medium}$, an automated `Alert` is created in state `NEW`.
9. **Dispatch:** The complete structured response (including prediction, risk score, severity, raw features, SHAP attributions, and narrative) is returned to the client.

---

## 4. Database Schema (SQLite / SQLAlchemy)

### `detection_events`
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | VARCHAR(36) PK | Unique UUID v4 |
| `timestamp` | DATETIME | Event UTC timestamp |
| `process_name` | VARCHAR(128) | Process executable name |
| `pid` | INTEGER | Process identifier |
| `prediction` | VARCHAR(32) | 'Ransomware' or 'Benign' |
| `is_ransomware` | BOOLEAN | Boolean target label |
| `confidence` | FLOAT | Model confidence score |
| `probability` | FLOAT | P(Ransomware) probability |
| `risk_score` | INTEGER | Calibrated risk (0-100) |
| `severity` | VARCHAR(32) | Informational, Low, Medium, High, Critical |
| `features_json` | TEXT | Serialized JSON dictionary of observed features |
| `explanation_summary`| TEXT | Plain-English XAI verdict narrative |
| `shap_values_json` | TEXT | Serialized JSON of all 12 SHAP attributions |
| `is_simulated` | BOOLEAN | Indicates whether generated via sandbox |
| `simulation_session_id` | VARCHAR(36) | Session UUID if simulated |

### `alerts`
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | VARCHAR(36) PK | Unique Alert UUID |
| `event_id` | VARCHAR(36) FK | References `detection_events.id` |
| `severity` | VARCHAR(32) | Medium, High, Critical |
| `status` | VARCHAR(32) | NEW, ACKNOWLEDGED, INVESTIGATING, RESOLVED |
| `analyst_notes` | TEXT | Security analyst triage documentation |
| `created_at` | DATETIME | Initial alert generation timestamp |
| `updated_at` | DATETIME | Last status transition timestamp |

---

## 5. Security & Safety Boundaries
- **No Arbitrary Code Execution:** The system never executes uploaded binaries or unverified scripts.
- **Isolated Synthetic Sandbox:** The simulation module generates purely mathematical feature telemetry vectors; it touches zero user files and executes zero destructive shell commands.
- **Strict Anti-Leakage:** Training and evaluation pipelines strictly isolate training statistics from test metrics.
