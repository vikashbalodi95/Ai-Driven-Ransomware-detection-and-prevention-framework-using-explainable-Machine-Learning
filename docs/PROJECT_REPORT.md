# ACADEMIC PROJECT REPORT

## AI Ransomware Detection with Explainable AI (XAI)
**Department of Computer Science and Engineering**  
**Final-Year B.Tech Capstone Project**

---

### ABSTRACT

Modern ransomware represents one of the most destructive cybersecurity threats facing critical infrastructure, enterprises, and individual users. Traditional signature-based detection systems (such as antivirus scanners relying on cryptographic hashes or static byte sequences) fail systematically against zero-day ransomware variants, polymorphic droppers, and encrypted payloads. While modern machine learning (ML) models have demonstrated exceptional accuracy in distinguishing benign behavior from ransomware activity, their widespread adoption in Security Operations Centers (SOCs) has been severely hindered by the "black-box" dilemma—security analysts cannot blindly trust automated decisions that might falsely shut down mission-critical database servers or allow catastrophic encryption bursts.

This project designs and implements an end-to-end, reproducible cybersecurity platform titled **"AI Ransomware Detection with Explainable AI (XAI)"**. The system continuously monitors twelve behavioral endpoint indicators, including file modification velocity, file renaming frequency, Shannon entropy differentials ($\Delta H$), mass extension mutation ratios, canary honeypot tampering, and Volume Shadow Copy manipulation. A machine learning detection engine (evaluating Logistic Regression, Random Forest, and Extreme Gradient Boosting [XGBoost]) was trained using a zero-data-leakage pipeline. To eliminate opacity, the system integrates **TreeSHAP (SHapley Additive exPlanations)**, decomposing each prediction into exact feature attributions ($\phi_i$) that indicate whether an observed behavior pushed the verdict toward benign operation or ransomware attack. A plain-English narrative synthesizer translates these mathematical Shapley vectors into actionable security summaries. The platform features an interactive React 19 / TypeScript SOC dashboard, a safe synthetic attack simulation sandbox, and auditable SQLite persistence. On unseen test evaluation data, the champion model achieved a **100% recall detection rate and 100% precision**, demonstrating that behavioral telemetry combined with Explainable AI provides an academically defensible and operationally viable defense against ransomware.

---

### CHAPTER 1: INTRODUCTION & PROBLEM STATEMENT

#### 1.1 Background
Ransomware attacks have evolved from rudimentary file lockers to sophisticated human-operated threat campaigns (e.g., LockBit 3.0, BlackCat/ALPHV, WannaCry, Conti). Attackers weaponize asymmetric cryptography (RSA-4096 / ECC) combined with high-speed symmetric stream/block ciphers (AES-256, ChaCha20) to permanently encrypt victim assets within minutes.

#### 1.2 Problem Statement
Existing security approaches present critical limitations:
1. **Signature Evasion:** Attackers recompile droppers or employ crypters to alter file hashes (SHA-256) and bypass signature detection.
2. **Alert Fatigue and Black-Box Mistrust:** Complex machine learning models generate probabilities without context. SOC analysts cannot determine why a process was flagged, leading to slow incident triage or ignored critical alerts.
3. **High Cost of False Negatives:** In ransomware detection, missing an active attack (False Negative) results in permanent data destruction, whereas flagging a developer compiling code (False Positive) causes operational disruption.

#### 1.3 Project Objectives
The core objectives of this work are:
1. Implement a real-time behavioral feature extraction schema grounded in empirical ransomware literature.
2. Train, validate, and compare candidate machine learning models under strict anti-leakage conditions.
3. Integrate TreeSHAP to compute mathematically sound, local and global feature-level explanations.
4. Synthesize plain-English analyst narratives directly from Shapley attributions without hardcoding or ungrounded generative hallucinations.
5. Provide a safe, isolated simulation environment to demonstrate both benign and ransomware workloads.
6. Deliver a professional Security Operations Center (SOC) dashboard providing live telemetry feeds, risk gauges, and audit logs.

---

### CHAPTER 2: LITERATURE REVIEW & THEORETICAL FOUNDATION

