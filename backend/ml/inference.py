"""
Inference Engine and Risk Scoring for AI Ransomware Detection.
Validates input telemetry, performs real-time model inference, risk scoring,
and generates SHAP-based explainability.
"""

import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional

from backend.ml.dataset import FEATURE_NAMES
from backend.ml.preprocessing import DataPreprocessor
from backend.ml.explainability import RansomwareExplainer


class InferenceEngine:
    def __init__(self, models_dir: str = "backend/ml/saved_models"):
        self.models_dir = models_dir
        self.model = None
        self.preprocessor = None
        self.explainer = None
        self.is_loaded = False
        self.load_artifacts()

    def load_artifacts(self) -> None:
        """Loads serialized model, scaler, and explainer."""
        model_path = os.path.join(self.models_dir, "model.joblib")
        scaler_path = os.path.join(self.models_dir, "scaler.joblib")
        explainer_path = os.path.join(self.models_dir, "explainer.joblib")

        if not (os.path.exists(model_path) and os.path.exists(scaler_path)):
            raise FileNotFoundError(
                f"Model artifacts not found in {self.models_dir}. Please run backend/ml/train.py first."
            )

        self.model = joblib.load(model_path)
        self.preprocessor = DataPreprocessor.load(scaler_path)

        if os.path.exists(explainer_path):
            self.explainer = RansomwareExplainer.load(explainer_path)
        else:
            # Fallback initialization
            self.explainer = RansomwareExplainer(self.model, feature_names=FEATURE_NAMES)

        self.is_loaded = True

    def calculate_risk_and_severity(
        self,
        probability: float,
        features: Dict[str, float]
    ) -> tuple[int, str]:
        """
        Calibrated risk scoring (0-100) and severity assignment.
        Incorporates direct high-confidence indicators (canary tripping, shadow copy tampering).
        """
        base_score = int(round(probability * 100))

        # Check critical canary / evasion overrides
        canary = features.get("canary_file_modified", 0)
        shadow = features.get("shadow_copy_access_attempt", 0)
        entropy = features.get("entropy_change_mean", 0.0)

        # Elevate risk if high-confidence honeypot triggered
        if canary == 1 and entropy > 1.5:
            base_score = max(base_score, 95)
        elif shadow == 1:
            base_score = max(base_score, 85)

        # Clamp between 0 and 100
        risk_score = max(0, min(100, base_score))

        # Severity categories
        if risk_score >= 85:
            severity = "Critical"
        elif risk_score >= 65:
            severity = "High"
        elif risk_score >= 40:
            severity = "Medium"
        elif risk_score >= 20:
            severity = "Low"
        else:
            severity = "Informational"

        return risk_score, severity

    def predict_sample(
        self,
        features: Dict[str, float],
        include_explanation: bool = True
    ) -> Dict[str, Any]:
        """
        Executes end-to-end inference for a single telemetry sample.
        """
        if not self.is_loaded:
            self.load_artifacts()

        # Validate feature presence and fill missing defaults
        clean_features = {}
        for feat in FEATURE_NAMES:
            val = features.get(feat, 0.0)
            try:
                clean_features[feat] = float(val)
            except (ValueError, TypeError):
                clean_features[feat] = 0.0

        # Construct 1-row DataFrame to ensure identical ordering
        df_row = pd.DataFrame([clean_features])[FEATURE_NAMES]
        scaled_input = self.preprocessor.transform(df_row)

        # Model inference
        prob_ransomware = float(self.model.predict_proba(scaled_input)[0, 1])
        predicted_class = 1 if prob_ransomware >= 0.50 else 0
        prediction_label = "Ransomware" if predicted_class == 1 else "Benign"

        # Calculate risk score and severity
        risk_score, severity = self.calculate_risk_and_severity(prob_ransomware, clean_features)

        # Generate XAI explanation if requested
        explanation = None
        if include_explanation and self.explainer:
            explanation = self.explainer.explain_sample(
                features_unscaled=clean_features,
                features_scaled=scaled_input,
                predicted_class=predicted_class,
                predicted_prob=prob_ransomware
            )

        return {
            "prediction": prediction_label,
            "is_ransomware": bool(predicted_class == 1),
            "confidence": round(prob_ransomware if predicted_class == 1 else (1.0 - prob_ransomware), 4),
            "probability": round(prob_ransomware, 4),
            "risk_score": risk_score,
            "severity": severity,
            "features": clean_features,
            "explanation": explanation
        }

    def predict_batch(self, batch_features: List[Dict[str, float]]) -> List[Dict[str, Any]]:
        """Executes inference on a batch of samples."""
        return [self.predict_sample(sample, include_explanation=False) for sample in batch_features]
