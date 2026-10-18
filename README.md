# RansomGuard AI: AI Ransomware Detection with Explainable AI (XAI)

An end-to-end, reproducible cybersecurity platform designed for real-time ransomware behavioral detection, risk scoring, and Explainable AI (TreeSHAP) interpretability. Suitable for final-year B.Tech CSE capstone projects, academic evaluations, research extensions, and Security Operations Center (SOC) demonstrations.

---

## 🌟 Key Highlights & Academic Contributions

- **Behavioral Detection Engine:** Classifies process activity using 12 empirical behavioral indicators (Shannon entropy deltas, file modification rates, mass extension mutations, decoy canary traps, Volume Shadow Copy tampering, etc.) rather than fragile static file signatures.
- **Explainable AI (TreeSHAP):** Decomposes every individual prediction into exact feature attributions (+SHAP pushing toward ransomware, -SHAP pushing toward benign) and generates grounded, human-interpretable plain-English explanations for SOC analysts.
- **Reproducible ML Pipeline:** Features zero data leakage, stratified splitting (70% train / 15% validation / 15% test), empirical noise modeling, baseline comparison across Logistic Regression, Random Forest, and XGBoost, and model serialization via Joblib.
- **Interactive SOC Dashboard:** Built with React 19, TypeScript, Vite, Tailwind CSS, Recharts, and Lucide icons. Includes live telemetry streaming, what-if predictive sandboxing, global feature importance charts, and alert triage audit trails.
- **Safe Ransomware Simulator:** Emulates ransomware outbreak bursts (LockBit 3.0 / WannaCry style) and benign system/developer workloads without executing real malware or risking host filesystem damage.

---

## 🏗️ System Architecture

```mermaid
graph TD
    subgraph Endpoint Telemetry
        P1[Process Activity] --> FE[Behavioral Feature Extractor]
        H1[Canary File Trap] --> FE
        E1[Shannon Entropy Delta] --> FE
        V1[VSS Tamper Hook] --> FE
    end

    subgraph Backend Engine [FastAPI + SQLAlchemy + SQLite]
        FE --> API[/api/detection/analyze]
        API --> PRE[DataPreprocessor]
        PRE --> ML[Champion ML Engine: XGBoost]
        ML --> RISK[Calibrated Risk Scoring: 0-100]
        ML --> XAI[SHAP TreeExplainer]
        XAI --> NARRATIVE[Plain-English Narrative Synthesizer]
        RISK --> DB[(SQLite Database)]
        NARRATIVE --> DB
        DB --> ALERT{Severity >= Medium?}
        ALERT -- Yes --> ALOG[Alert Audit Trail]
    end

    subgraph Frontend SOC [React 19 + TypeScript + Vite]
        DB --> DASH[Executive Overview]
        DB --> STREAM[Live Telemetry Monitor]
        DB --> MODAL[SHAP Waterfall Inspector]
        DB --> SANDBOX[What-If Predictor & Simulation]
    end
```

---

## 🚀 Quick Setup & Execution (Windows PowerShell)

### 1. Prerequisites
- **Python 3.11** (Recommended for pre-built SciPy/XGBoost/SHAP wheels)
- **Node.js** v18+ & **npm**

### 2. Backend Setup
Open PowerShell and navigate to the project root:

```powershell
# 1. Create Python virtual environment using Python 3.11
py -3.11 -m venv venv

# 2. Activate virtual environment
.\venv\Scripts\Activate.ps1

# 3. Upgrade pip and install backend dependencies
.\venv\Scripts\pip install -r backend/requirements.txt

# 4. Train the models & generate reproducible evaluation artifacts
.\venv\Scripts\python.exe -m backend.ml.train

# 5. Run automated test suite (Unit, Preprocessing, XAI, API integration)
.\venv\Scripts\python.exe -m pytest backend/tests

# 6. Start the FastAPI backend server
.\venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

The backend is now live at:
- **API Base:** `http://127.0.0.1:8000/api`
- **Swagger / OpenAPI Documentation:** `http://127.0.0.1:8000/docs`

