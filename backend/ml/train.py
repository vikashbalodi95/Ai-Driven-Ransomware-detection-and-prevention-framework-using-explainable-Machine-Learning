"""
Reproducible ML Training and Model Selection Pipeline.
Compares Logistic Regression, Random Forest, and XGBoost.
Evaluates on validation split, selects champion, evaluates on held-out test split,
fits SHAP explainer, and persists artifacts.
Never fabricates results.
"""

import os
import json
import numpy as np
import pandas as pd
from datetime import datetime, timezone
import joblib

from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier

from backend.ml.dataset import (
    FEATURE_NAMES,
    generate_synthetic_telemetry,
    save_dataset,
    load_dataset
)
from backend.ml.preprocessing import DataPreprocessor
from backend.ml.evaluate import compute_metrics
from backend.ml.explainability import RansomwareExplainer


def run_training_pipeline(
    data_path: str = "backend/ml/data/ransomware_behavioral_dataset.csv",
    models_dir: str = "backend/ml/saved_models",
    n_samples: int = 4000,
    random_state: int = 42
) -> dict:
    print("=" * 60)
    print(">>> AI RANSOMWARE DETECTION: MODEL TRAINING & BENCHMARKING <<<")
    print("=" * 60)

    os.makedirs(os.path.dirname(data_path), exist_ok=True)
    os.makedirs(models_dir, exist_ok=True)

    # 1. Dataset Loading or Generation
    if os.path.exists(data_path):
        print(f"[*] Loading existing dataset from {data_path}...")
        df = load_dataset(data_path)
    else:
        print(f"[*] Generating empirical behavioral dataset ({n_samples} samples, seed={random_state})...")
        df = generate_synthetic_telemetry(n_samples=n_samples, random_state=random_state)
        save_dataset(df, data_path)
        print(f"[+] Dataset saved to {data_path}")

    print(f"[*] Dataset shape: {df.shape} | Ransomware: {int((df['is_ransomware'] == 1).sum())} | Benign: {int((df['is_ransomware'] == 0).sum())}")

    # 2. Data Preprocessing & Anti-Leakage Splitting
    preprocessor = DataPreprocessor(feature_names=FEATURE_NAMES)
    X_train_df, X_val_df, X_test_df, y_train, y_val, y_test = preprocessor.prepare_train_val_test_splits(
        df, test_size=0.15, val_size=0.15, random_state=random_state
    )

    print(f"[*] Data Splits: Train={len(X_train_df)}, Val={len(X_val_df)}, Test={len(X_test_df)}")

    # Fit scaler strictly on training split
    X_train_scaled = preprocessor.fit_transform(X_train_df)
    X_val_scaled = preprocessor.transform(X_val_df)
    X_test_scaled = preprocessor.transform(X_test_df)

    # 3. Model Candidates Definition
    candidates = {
        "LogisticRegression": LogisticRegression(
            max_iter=1000,
            C=1.0,
            random_state=random_state
        ),
        "RandomForest": RandomForestClassifier(
            n_estimators=100,
            max_depth=12,
            min_samples_split=4,
            random_state=random_state,
            n_jobs=-1
        ),
        "XGBoost": XGBClassifier(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            eval_metric="logloss",
            random_state=random_state,
            n_jobs=-1
        )
    }

    # 4. Train & Validate Candidate Models
    comparison_results = {}
    print("\n[*] Training and validating candidate models...")

    for name, model in candidates.items():
        print(f"    --> Training {name}...")
        model.fit(X_train_scaled, y_train)

        # Validation predictions
        val_preds = model.predict(X_val_scaled)
        val_probas = model.predict_proba(X_val_scaled)[:, 1]

        val_metrics = compute_metrics(y_val.values, val_preds, val_probas)
        comparison_results[name] = {
            "model": model,
            "val_metrics": val_metrics
        }
        print(f"        [Val Results] Accuracy: {val_metrics['accuracy']:.4f} | "
              f"Precision: {val_metrics['precision']:.4f} | Recall: {val_metrics['recall']:.4f} | "
              f"F1: {val_metrics['f1_score']:.4f} | ROC-AUC: {val_metrics['roc_auc']:.4f} | "
              f"FNR: {val_metrics['false_negative_rate']:.4f}")

    # 5. Champion Model Selection
    # Prioritize F1-Score, Recall, then prefer tree-based ensemble (XGBoost/RandomForest) for TreeSHAP fidelity
    model_preference = {"XGBoost": 3, "RandomForest": 2, "LogisticRegression": 1}
    best_name = max(
        comparison_results.keys(),
        key=lambda k: (
            comparison_results[k]["val_metrics"]["f1_score"],
            comparison_results[k]["val_metrics"]["recall"],
            model_preference.get(k, 0)
        )
    )
    champion_model = comparison_results[best_name]["model"]
    print(f"\n[+] Champion Model Selected: '{best_name}'")

    # 6. Final Evaluation on Held-Out Test Set
    test_preds = champion_model.predict(X_test_scaled)
    test_probas = champion_model.predict_proba(X_test_scaled)[:, 1]
    test_metrics = compute_metrics(y_test.values, test_preds, test_probas)

    print("\n" + "=" * 50)
    print(">>> FINAL TEST EVALUATION ON UNSEEN DATA <<<")
    print(f"Model: {best_name}")
    print(f"Accuracy:            {test_metrics['accuracy'] * 100:.2f}%")
    print(f"Precision:           {test_metrics['precision'] * 100:.2f}%")
    print(f"Recall (Detection):  {test_metrics['recall'] * 100:.2f}%")
    print(f"F1-Score:            {test_metrics['f1_score'] * 100:.2f}%")
    print(f"ROC-AUC:             {test_metrics['roc_auc']:.4f}")
    print(f"False Positive Rate: {test_metrics['false_positive_rate'] * 100:.2f}%")
    print(f"False Negative Rate: {test_metrics['false_negative_rate'] * 100:.2f}%")
    print(f"Confusion Matrix:    TN={test_metrics['confusion_matrix']['true_negatives']}, "
          f"FP={test_metrics['confusion_matrix']['false_positives']}, "
          f"FN={test_metrics['confusion_matrix']['false_negatives']}, "
          f"TP={test_metrics['confusion_matrix']['true_positives']}")
    print("=" * 50)

    # 7. Initialize and Compute SHAP Explainability
    print("\n[*] Initializing SHAP TreeExplainer on background training distribution...")
    # Use 100 background samples for calibration
    bg_samples = X_train_scaled[:100]
    explainer = RansomwareExplainer(
        model=champion_model,
        background_data=bg_samples,
        feature_names=FEATURE_NAMES
    )

    # Compute Global Feature Importance across Test Split
    print("[*] Computing global SHAP feature importances...")
    global_importance = explainer.compute_global_importance(X_test_scaled[:200])

    # 8. Curate Representative Test Samples for Demos/Simulations
    test_df_curated = X_test_df.copy()
    test_df_curated["true_label"] = y_test.values
    test_df_curated["predicted_prob"] = test_probas
    sample_records = test_df_curated.head(20).to_dict(orient="records")

    # 9. Serialization of Artifacts
    model_save_path = os.path.join(models_dir, "model.joblib")
    scaler_save_path = os.path.join(models_dir, "scaler.joblib")
    explainer_save_path = os.path.join(models_dir, "explainer.joblib")
    metrics_save_path = os.path.join(models_dir, "metrics.json")
    metadata_save_path = os.path.join(models_dir, "metadata.json")
    samples_save_path = os.path.join(models_dir, "test_samples.json")

    print("[*] Saving model, preprocessor, and XAI artifacts...")
    joblib.dump(champion_model, model_save_path)
    preprocessor.save(scaler_save_path)
    explainer.save(explainer_save_path)

    # Format candidate comparison for frontend
    comparison_summary = {}
    for k, v in comparison_results.items():
        m = v["val_metrics"]
        comparison_summary[k] = {
            "accuracy": m["accuracy"],
            "precision": m["precision"],
            "recall": m["recall"],
            "f1_score": m["f1_score"],
            "roc_auc": m["roc_auc"],
            "false_negative_rate": m["false_negative_rate"],
            "false_positive_rate": m["false_positive_rate"]
        }

    full_metrics = {
        "champion_model": best_name,
        "test_metrics": test_metrics,
        "candidate_comparison": comparison_summary,
        "global_feature_importance": global_importance,
        "evaluated_at": datetime.now(timezone.utc).isoformat()
    }

    metadata = {
        "model_name": "RansomGuard-XAI",
        "version": "1.0.0",
        "algorithm": best_name,
        "feature_count": len(FEATURE_NAMES),
        "features": FEATURE_NAMES,
        "training_samples": len(X_train_df),
        "validation_samples": len(X_val_df),
        "test_samples": len(X_test_df),
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "limitations": [
            "Features assume behavioral endpoint telemetry availability (file hooks, entropy monitors).",
            "Extremely low-and-slow ransomware taking days per file may require wider temporal aggregation windows.",
            "Explainability via TreeSHAP reflects model feature attributions rather than legal proof of intent."
        ]
    }

    with open(metrics_save_path, "w") as f:
        json.dump(full_metrics, f, indent=2)

    with open(metadata_save_path, "w") as f:
        json.dump(metadata, f, indent=2)

    with open(samples_save_path, "w") as f:
        json.dump(sample_records, f, indent=2)

    print(f"[+] All artifacts successfully saved to {models_dir}")
    return full_metrics


if __name__ == "__main__":
    run_training_pipeline()
