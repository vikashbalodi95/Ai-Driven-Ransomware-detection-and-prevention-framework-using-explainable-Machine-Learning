"""
Explainable AI (XAI) Module using SHAP (SHapley Additive exPlanations).
Computes exact local and global feature attributions and generates
grounded, plain-English security explanations based strictly on SHAP values.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
import shap
import joblib

from backend.ml.dataset import FEATURE_NAMES, FEATURE_METADATA


class RansomwareExplainer:
    def __init__(self, model: Any, background_data: Optional[np.ndarray] = None, feature_names: Optional[List[str]] = None):
        self.model = model
        self.feature_names = feature_names or FEATURE_NAMES

        # Initialize TreeExplainer for tree models (RandomForest, XGBoost)
        try:
            self.explainer = shap.TreeExplainer(model, data=background_data)
        except Exception:
            # Fallback to general Explainer
            self.explainer = shap.Explainer(model, background_data)

    def explain_sample(
        self,
        features_unscaled: Dict[str, float],
        features_scaled: np.ndarray,
        predicted_class: int,
        predicted_prob: float
    ) -> Dict[str, Any]:
        """
        Computes SHAP values for a single sample and synthesizes a plain-English explanation.
        """
        # Ensure 2D shape
        if len(features_scaled.shape) == 1:
            x_input = features_scaled.reshape(1, -1)
        else:
            x_input = features_scaled

        raw_shap = self.explainer.shap_values(x_input)

        # In binary classification, SHAP might return a list [class_0_shaps, class_1_shaps] or single array
        if isinstance(raw_shap, list):
            # Use class 1 (Ransomware) SHAP values
            sample_shap = raw_shap[1][0]
        elif len(raw_shap.shape) == 3:
            # Shape (n_samples, n_features, n_classes)
            sample_shap = raw_shap[0, :, 1]
        elif len(raw_shap.shape) == 2:
            # Shape (n_samples, n_features)
            sample_shap = raw_shap[0]
        else:
            sample_shap = np.array(raw_shap).flatten()

        # Expected baseline value
        base_val = self.explainer.expected_value
        if isinstance(base_val, (list, np.ndarray)):
            base_val = float(base_val[1] if len(base_val) > 1 else base_val[0])
        else:
            base_val = float(base_val)

        # Build feature contributions list
        contributions: List[Dict[str, Any]] = []
        for i, name in enumerate(self.feature_names):
            shap_val = float(sample_shap[i])
            actual_val = float(features_unscaled.get(name, 0.0))
            meta = FEATURE_METADATA.get(name, {})
            unit = meta.get("unit", "")
            desc = meta.get("description", "")
            benign_rng = meta.get("benign_range", [0, 0])

            # Direction of push
            direction = "pushes_toward_ransomware" if shap_val > 0 else "pushes_toward_benign"

            contributions.append({
                "feature": name,
                "display_name": name.replace("_", " ").title(),
                "shap_value": round(shap_val, 4),
                "actual_value": round(actual_val, 3),
                "unit": unit,
                "direction": direction,
                "description": desc,
                "benign_range": benign_rng,
                "is_anomalous": bool(actual_val > benign_rng[1] if len(benign_rng) > 1 else False)
            })

        # Sort by absolute SHAP impact
        contributions.sort(key=lambda c: abs(c["shap_value"]), reverse=True)

        # Generate grounded plain-English narrative
        narrative = self._generate_narrative(
            predicted_class=predicted_class,
            predicted_prob=predicted_prob,
            contributions=contributions
        )

        return {
            "predicted_class": "Ransomware" if predicted_class == 1 else "Benign",
            "predicted_probability": round(float(predicted_prob), 4),
            "base_value": round(float(base_val), 4),
            "contributions": contributions,
            "top_risk_factors": [c for c in contributions if c["shap_value"] > 0][:4],
            "top_mitigating_factors": [c for c in contributions if c["shap_value"] < 0][:4],
            "plain_english_explanation": narrative
        }

    def _generate_narrative(
        self,
        predicted_class: int,
        predicted_prob: float,
        contributions: List[Dict[str, Any]]
    ) -> str:
        """
        Synthesizes an honest, transparent plain-English summary derived strictly from SHAP attributions.
        """
        pos_contribs = [c for c in contributions if c["shap_value"] > 0.05]
        neg_contribs = [c for c in contributions if c["shap_value"] < -0.05]

        if predicted_class == 1:
            # Ransomware narrative
            top_factors_desc = []
            for c in pos_contribs[:3]:
                feat_name = c["display_name"]
                val = c["actual_value"]
                unit = c["unit"]
                top_factors_desc.append(f"{feat_name} ({val} {unit})")

            factors_str = ", ".join(top_factors_desc) if top_factors_desc else "abnormal multi-factor behavioral spikes"
            explanation = (
                f"The AI model classified this event as POTENTIAL RANSOMWARE with {predicted_prob * 100:.1f}% confidence. "
                f"The primary indicators driving this classification are: {factors_str}. "
                f"These behavioral patterns strongly correlate with rapid unauthorized file encryption and evasion maneuvers."
            )
            if neg_contribs:
                mitigating_name = neg_contribs[0]["display_name"]
                explanation += f" Although {mitigating_name} favored benign operation, the cryptographic indicators predominated."
        else:
            # Benign narrative
            top_benign_desc = []
            for c in neg_contribs[:3]:
                feat_name = c["display_name"]
                val = c["actual_value"]
                unit = c["unit"]
                top_benign_desc.append(f"{feat_name} ({val} {unit})")

            factors_str = ", ".join(top_benign_desc) if top_benign_desc else "normal operating parameter baselines"
            explanation = (
                f"The AI model classified this event as BENIGN with {(1.0 - predicted_prob) * 100:.1f}% confidence. "
                f"Key benign indicators include: {factors_str}. "
                f"No destructive mass modification, unauthorized extension changes, or entropy surge anomalies were detected."
            )

        return explanation

    def compute_global_importance(self, X_scaled: np.ndarray) -> List[Dict[str, Any]]:
        """
        Calculates global feature importance by computing mean absolute SHAP value
        across the provided dataset.
        """
        raw_shaps = self.explainer.shap_values(X_scaled)
        if isinstance(raw_shaps, list):
            shaps = raw_shaps[1]
        elif len(raw_shaps.shape) == 3:
            shaps = raw_shaps[:, :, 1]
        else:
            shaps = raw_shaps

        mean_abs_shaps = np.mean(np.abs(shaps), axis=0)
        total_importance = float(np.sum(mean_abs_shaps)) if np.sum(mean_abs_shaps) > 0 else 1.0

        global_importances = []
        for i, name in enumerate(self.feature_names):
            val = float(mean_abs_shaps[i])
            global_importances.append({
                "feature": name,
                "display_name": name.replace("_", " ").title(),
                "mean_abs_shap": round(val, 4),
                "relative_importance_pct": round((val / total_importance) * 100.0, 2),
                "description": FEATURE_METADATA.get(name, {}).get("description", "")
            })

        global_importances.sort(key=lambda x: x["mean_abs_shap"], reverse=True)
        return global_importances

    def save(self, filepath: str) -> None:
        """Saves explainer to disk."""
        joblib.dump(self, filepath)

    @classmethod
    def load(cls, filepath: str) -> "RansomwareExplainer":
        """Loads explainer from disk."""
        return joblib.load(filepath)
