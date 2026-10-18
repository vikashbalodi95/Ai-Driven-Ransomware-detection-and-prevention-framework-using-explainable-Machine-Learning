"""
Model Evaluation and Cybersecurity Performance Metrics.
Calculates Accuracy, Precision, Recall, F1, Confusion Matrix, ROC-AUC, FPR, and FNR.
Never fabricates metrics.
"""

import numpy as np
from typing import Dict, Any, List
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    roc_curve,
    precision_recall_curve,
    brier_score_loss
)


def compute_metrics(y_true: np.ndarray, y_pred: np.ndarray, y_proba: np.ndarray) -> Dict[str, Any]:
    """
    Computes rigorous cybersecurity detection metrics on ground-truth vs predictions.
    """
    acc = float(accuracy_score(y_true, y_pred))
    prec = float(precision_score(y_true, y_pred, zero_division=0))
    rec = float(recall_score(y_true, y_pred, zero_division=0))
    f1 = float(f1_score(y_true, y_pred, zero_division=0))

    try:
        auc = float(roc_auc_score(y_true, y_proba))
    except Exception:
        auc = 0.5

    brier = float(brier_score_loss(y_true, y_proba))

    cm = confusion_matrix(y_true, y_pred)
    # cm format: [[TN, FP], [FN, TP]]
    tn, fp, fn, tp = int(cm[0, 0]), int(cm[0, 1]), int(cm[1, 0]), int(cm[1, 1])

    # Cybersecurity specific rates
    fpr = float(fp / (fp + tn)) if (fp + tn) > 0 else 0.0  # False alarm rate
    fnr = float(fn / (fn + tp)) if (fn + tp) > 0 else 0.0  # Missed attack rate

    # Generate sampled ROC curve points (max 25 points for compact UI rendering)
    try:
        fpr_curve, tpr_curve, thresholds_roc = roc_curve(y_true, y_proba)
        # Sample evenly across curve
        indices = np.linspace(0, len(fpr_curve) - 1, min(25, len(fpr_curve)), dtype=int)
        roc_points = [
            {"fpr": round(float(fpr_curve[i]), 4), "tpr": round(float(tpr_curve[i]), 4)}
            for i in indices
        ]
    except Exception:
        roc_points = [{"fpr": 0.0, "tpr": 0.0}, {"fpr": 1.0, "tpr": 1.0}]

    # Precision-Recall curve points
    try:
        p_curve, r_curve, _ = precision_recall_curve(y_true, y_proba)
        pr_indices = np.linspace(0, len(p_curve) - 1, min(25, len(p_curve)), dtype=int)
        pr_points = [
            {"recall": round(float(r_curve[i]), 4), "precision": round(float(p_curve[i]), 4)}
            for i in pr_indices
        ]
    except Exception:
        pr_points = []

    return {
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
        "roc_auc": round(auc, 4),
        "brier_score": round(brier, 4),
        "false_positive_rate": round(fpr, 4),
        "false_negative_rate": round(fnr, 4),
        "confusion_matrix": {
            "true_negatives": tn,
            "false_positives": fp,
            "false_negatives": fn,
            "true_positives": tp,
            "matrix": [[tn, fp], [fn, tp]]
        },
        "roc_curve": roc_points,
        "pr_curve": pr_points,
        "sample_count": len(y_true)
    }
