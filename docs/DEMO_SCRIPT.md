# Project Demonstration Script & Presentation Guide

**Target Audience:** Final-Year B.Tech Capstone Project Evaluators, Professors, and External Examiners  
**Estimated Duration:** 12 – 15 Minutes

---

## 🎬 Act 1: Introduction & Problem Context (2 Minutes)

### Talking Points:
1. **The Hook:** *"Good morning, respected professors. Today, we are presenting our capstone project: **AI Ransomware Detection with Explainable AI (XAI)**."*
2. **The Problem:** *"Traditional antivirus solutions fail against zero-day ransomware because attackers mutate hashes and obfuscate binary signatures. While machine learning can detect suspicious behavior, ML models have historically been black-boxes. A security analyst cannot blindly trust a system that might isolate a critical production server without explaining why."*
3. **Our Contribution:** *"Our system solves this by analyzing **run-time behavioral indicators**—such as Shannon entropy spikes, file rename frequency, and canary file tampering—and pairing each detection with **mathematically rigorous Explainable AI via TreeSHAP** to give analysts transparent, plain-English justifications."*

---

## 🖥️ Act 2: Executive SOC Dashboard Tour (3 Minutes)

### Action on Screen:
- Open `http://127.0.0.1:5173/` on the **Overview** tab.

### Talking Points:
1. **KPI Metrics:**
   - *"Here is our Security Operations Center dashboard. Notice the executive summary cards: Total Telemetry Analyzed, Ransomware Incursions Detected, Benign Processes Monitored, and Active Alerts."*
2. **Chronological Threat Stream:**
   - Point to the **Chronological Threat Stream Activity** area chart:
   - *"The area chart visualizes system activity over time. Notice the normal green baseline of benign activity, interrupted by a sharp red spike representing an attack burst."*
3. **Recent Telemetry Table:**
   - *"Below the chart, we have the live feed of monitored process operations, displaying process names, PIDs, risk scores, and initial heuristic verdicts."*

---

## 🔍 Act 3: Deep Drill-Down into Explainable AI (XAI) (4 Minutes)

### Action on Screen:
- In the Recent Telemetry table, find an event labeled `Ransomware` (e.g., `wncry_payload.exe` or `svchost_updater.exe`) and click **"Inspect"**.

### Talking Points:
1. **The Inspector Modal:**
   - *"When an analyst clicks an event, the system opens our Explainability Inspector. Notice the three key sections:"*
   - **Section 1: Risk & Severity:** *"The model assigned a 100/100 risk score and mapped it to the Critical severity tier."*
   - **Section 2: Plain-English AI Verdict:** *"Read this narrative—it is not hardcoded. The system synthesized this explanation directly from the model's actual SHAP attributions: 'The model classified this event as POTENTIAL RANSOMWARE with 99.9% confidence. The primary indicators driving this classification are: File Rename Rate (160 files/sec), Suspicious Extension Ratio (0.95), and Entropy Change Mean (+3.82 bits/byte)...'"*
2. **The SHAP Waterfall Chart:**
   - Point to the horizontal bar chart:
   - *"Here is the mathematical heart of our project—the SHAP Waterfall Attribution. Bars in crimson (+SHAP) push the model's probability toward Ransomware, while bars in emerald (-SHAP) push it toward Benign. Notice how file renaming and Shannon entropy delta strongly drove the decision."*
3. **Close Modal:**
   - Click **"Close Inspector"**.

---

## 🔬 Act 4: Explainability Center & What-If Sandbox (3 Minutes)

### Action on Screen:
- Click the **"Explainability & XAI"** tab in the top navigation bar.

### Talking Points:
1. **Global Feature Importance:**
   - *"On this tab, we observe the model-wide global feature importance calculated across the entire dataset. Notice that File Rename Rate, Suspicious Extension Ratio, and Shannon Entropy Delta represent over 70% of the overall model influence."*
2. **Interactive What-If Sandbox:**
   - Scroll down to the **What-If Predictor**.
   - Click the **"WannaCry Burst"** preset button.
   - Point out how the sliders automatically move (File Modification Rate: 195, Entropy Delta: +3.75, Canary Tripped: Checked).
   - Click **"Execute What-If Inference"**.
   - Show how the prediction, risk score (100 Critical), narrative, and SHAP waterfall chart update instantly.
3. **Try a Benign Compiler Case:**
   - Click **"Benign Normal"** preset and click **"Execute What-If Inference"**.
   - Show that despite moderate modification activity, low entropy and untouched canaries result in a Benign verdict and green bars in the waterfall.

---

## ⚡ Act 5: Controlled Simulation Sandbox (2 Minutes)

### Action on Screen:
- Click the **"Simulation Sandbox"** tab in the top navigation bar.

### Talking Points:
1. **Safety Assurance:**
   - *"To allow safe evaluation without endangering the host system, we implemented an isolated simulation sandbox. It exercises the actual inference pipeline with realistic telemetry without damaging user files."*
2. **Run Simulation:**
   - Select **"Aggressive Crypto-Ransomware (LockBit 3.0 / WannaCry)"**.
   - Set Event Count to `8` and click **"Launch Simulation Sandbox"**.
   - Watch the live terminal feed populate events in real-time as each event is evaluated by the backend ML model.
   - Click **"XAI"** on any streamed row in the terminal to inspect its live SHAP attributions.

---

## 📋 Act 6: Incident Triage & Audit Trail (1 Minute)

### Action on Screen:
- Click the **"Alerts & Audit"** tab.

### Talking Points:
1. **Alert Management:**
   - *"Suspicious events automatically trigger security alerts. Here, the SOC analyst can change alert status from `NEW` to `ACKNOWLEDGED` or `RESOLVED`, append containment notes, and export an auditable CSV log for compliance."*
   - Click **"Download Audit CSV"** to demonstrate log export.

---

## 🎓 Expected Viva / Q&A Defense

**Q1: Why did you use behavioral features instead of static binary features like EMBER?**  
*Answer:* "Static PE headers can be easily packed or encrypted by threat actors. Behavioral features—specifically Shannon entropy deltas and file renaming—capture the physical, unavoidable reality of ransomware: it must encrypt and overwrite files."

**Q2: What is the computational overhead of TreeSHAP during live inference?**  
*Answer:* "TreeSHAP calculates exact Shapley values in polynomial time $O(TLD^2)$. For our 100-tree XGBoost model with depth 6, computing local explanations takes less than 15 milliseconds, making it suitable for real-time SOC alerting."

**Q3: How do you prevent False Positives from compiler builds or backup utilities?**  
*Answer:* "A developer compiling code writes many files and uses high CPU, but the Shannon entropy delta of compiled binaries remains low ($\Delta H < 0.5$) and canary files remain untouched. Our tree ensemble learns these orthogonal decision boundaries, avoiding false alarms."