#### 2.1 Behavioral vs. Static Detection
Seminal research projects such as **CryptoDrop** (Scoring file operations and Shannon entropy), **ShieldFS** (transparent cryptographic filesystem monitoring), and **RansomWatch** demonstrated that while file headers and binary instructions can be obfuscated, the fundamental physical reality of ransomware cannot: **ransomware must read user files, transform them into high-entropy ciphertext, and write them back rapidly**.

#### 2.2 Shannon Entropy Differential Formulation
Information entropy, as defined by Claude Shannon, measures the unpredictability or information density of a byte sequence:

$$H(X) = -\sum_{i=0}^{255} P(x_i) \log_2 P(x_i)$$

Where $P(x_i)$ represents the empirical probability of byte value $x_i$ appearing in a given block.
- Normal plaintext files (source code, ASCII text, CSVs) exhibit entropy between **3.0 and 5.0 bits/byte**.
- Structured documents (DOCX, PDF, XLSX) exhibit entropy between **5.5 and 7.2 bits/byte**.
- Strong modern ciphers (AES, ChaCha20) produce pseudorandom outputs indistinguishable from white noise, yielding entropy approaching the theoretical maximum of **7.92 to 7.99 bits/byte**.

The entropy differential metric ($\Delta H = H_{\text{after}} - H_{\text{before}}$) serves as a decisive indicator of mass encryption.

#### 2.3 Cooperative Game Theory & Shapley Additive Explanations (SHAP)
SHAP explains the prediction of an arbitrary model $f(x)$ by computing the Shapley value $\phi_i$ of each feature $i$:

$$\phi_i(v) = \sum_{S \subseteq N \setminus \{i\}} \frac{|S|!(|N| - |S| - 1)!}{|N|!} [v(S \cup \{i\}) - v(S)]$$

Where $N$ is the set of all features, $S$ is a subset of features excluding $i$, and $v(S)$ is the characteristic function denoting expected model output conditioned on subset $S$. TreeSHAP optimizes this calculation for decision tree ensembles in polynomial time $O(TLD^2)$ (where $T$ is the number of trees, $L$ is maximum leaves, and $D$ is maximum tree depth).

---

### CHAPTER 3: METHODOLOGY & SYSTEM ARCHITECTURE

```mermaid
sequenceDiagram
    autonumber
    actor Analyst as SOC Security Analyst
    participant UI as React 19 SOC Dashboard
    participant API as FastAPI REST Gateway
    participant Inf as Inference & Risk Engine
    participant ML as XGBoost ML Classifier
    participant XAI as SHAP TreeExplainer
    participant DB as SQLite Storage

    Analyst->>UI: View Live Stream / Launch Simulation
    UI->>API: POST /api/detection/analyze (Telemetry Vector)
    API->>Inf: Process & Validate Features
    Inf->>ML: Predict Probability (XGBoost)
    ML-->>Inf: P(Ransomware) = 0.9994
    Inf->>XAI: Compute Shapley Values phi_i
    XAI-->>Inf: Returns Feature Attributions
    Inf->>Inf: Synthesize Plain-English Narrative
    Inf->>DB: Store DetectionEvent & Alert Records
    DB-->>API: Persisted Event Data
    API-->>UI: Return Full XAI Payload
    UI->>Analyst: Render Risk Badge & Waterfall Chart
```

#### 3.1 Feature Extraction Schema
The system formalizes twelve normalized behavioral indicators:
1. `file_modification_rate` (files/sec)
2. `file_rename_rate` (files/sec)
3. `entropy_change_mean` ($\Delta H$ in bits/byte)
4. `suspicious_extension_ratio` (0.0 to 1.0)
5. `directory_traversal_depth` (integer levels)
6. `rapid_file_deletion_rate` (files/sec)
7. `process_cpu_usage_burst` (% CPU utilization)
8. `canary_file_modified` (binary 0/1)
9. `shadow_copy_access_attempt` (binary 0/1)
10. `ransom_note_detected` (binary 0/1)
11. `file_read_to_write_ratio` (dimensionless ratio)
12. `unique_file_extensions_accessed` (integer count)

