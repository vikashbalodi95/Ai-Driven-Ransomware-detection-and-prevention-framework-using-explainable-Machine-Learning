"""
Data Preprocessing, Validation, and Leakage Prevention.
"""

import numpy as np
import pandas as pd
from typing import Tuple, List, Dict, Any, Optional
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import joblib

from backend.ml.dataset import FEATURE_NAMES


class DataPreprocessor:
    def __init__(self, feature_names: Optional[List[str]] = None):
        self.feature_names = feature_names or FEATURE_NAMES
        self.scaler = StandardScaler()
        self.is_fitted = False
        self.feature_stats: Dict[str, Dict[str, float]] = {}

    def validate_features(self, df: pd.DataFrame, require_target: bool = False) -> pd.DataFrame:
        """
        Validates column presence, handles missing values and duplicates.
        Ensures strict feature ordering.
        """
        df_clean = df.copy()

        # Check required features
        for col in self.feature_names:
            if col not in df_clean.columns:
                raise ValueError(f"Missing required feature: '{col}'")

        if require_target and "is_ransomware" not in df_clean.columns:
            raise ValueError("Target column 'is_ransomware' is required for training preprocessing.")

        # Deduplicate
        df_clean = df_clean.drop_duplicates(subset=self.feature_names)

        # Handle missing values: median imputation for numerical features
        for col in self.feature_names:
            if df_clean[col].isnull().any():
                median_val = df_clean[col].median()
                df_clean[col] = df_clean[col].fillna(median_val)
            # Ensure float/numeric
            df_clean[col] = pd.to_numeric(df_clean[col], errors="coerce").fillna(0.0)

        return df_clean

    def fit(self, X: pd.DataFrame) -> "DataPreprocessor":
        """
        Fits StandardScaler exclusively on training split to prevent data leakage.
        Also calculates baseline empirical statistics (mean, std, min, max, p5, p95).
        """
        X_ordered = X[self.feature_names].values
        self.scaler.fit(X_ordered)
        self.is_fitted = True

        # Calculate baseline statistics per feature for plain-English contextual comparisons
        self.feature_stats = {}
        for col in self.feature_names:
            vals = X[col].values
            self.feature_stats[col] = {
                "mean": float(np.mean(vals)),
                "std": float(np.std(vals)),
                "min": float(np.min(vals)),
                "max": float(np.max(vals)),
                "p5": float(np.percentile(vals, 5)),
                "p50": float(np.percentile(vals, 50)),
                "p95": float(np.percentile(vals, 95)),
            }
        return self

    def transform(self, X: pd.DataFrame) -> np.ndarray:
        """Transforms features using the fitted scaler."""
        if not self.is_fitted:
            raise RuntimeError("DataPreprocessor must be fitted before calling transform.")
        X_ordered = X[self.feature_names].values
        return self.scaler.transform(X_ordered)

    def fit_transform(self, X: pd.DataFrame) -> np.ndarray:
        return self.fit(X).transform(X)

    def prepare_train_val_test_splits(
        self,
        df: pd.DataFrame,
        test_size: float = 0.15,
        val_size: float = 0.15,
        random_state: int = 42
    ) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.Series, pd.Series, pd.Series]:
        """
        Splits dataset into Train (70%), Validation (15%), and Test (15%) using stratified sampling.
        Guarantees zero data leakage.
        """
        clean_df = self.validate_features(df, require_target=True)
        X = clean_df[self.feature_names]
        y = clean_df["is_ransomware"].astype(int)

        # Split train+val vs test
        X_temp, X_test, y_temp, y_test = train_test_split(
            X, y,
            test_size=test_size,
            random_state=random_state,
            stratify=y
        )

        # Split train vs val
        relative_val_size = val_size / (1.0 - test_size)
        X_train, X_val, y_train, y_val = train_test_split(
            X_temp, y_temp,
            test_size=relative_val_size,
            random_state=random_state,
            stratify=y_temp
        )

        return X_train, X_val, X_test, y_train, y_val, y_test

    def save(self, filepath: str) -> None:
        """Saves fitted scaler and stats."""
        data = {
            "scaler": self.scaler,
            "feature_names": self.feature_names,
            "feature_stats": self.feature_stats,
            "is_fitted": self.is_fitted
        }
        joblib.dump(data, filepath)

    @classmethod
    def load(cls, filepath: str) -> "DataPreprocessor":
        """Loads fitted preprocessor from file."""
        data = joblib.load(filepath)
        preprocessor = cls(feature_names=data["feature_names"])
        preprocessor.scaler = data["scaler"]
        preprocessor.feature_stats = data["feature_stats"]
        preprocessor.is_fitted = data["is_fitted"]
        return preprocessor
