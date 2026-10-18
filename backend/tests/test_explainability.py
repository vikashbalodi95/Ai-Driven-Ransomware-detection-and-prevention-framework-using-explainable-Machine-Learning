"""
Tests for Explainable AI (SHAP) Module.
"""

import pytest
from backend.ml.inference import InferenceEngine


@pytest.fixture(scope="module")
def inference_engine():
    return InferenceEngine(models_dir="backend/ml/saved_models")


def test_shap_explanation_structure(inference_engine):
    sample = {
        "file_modification_rate": 150.0,
        "file_rename_rate": 90.0,
        "entropy_change_mean": 3.4,
        "suspicious_extension_ratio": 0.85,
        "directory_traversal_depth": 8,
        "rapid_file_deletion_rate": 30.0,
        "process_cpu_usage_burst": 85.0,
        "canary_file_modified": 1,
        "shadow_copy_access_attempt": 0,
        "ransom_note_detected": 1,
        "file_read_to_write_ratio": 1.02,
        "unique_file_extensions_accessed": 18
    }
    result = inference_engine.predict_sample(sample, include_explanation=True)
    exp = result["explanation"]
    assert exp is not None
    assert "contributions" in exp
    assert len(exp["contributions"]) == 12  # All 12 features explained
    
    # Check contribution items
    for item in exp["contributions"]:
        assert "feature" in item
        assert "shap_value" in item
        assert "direction" in item
        assert item["direction"] in ["pushes_toward_ransomware", "pushes_toward_benign"]

    # Check narrative
    narrative = exp["plain_english_explanation"]
    assert isinstance(narrative, str)
    assert len(narrative) > 20
    assert "confidence" in narrative.lower()
