"""
Tests for Data Preprocessing and Leakage Prevention.
"""

import pytest
import numpy as np
import pandas as pd

from backend.ml.dataset import FEATURE_NAMES, generate_synthetic_telemetry
from backend.ml.preprocessing import DataPreprocessor


def test_dataset_generation():
    df = generate_synthetic_telemetry(n_samples=200, random_state=42)
    assert len(df) == 200
    assert "is_ransomware" in df.columns
    for feat in FEATURE_NAMES:
        assert feat in df.columns
    assert set(df["is_ransomware"].unique()).issubset({0, 1})


def test_preprocessor_validation():
    preprocessor = DataPreprocessor(feature_names=FEATURE_NAMES)
    df = generate_synthetic_telemetry(n_samples=100, random_state=42)
    
    # Introduce NaN
    df.loc[0, "file_modification_rate"] = np.nan
    clean_df = preprocessor.validate_features(df, require_target=True)
    
    assert not clean_df["file_modification_rate"].isnull().any()
    assert len(clean_df) == 100


def test_anti_leakage_splits():
    preprocessor = DataPreprocessor(feature_names=FEATURE_NAMES)
    df = generate_synthetic_telemetry(n_samples=500, random_state=42)
    
    X_train, X_val, X_test, y_train, y_val, y_test = preprocessor.prepare_train_val_test_splits(
        df, test_size=0.15, val_size=0.15, random_state=42
    )
    
    assert len(X_train) == 350  # 70%
    assert len(X_val) == 75     # 15%
    assert len(X_test) == 75    # 15%
    
    # Verify index disjointness (strict zero-leakage)
    assert len(set(X_train.index).intersection(set(X_test.index))) == 0
    assert len(set(X_train.index).intersection(set(X_val.index))) == 0
    assert len(set(X_val.index).intersection(set(X_test.index))) == 0