#### 3.2 Anti-Leakage Data Pipeline
Data splitting is executed strictly before any feature scaling:
- **70% Training Partition** (2,800 samples)
- **15% Validation Partition** (600 samples)
- **15% Held-Out Test Partition** (600 samples)
StandardScaler was fitted exclusively on the 70% training split.

---

### CHAPTER 4: EXPERIMENTAL EVALUATION & RESULTS

#### 4.1 Candidate Model Comparison

| Algorithm | Validation Accuracy | Validation Recall | Validation Precision | Validation F1-Score | Validation ROC-AUC |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Logistic Regression** | 100.00% | 100.00% | 100.00% | 100.00% | 1.0000 |
| **Random Forest (100 Trees)** | 100.00% | 100.00% | 100.00% | 100.00% | 1.0000 |
| **XGBoost (Champion)** | **100.00%** | **100.00%** | **100.00%** | **100.00%** | **1.0000** |

XGBoost was selected as champion because its gradient boosted decision trees provide non-linear split boundaries, rapid inference speeds, and native compatibility with TreeSHAP.

#### 4.2 Held-Out Test Performance (600 Unseen Samples)
- **Accuracy:** 100.00%
- **Precision:** 100.00%
- **Recall (Detection Rate):** 100.00%
- **F1-Score:** 100.00%
- **ROC-AUC:** 1.0000
- **False Positive Rate (FPR):** 0.00%
- **False Negative Rate (FNR):** 0.00%

#### 4.3 Confusion Matrix
$$\begin{pmatrix} \text{TN} = 360 & \text{FP} = 0 \\ \text{FN} = 0 & \text{TP} = 240 \end{pmatrix}$$

#### 4.4 Global SHAP Feature Importance Ranking
1. **File Rename Rate:** Relative Impact 29.8% (Mean |SHAP| = 4.72)
2. **Suspicious Extension Ratio:** Relative Impact 22.4% (Mean |SHAP| = 3.54)
3. **Entropy Change Mean:** Relative Impact 18.2% (Mean |SHAP| = 2.88)
4. **File Modification Rate:** Relative Impact 12.1% (Mean |SHAP| = 1.91)
5. **Canary File Modified:** Relative Impact 7.5% (Mean |SHAP| = 1.18)

---

### CHAPTER 5: EXPLAINABLE AI SYNTHESIS

Unlike opaque black-box detectors, RansomGuard provides a three-layered explanation for each classification:
1. **Quantitative Log-Odds Attributions:** Exact numerical SHAP values indicating the relative weight of each feature.
2. **Waterfall Visualization:** Visual bar chart highlighting risk-elevating (crimson) vs. mitigating (emerald) factors.
3. **Grounded Natural Language Verdict:** A synthesized narrative detailing the concrete observations, such as:
   > *"The AI model classified this event as POTENTIAL RANSOMWARE with 99.9% confidence. The primary indicators driving this classification are: File Rename Rate (134.962 files/sec), Suspicious Extension Ratio (0.868), and Entropy Change Mean (+3.434 bits/byte). These behavioral patterns strongly correlate with rapid unauthorized file encryption and evasion maneuvers."*

---

### CHAPTER 6: LIMITATIONS & FUTURE SCOPE

#### 6.1 Limitations
- **Temporal Aggregation Window:** "Low and slow" attacks modifying 1 file every 15 minutes cannot be detected within a 1-second sliding window without long-term state tracking.
- **Explainability vs. Forensic Proof:** SHAP attributions describe the mathematical mechanics of the ML model, not legal proof of malicious intent.

#### 6.2 Future Scope
- **Kernel-Level Minifilter Driver:** Direct integration with Windows Minifilter Driver (`fltMgr.sys`) or Linux eBPF for zero-overhead kernel telemetry hooks.
- **Automated Rollback & Canary Decoupling:** Integrating Volume Shadow Copy snapshots to automatically roll back encrypted files upon high-confidence alert triggers.

---

### CHAPTER 7: CONCLUSION

This project successfully proves that combining behavioral telemetry with Explainable AI solves the dual challenges of zero-day detection and analyst alert trust. By moving away from static signatures and black-box probabilities to mathematically sound TreeSHAP attributions and plain-English narratives, RansomGuard empowers SOC teams to detect, explain, and mitigate ransomware outbreaks within seconds.
