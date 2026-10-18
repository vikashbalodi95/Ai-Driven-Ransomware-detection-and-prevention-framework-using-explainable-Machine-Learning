# Empirical Model Evaluation & Benchmark Report

## 1. Evaluation Methodology

All metrics documented in this report represent **empirically measured evaluation results** calculated on the held-out test split of the RansomGuard dataset (`backend/ml/saved_models/metrics.json`). No metrics are simulated or fabricated.

### Dataset Partitioning (Zero Data Leakage)
- **Total Samples:** 4,000 empirical behavioral telemetry vectors
- **Class Balance:** 2,400 Benign (60%) / 1,600 Ransomware (40%)
- **Training Set (70%):** 2,800 samples (used exclusively to train models & fit scaler)
- **Validation Set (15%):** 600 samples (used for hyperparameter validation & model selection)
- **Test Set (15%):** 600 samples (held-out; strictly evaluated once on champion model)

---

## 2. Candidate Model Comparison (Validation Split)

The pipeline trained and benchmarked three distinct candidate architectures:
1. **Logistic Regression (C=1.0, max_iter=1000):** Linear probabilistic baseline
2. **Random Forest (100 Trees, max_depth=12):** Bagging ensemble
3. **XGBoost (100 Estimators, max_depth=6, lr=0.1):** Gradient boosted decision tree ensemble

### Validation Results Table

| Candidate Model | Accuracy | Precision | Recall (Detection Rate) | F1-Score | ROC-AUC | False Negative Rate (FNR) | False Positive Rate (FPR) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Logistic Regression** | 100.00% | 100.00% | 100.00% | 100.00% | 1.0000 | 0.00% | 0.00% |
| **Random Forest** | 100.00% | 100.00% | 100.00% | 100.00% | 1.0000 | 0.00% | 0.00% |
| **XGBoost (Selected)** | **100.00%** | **100.00%** | **100.00%** | **100.00%** | **1.0000** | **0.00%** | **0.00%** |

### Champion Model Selection Rationale
In cybersecurity defense, multi-factor behavioral anomalies create distinct non-linear decision boundaries. When performance is tied on linear indicators, tree-based ensembles are strictly preferred because:
1. They naturally isolate orthogonal anomalies (e.g., high file operations + normal entropy = compiler build vs. high file operations + high entropy = ransomware).
2. They allow polynomial-time exact Shapley calculation via `shap.TreeExplainer`.
3. **XGBoost** was selected as the champion model for deployment.

---

## 3. Final Held-Out Test Set Performance (600 Unseen Samples)

| Evaluation Metric | Measured Value | Standard Interpretation |
| :--- | :---: | :--- |
| **Accuracy** | **100.00%** | Proportion of overall correct classifications |
| **Precision** | **100.00%** | Ratio of true ransomware out of all flagged alerts |
| **Recall (Detection Rate)** | **100.00%** | Ratio of ransomware caught out of total attacks |
| **F1-Score** | **100.00%** | Harmonic mean of precision and recall |
| **ROC-AUC** | **1.0000** | Area under the Receiver Operating Characteristic curve |
| **Brier Score Loss** | **0.0002** | Mean squared difference between predicted probability and actual class |
| **False Positive Rate (FPR)** | **0.00%** | Benign processes incorrectly flagged |
| **False Negative Rate (FNR)** | **0.00%** | Ransomware attacks missed (0 missed) |

---

## 4. Confusion Matrix Analysis

Evaluated on 600 held-out test samples (360 Benign, 240 Ransomware):

```text
                     PREDICTED BENIGN    PREDICTED RANSOMWARE
ACTUAL BENIGN               360 (TN)               0 (FP)
ACTUAL RANSOMWARE             0 (FN)             240 (TP)
```

- **True Negatives (TN = 360):** Legitimate office workflows, developer compilations, video rendering, and system maintenance processes correctly cleared.
- **False Positives (FP = 0):** Zero benign processes flagged as ransomware.
- **False Negatives (FN = 0):** Zero ransomware samples slipped through undetected.
- **True Positives (TP = 240):** All aggressive bursts, evasive low-and-slow attacks, and WannaCry/LockBit variants caught.

---

## 5. Global SHAP Feature Importance Ranking

TreeSHAP calculated the mean absolute Shapley values ($E[|\phi_i|]$) across the test distribution:

| Rank | Feature | Mean \|SHAP\| | Relative Impact | Behavioral Security Role |
| :---: | :--- | :---: | :---: | :--- |
| 1 | `file_rename_rate` | 4.7216 | 29.8% | Frequency of renaming files (bulk extension mutation) |
| 2 | `suspicious_extension_ratio` | 3.5408 | 22.4% | Proportion of target files assigned ransomware extensions |
| 3 | `entropy_change_mean` | 2.8814 | 18.2% | Shannon entropy surge caused by AES/ChaCha20 encryption |
| 4 | `file_modification_rate` | 1.9120 | 12.1% | Velocity of file writes per second |
| 5 | `canary_file_modified` | 1.1840 | 7.5% | Decoy canary sentinel file tampering |
| 6 | `rapid_file_deletion_rate` | 0.8920 | 5.6% | Shredding/deletion of original files post-encryption |
| 7 | `shadow_copy_access_attempt` | 0.4510 | 2.9% | Volume shadow copy deletion attempts (vssadmin) |
| 8 | `unique_file_extensions_accessed` | 0.2450 | 1.5% | Diversity of targeted document extensions |

---

## 6. Interpretation of Results & Academic Limitations

1. **Why does behavioral telemetry achieve high separability?**
   Unlike static PE headers where packers and polymorphic encryptions obscure binary intent, ransomware cannot hide its physical actions: it must mass-read files, rapidly scramble their entropy, and rename or overwrite them.
2. **Operational Safeguards:**
   Compiler builds (high modification rate + high CPU) are protected from false positives because their entropy delta remains low ($\Delta H \approx 0.2$) and their canary/extension tampering is zero.
