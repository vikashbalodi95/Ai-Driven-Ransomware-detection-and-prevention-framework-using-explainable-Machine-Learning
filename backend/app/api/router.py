"""
FastAPI REST API Endpoints Router.
Fully documented, robustly validated, error-handled API endpoints.
"""

import os
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import PlainTextResponse, Response
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.schemas.event import (
    TelemetryInput,
    BatchTelemetryInput,
    DetectionEventResponse,
    AlertResponse,
    AlertUpdate,
    DashboardSummary,
    SimulationStartRequest,
    SimulationStatusResponse
)
from backend.app.services.detection_service import detection_service
from backend.app.services.simulation_service import simulation_manager

api_router = APIRouter()


@api_router.get("/health", tags=["System"])
def health_check():
    """Health check endpoint to verify backend service readiness."""
    return {
        "status": "healthy",
        "service": "AI Ransomware Detection with Explainable AI",
        "version": "1.0.0"
    }


@api_router.get("/dashboard/summary", response_model=DashboardSummary, tags=["Dashboard"])
def get_dashboard_summary(db: Session = Depends(get_db)):
    """Provides high-level SOC dashboard metrics, alerts count, and detection trends."""
    return detection_service.get_dashboard_summary(db)


@api_router.get("/model/info", tags=["Machine Learning"])
def get_model_info():
    """Returns model architecture, algorithm, feature definitions, and training metadata."""
    meta_path = "backend/ml/saved_models/metadata.json"
    if not os.path.exists(meta_path):
        raise HTTPException(status_code=404, detail="Model metadata not found. Train the model first.")
    with open(meta_path, "r") as f:
        return json.load(f)


@api_router.get("/model/metrics", tags=["Machine Learning"])
def get_model_metrics():
    """Returns genuine evaluation metrics: Accuracy, Precision, Recall, F1, ROC-AUC, Confusion Matrix, and Global SHAP importance."""
    metrics_path = "backend/ml/saved_models/metrics.json"
    if not os.path.exists(metrics_path):
        raise HTTPException(status_code=404, detail="Model metrics not found. Train the model first.")
    with open(metrics_path, "r") as f:
        return json.load(f)


@api_router.post("/detection/analyze", response_model=DetectionEventResponse, tags=["Detection"])
def analyze_telemetry(telemetry: TelemetryInput, db: Session = Depends(get_db)):
    """
    Submits a single behavioral telemetry sample for real-time ML inference,
    risk scoring, severity assignment, and SHAP explainability synthesis.
    """
    try:
        return detection_service.analyze_and_store(db, telemetry)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")


@api_router.post("/detection/batch", response_model=List[DetectionEventResponse], tags=["Detection"])
def analyze_batch_telemetry(batch: BatchTelemetryInput, db: Session = Depends(get_db)):
    """Submits a batch of behavioral telemetry samples for analysis and persistence."""
    results = []
    for item in batch.events:
        results.append(detection_service.analyze_and_store(db, item))
    return results


@api_router.get("/detections", response_model=List[DetectionEventResponse], tags=["Detection"])
def list_detections(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    severity: Optional[str] = Query(None, description="Filter by severity (Informational, Low, Medium, High, Critical)"),
    prediction: Optional[str] = Query(None, description="Filter by prediction (Benign, Ransomware)"),
    is_simulated: Optional[bool] = Query(None, description="Filter by simulation flag"),
    db: Session = Depends(get_db)
):
    """Retrieves paginated historical detection logs with optional filtering."""
    return detection_service.get_detections(
        db, skip=skip, limit=limit, severity=severity, prediction=prediction, is_simulated=is_simulated
    )


@api_router.get("/detections/{event_id}", response_model=DetectionEventResponse, tags=["Detection"])
def get_detection_details(event_id: str, db: Session = Depends(get_db)):
    """Retrieves full details for a specific detection event."""
    event = detection_service.get_detection_by_id(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail=f"Detection event '{event_id}' not found")
    return event


@api_router.get("/detections/{event_id}/explanation", tags=["Explainability"])
def get_detection_explanation(event_id: str, db: Session = Depends(get_db)):
    """Retrieves dedicated SHAP waterfall explanation and plain-English narrative for an event."""
    event = detection_service.get_detection_by_id(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail=f"Detection event '{event_id}' not found")
    return {
        "event_id": event.id,
        "process_name": event.process_name,
        "prediction": event.prediction,
        "risk_score": event.risk_score,
        "severity": event.severity,
        "explanation": event.explanation,
        "plain_english_explanation": event.explanation_summary
    }


@api_router.get("/alerts", response_model=List[AlertResponse], tags=["Alerts"])
def list_alerts(
    status: Optional[str] = Query(None, description="Filter by status (NEW, ACKNOWLEDGED, INVESTIGATING, RESOLVED)"),
    severity: Optional[str] = Query(None, description="Filter by severity (Medium, High, Critical)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Retrieves active security alerts generated by suspicious ransomware detections."""
    return detection_service.get_alerts(db, status=status, severity=severity, skip=skip, limit=limit)


@api_router.patch("/alerts/{alert_id}", response_model=AlertResponse, tags=["Alerts"])
def update_alert(alert_id: str, update_data: AlertUpdate, db: Session = Depends(get_db)):
    """Updates alert triage status (ACKNOWLEDGED, INVESTIGATING, RESOLVED) or appends analyst notes."""
    updated = detection_service.update_alert(db, alert_id, update_data)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Alert '{alert_id}' not found")
    return updated


@api_router.post("/simulation/start", tags=["Simulation"])
async def start_simulation(request: SimulationStartRequest):
    """
    Launches a controlled, safe simulation of ransomware-like or benign file activity.
    The simulation sends live event telemetry into the real ML model.
    """
    res = await simulation_manager.start_simulation(
        scenario=request.scenario,
        event_count=request.event_count,
        interval_seconds=request.interval_seconds
    )
    if res.get("status") == "error":
        raise HTTPException(status_code=400, detail=res.get("message"))
    return res


@api_router.post("/simulation/stop", tags=["Simulation"])
async def stop_simulation():
    """Stops any currently active simulation."""
    return await simulation_manager.stop_simulation()


@api_router.get("/simulation/status", response_model=SimulationStatusResponse, tags=["Simulation"])
def get_simulation_status():
    """Returns the current state and progress of the simulation engine."""
    return simulation_manager.get_status()


@api_router.get("/simulation/logs", tags=["Simulation"])
def get_simulation_logs(limit: int = Query(20, ge=1, le=100)):
    """Returns recent real-time logs generated during active simulations."""
    return simulation_manager.get_logs(limit=limit)


@api_router.get("/export/csv", tags=["Audit"])
def export_detection_logs_csv(db: Session = Depends(get_db)):
    """Exports detection events and feature vectors into an auditable CSV log."""
    csv_data = detection_service.export_csv(db)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=ransomware_detection_audit_log.csv"}
    )


@api_router.post("/seed", tags=["System"])
def seed_initial_demo_data(db: Session = Depends(get_db)):
    """Seeds realistic historical events and alerts into the database for demonstration."""
    count = detection_service.seed_initial_data(db)
    return {"status": "success", "seeded_events_count": count}
