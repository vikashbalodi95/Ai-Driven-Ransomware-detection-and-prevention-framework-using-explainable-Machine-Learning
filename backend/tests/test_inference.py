"""
Tests for ML Inference Engine and Risk Scoring.
"""

import pytest
from backend.ml.inference import InferenceEngine


@pytest.fixture(scope="module")
def inference_engine():
    return InferenceEngine(models_dir="backend/ml/saved_models")


def test_inference_benign_sample(inference_engine):
    benign_features = {
        "file_modification_rate": 0.5,
        "file_rename_rate": 0.05,
        "entropy_change_mean": 0.02,
        "suspicious_extension_ratio": 0.0,
        "directory_traversal_depth": 2,
        "rapid_file_deletion_rate": 0.01,
        "process_cpu_usage_burst": 8.0,
        "canary_file_modified": 0,
        "shadow_copy_access_attempt": 0,
        "ransom_note_detected": 0,
        "file_read_to_write_ratio": 1.2,
        "unique_file_extensions_accessed": 2
    }
    result = inference_engine.predict_sample(benign_features)
    assert result["prediction"] == "Benign"
    assert result["is_ransomware"] is False
    assert result["risk_score"] < 40
    assert result["severity"] in ["Informational", "Low"]
    assert result["explanation"] is not None


def test_inference_ransomware_sample(inference_engine):
    ransomware_features = {
        "file_modification_rate": 180.0,
        "file_rename_rate": 120.0,
        "entropy_change_mean": 3.75,
        "suspicious_extension_ratio": 0.95,
        "directory_traversal_depth": 10,
        "rapid_file_deletion_rate": 45.0,
        "process_cpu_usage_burst": 92.0,
        "canary_file_modified": 1,
        "shadow_copy_access_attempt": 1,
        "ransom_note_detected": 1,
        "file_read_to_write_ratio": 1.01,
        "unique_file_extensions_accessed": 22
    }
    result = inference_engine.predict_sample(ransomware_features)
    assert result["prediction"] == "Ransomware"
    assert result["is_ransomware"] is True
    assert result["risk_score"] >= 85
    assert result["severity"] in ["High", "Critical"]
    assert len(result["explanation"]["top_risk_factors"]) > 0


def test_missing_features_fallback(inference_engine):
    sparse_features = {
        "file_modification_rate": 2.0
    }
    result = inference_engine.predict_sample(sparse_features)
    assert "prediction" in result
    assert "risk_score" in result
    assert 0 <= result["risk_score"] <= 100
