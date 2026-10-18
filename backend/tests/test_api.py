import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database.session import Base, engine, SessionLocal
from backend.app.services.detection_service import detection_service


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        detection_service.seed_initial_data(db)
    finally:
        db.close()


client = TestClient(app)


def test_health_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"


def test_dashboard_summary():
    res = client.get("/api/dashboard/summary")
    assert res.status_code == 200
    data = res.json()
    assert "total_events" in data
    assert "benign_count" in data
    assert "ransomware_count" in data
    assert "active_alerts_count" in data
    assert "timeline_trends" in data


def test_model_info_and_metrics():
    info_res = client.get("/api/model/info")
    assert info_res.status_code == 200
    info_data = info_res.json()
    assert "algorithm" in info_data
    assert "features" in info_data

    metrics_res = client.get("/api/model/metrics")
    assert metrics_res.status_code == 200
    metrics_data = metrics_res.json()
    assert "test_metrics" in metrics_data
    assert "candidate_comparison" in metrics_data
    assert "global_feature_importance" in metrics_data


def test_detection_analyze_endpoint():
    payload = {
        "process_name": "test_ransom.exe",
        "pid": 9999,
        "is_simulated": False,
        "file_modification_rate": 200.0,
        "file_rename_rate": 150.0,
        "entropy_change_mean": 3.8,
        "suspicious_extension_ratio": 0.9,
        "directory_traversal_depth": 11,
        "rapid_file_deletion_rate": 40.0,
        "process_cpu_usage_burst": 95.0,
        "canary_file_modified": 1,
        "shadow_copy_access_attempt": 1,
        "ransom_note_detected": 1,
        "file_read_to_write_ratio": 1.01,
        "unique_file_extensions_accessed": 20
    }
    res = client.post("/api/detection/analyze", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["prediction"] == "Ransomware"
    assert data["severity"] in ["High", "Critical"]
    assert data["risk_score"] >= 80
    assert "explanation" in data
    assert data["explanation"] is not None

    # Retrieve by ID
    event_id = data["id"]
    get_res = client.get(f"/api/detections/{event_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == event_id


def test_alerts_and_patch():
    alerts_res = client.get("/api/alerts")
    assert alerts_res.status_code == 200
    alerts = alerts_res.json()
    assert len(alerts) > 0

    first_alert = alerts[0]
    alert_id = first_alert["id"]

    # Patch status to ACKNOWLEDGED
    patch_res = client.patch(f"/api/alerts/{alert_id}", json={
        "status": "ACKNOWLEDGED",
        "analyst_notes": "Triage verified - investigating infected host."
    })
    assert patch_res.status_code == 200
    updated = patch_res.json()
    assert updated["status"] == "ACKNOWLEDGED"
    assert "investigating" in updated["analyst_notes"]


def test_csv_export():
    res = client.get("/api/export/csv")
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    assert "Event_ID,Timestamp,Process_Name" in res.text