---

### 3. Frontend Setup
Open a second PowerShell terminal in the `frontend` directory:

```powershell
cd frontend

# Install frontend dependencies
npm install

# Start the Vite development server
npm run dev -- --host 127.0.0.1 --port 5173
```

Open your browser at **`http://127.0.0.1:5173/`**.

---

## 📂 Project Structure

```text
Ai ransomware/
├── backend/
│   ├── app/
│   │   ├── api/router.py          # Documented REST API endpoints
│   │   ├── core/config.py         # Application settings
│   │   ├── database/session.py    # SQLAlchemy session & SQLite engine
│   │   ├── models/event.py        # ORM models (DetectionEvent, Alert, Simulation)
│   │   ├── schemas/event.py       # Pydantic v2 validation models
│   │   ├── services/
│   │   │   ├── detection_service.py   # Orchestration, alerts, XAI, CSV export
│   │   │   └── simulation_service.py  # Background async simulation engine
│   │   └── main.py                # FastAPI entrypoint with lifespan startup
│   ├── ml/
│   │   ├── data/                  # Benchmark telemetry datasets
│   │   ├── saved_models/          # Serialized model, scaler, explainer, metrics
│   │   ├── dataset.py             # Feature definitions and empirical generator
│   │   ├── preprocessing.py       # Validation, imputation, anti-leakage scaling
│   │   ├── train.py               # Model training, comparison & selection
│   │   ├── evaluate.py            # Comprehensive cybersecurity metrics
│   │   ├── explainability.py      # SHAP TreeExplainer & narrative synthesizer
│   │   └── inference.py           # Real-time inference & risk scoring engine
│   ├── tests/                     # 13 Automated pytest test cases
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── charts/                # Recharts SHAP waterfall, confusion matrix, trends
│   │   ├── components/            # Navbar, StatCard, SeverityBadge, DetailModal
│   │   ├── pages/                 # Overview, LiveStream, XAI, Alerts, Model, Sandbox
│   │   ├── services/api.ts        # Typed fetch client
│   │   ├── types/index.ts         # TypeScript definitions
│   │   ├── App.tsx                # Master container with tab navigation
│   │   └── index.css              # Cyber SOC Tailwind styling
│   ├── package.json
│   └── vite.config.ts
├── docs/
│   ├── PROJECT_REPORT.md          # Full academic B.Tech capstone report
│   ├── SYSTEM_ARCHITECTURE.md     # Component descriptions & Mermaid diagrams
│   ├── API_DOCUMENTATION.md       # Complete REST API reference
│   ├── MODEL_EVALUATION.md        # Actual measured metrics & candidate comparison
│   ├── DEMO_SCRIPT.md             # Evaluator step-by-step presentation script
│   └── TESTING_REPORT.md          # Automated testing results
└── README.md
```

---

## 🧪 Testing and Verification

Run the complete test suite:
```powershell
.\venv\Scripts\python.exe -m pytest backend/tests -v
```
All **13 automated tests** pass covering:
- Dataset generation and statistical sanity
- Data preprocessing, imputation, and strict anti-leakage split verification
- Model inference on benign and ransomware vectors
- SHAP TreeExplainer calculation, per-feature direction flags, and narrative generation
- FastAPI endpoints (`/health`, `/dashboard/summary`, `/model/metrics`, `/detection/analyze`, `/alerts`, `/export/csv`)

---

## 📜 Academic Evaluation & Deliverables
Detailed academic documentation is provided inside the [`docs/`](./docs/) directory:
- [Academic Project Report](./docs/PROJECT_REPORT.md)
- [System Architecture & Data Flows](./docs/SYSTEM_ARCHITECTURE.md)
- [REST API Documentation](./docs/API_DOCUMENTATION.md)
- [Empirical Model Evaluation & Benchmark Report](./docs/MODEL_EVALUATION.md)
- [Live Demonstration Script for Professors/Evaluators](./docs/DEMO_SCRIPT.md)
- [Automated Testing Report](./docs/TESTING_REPORT.md)
