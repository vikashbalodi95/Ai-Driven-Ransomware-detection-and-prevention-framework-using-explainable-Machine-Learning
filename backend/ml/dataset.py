"""
Dataset generation, validation, and loading for Ransomware Behavioral Telemetry.
Calibrated against empirical distributions from cybersecurity literature
(RansomWatch, CryptoDrop, and behavioral endpoint telemetry).
"""

import os
import numpy as np
import pandas as pd
from typing import Tuple, List, Dict, Any

FEATURE_NAMES: List[str] = [
    "file_modification_rate",        # files/sec
    "file_rename_rate",              # files/sec
    "entropy_change_mean",           # Shannon entropy delta (-1.0 to 4.5)
    "suspicious_extension_ratio",    # fraction of files given .locked, .crypto, etc.
    "directory_traversal_depth",     # max folder depth traversed
    "rapid_file_deletion_rate",       # files/sec deleted (shredded)
    "process_cpu_usage_burst",       # % CPU burst during encryption loops
    "canary_file_modified",          # 0 or 1 (decoy file tampering)
    "shadow_copy_access_attempt",    # 0 or 1 (vssadmin delete shadows, etc.)
    "ransom_note_detected",          # 0 or 1 (HOW_TO_DECRYPT, README_RESTORE)
    "file_read_to_write_ratio",      # ratio of read bytes to written bytes
    "unique_file_extensions_accessed" # number of distinct target extensions
]

FEATURE_METADATA: Dict[str, Dict[str, Any]] = {
    "file_modification_rate": {
        "unit": "files/sec",
        "description": "Rate of file modifications per second during the monitoring window",
        "benign_range": [0.0, 5.0],
        "ransomware_range": [25.0, 350.0]
    },
    "file_rename_rate": {
        "unit": "files/sec",
        "description": "Frequency of file renaming operations (common during mass extension tampering)",
        "benign_range": [0.0, 1.0],
        "ransomware_range": [15.0, 250.0]
    },
    "entropy_change_mean": {
        "unit": "Delta H (bits/byte)",
        "description": "Mean Shannon entropy differential between original and modified file blocks",
        "benign_range": [-0.5, 0.8],
        "ransomware_range": [2.2, 4.2]
    },
    "suspicious_extension_ratio": {
        "unit": "ratio (0.0 - 1.0)",
        "description": "Fraction of target files assigned known ransomware or randomized extensions",
        "benign_range": [0.0, 0.0],
        "ransomware_range": [0.45, 1.0]
    },
    "directory_traversal_depth": {
        "unit": "levels",
        "description": "Maximum directory nesting depth accessed in the process working tree",
        "benign_range": [1, 4],
        "ransomware_range": [5, 16]
    },
    "rapid_file_deletion_rate": {
        "unit": "files/sec",
        "description": "Rate of unlinking/deleting original files post-encryption",
        "benign_range": [0.0, 0.5],
        "ransomware_range": [5.0, 120.0]
    },
    "process_cpu_usage_burst": {
        "unit": "% CPU",
        "description": "Peak CPU consumption during cryptographic encryption loops",
        "benign_range": [1.0, 35.0],
        "ransomware_range": [65.0, 100.0]
    },
    "canary_file_modified": {
        "unit": "binary flag",
        "description": "Indicates whether sentinel/decoy canary trap files were modified",
        "benign_range": [0, 0],
        "ransomware_range": [0, 1]
    },
    "shadow_copy_access_attempt": {
        "unit": "binary flag",
        "description": "Tampering with Volume Shadow Copies (e.g., vssadmin delete shadows)",
        "benign_range": [0, 0],
        "ransomware_range": [0, 1]
    },
    "ransom_note_detected": {
        "unit": "binary flag",
        "description": "Creation of ransom payment instruction files (.txt/.hta/.html)",
        "benign_range": [0, 0],
        "ransomware_range": [0, 1]
    },
    "file_read_to_write_ratio": {
        "unit": "ratio",
        "description": "Symmetry ratio of bytes read to bytes written in mass operations",
        "benign_range": [0.05, 4.5],
        "ransomware_range": [0.88, 1.15]
    },
    "unique_file_extensions_accessed": {
        "unit": "count",
        "description": "Diversity of targeted file extensions (.docx, .pdf, .db, .xlsx, .jpg)",
        "benign_range": [1, 4],
        "ransomware_range": [8, 30]
    }
}


def generate_synthetic_telemetry(n_samples: int = 4000, random_state: int = 42) -> pd.DataFrame:
    """
    Generates a realistic, statistically grounded dataset of ransomware vs benign behavioral telemetry.
    Includes edge cases (e.g. video rendering, compiler builds, backup utilities)
    to test classifier robustness against real-world false positives.
    """
    rng = np.random.RandomState(random_state)
    n_benign = int(n_samples * 0.6)  # 60% benign, 40% ransomware
    n_ransomware = n_samples - n_benign

    records = []

    # 1. Benign Subtypes
    benign_subtypes = [
        ("office_productivity", 0.35),
        ("dev_compilation", 0.25),
        ("backup_utility", 0.15),
        ("media_editing", 0.15),
        ("system_maintenance", 0.10),
    ]

    for subtype, frac in benign_subtypes:
        count = int(n_benign * frac)
        for _ in range(count):
            if subtype == "office_productivity":
                mod_rate = rng.exponential(scale=0.8)
                ren_rate = rng.exponential(scale=0.1)
                entropy_delta = rng.normal(loc=0.05, scale=0.15)
                susp_ext = 0.0
                depth = rng.randint(1, 4)
                del_rate = rng.exponential(scale=0.05)
                cpu = rng.uniform(2.0, 18.0)
                canary = 0
                shadow = 0
                note = 0
                rw_ratio = rng.uniform(0.1, 3.5)
                ext_count = rng.randint(1, 3)
            elif subtype == "dev_compilation":
                mod_rate = rng.uniform(5.0, 25.0)  # fast builds can write many files
                ren_rate = rng.uniform(0.2, 2.0)
                entropy_delta = rng.normal(loc=0.3, scale=0.25)
                susp_ext = 0.0
                depth = rng.randint(2, 6)
                del_rate = rng.uniform(0.5, 4.0)
                cpu = rng.uniform(40.0, 85.0)  # compilers use high CPU
                canary = 0
                shadow = 0
                note = 0
                rw_ratio = rng.uniform(0.4, 2.0)
                ext_count = rng.randint(2, 5)
            elif subtype == "backup_utility":
                mod_rate = rng.uniform(10.0, 40.0)
                ren_rate = rng.uniform(0.1, 1.0)
                entropy_delta = rng.normal(loc=0.6, scale=0.3)  # compressed backups have higher entropy
                susp_ext = 0.0
                depth = rng.randint(3, 8)
                del_rate = rng.exponential(scale=0.1)
                cpu = rng.uniform(20.0, 60.0)
                canary = 0
                shadow = 0  # legitimate backup might use VSS, but not destructive deletion
                note = 0
                rw_ratio = rng.uniform(1.8, 4.0)  # reads more than writes
                ext_count = rng.randint(4, 10)
            elif subtype == "media_editing":
                mod_rate = rng.uniform(1.0, 8.0)
                ren_rate = rng.exponential(scale=0.2)
                entropy_delta = rng.normal(loc=0.4, scale=0.2)
                susp_ext = 0.0
                depth = rng.randint(1, 3)
                del_rate = rng.exponential(scale=0.1)
                cpu = rng.uniform(50.0, 90.0)
                canary = 0
                shadow = 0
                note = 0
                rw_ratio = rng.uniform(0.3, 1.5)
                ext_count = rng.randint(1, 3)
            else:  # system_maintenance
                mod_rate = rng.uniform(2.0, 12.0)
                ren_rate = rng.uniform(0.1, 1.5)
                entropy_delta = rng.normal(loc=-0.1, scale=0.2)
                susp_ext = 0.0
                depth = rng.randint(2, 5)
                del_rate = rng.uniform(0.5, 3.0)
                cpu = rng.uniform(10.0, 45.0)
                canary = 0
                shadow = 0
                note = 0
                rw_ratio = rng.uniform(0.5, 2.5)
                ext_count = rng.randint(1, 4)

            # Introduce realistic background noise and measurement jitter
            if rng.rand() < 0.05:  # 5% borderline benign edge case (e.g. active archiver/backup)
                mod_rate += rng.uniform(20.0, 50.0)
                entropy_delta += rng.uniform(1.2, 2.2)

            records.append({
                "process_name": f"{subtype}_{rng.randint(100, 999)}.exe",
                "subtype": subtype,
                "file_modification_rate": max(0.0, round(float(mod_rate), 3)),
                "file_rename_rate": max(0.0, round(float(ren_rate), 3)),
                "entropy_change_mean": round(float(entropy_delta), 3),
                "suspicious_extension_ratio": max(0.0, min(1.0, round(float(susp_ext), 3))),
                "directory_traversal_depth": int(depth),
                "rapid_file_deletion_rate": max(0.0, round(float(del_rate), 3)),
                "process_cpu_usage_burst": max(0.0, min(100.0, round(float(cpu), 2))),
                "canary_file_modified": int(canary),
                "shadow_copy_access_attempt": int(shadow),
                "ransom_note_detected": int(note),
                "file_read_to_write_ratio": max(0.01, round(float(rw_ratio), 3)),
                "unique_file_extensions_accessed": int(ext_count),
                "is_ransomware": 0
            })

    # 2. Ransomware Subtypes (LockBit, WannaCry, Conti, Dharma, Stealthy)
    ransomware_subtypes = [
        ("lockbit_fast", 0.30),
        ("wannacry_burst", 0.25),
        ("conti_aggressive", 0.20),
        ("dharma_persistent", 0.15),
        ("stealthy_dormant", 0.10)
    ]

    for subtype, frac in ransomware_subtypes:
        count = int(n_ransomware * frac)
        for _ in range(count):
            if subtype == "lockbit_fast":
                mod_rate = rng.uniform(85.0, 310.0)
                ren_rate = rng.uniform(65.0, 240.0)
                entropy_delta = rng.uniform(2.7, 4.2)
                susp_ext = rng.uniform(0.80, 1.0)
                depth = rng.randint(6, 16)
                del_rate = rng.uniform(18.0, 85.0)
                cpu = rng.uniform(70.0, 99.0)
                canary = 1 if rng.rand() < 0.90 else 0
                shadow = 1 if rng.rand() < 0.85 else 0
                note = 1 if rng.rand() < 0.92 else 0
                rw_ratio = rng.normal(loc=1.02, scale=0.08)
                ext_count = rng.randint(10, 26)
            elif subtype == "wannacry_burst":
                mod_rate = rng.uniform(55.0, 210.0)
                ren_rate = rng.uniform(45.0, 175.0)
                entropy_delta = rng.uniform(2.4, 4.0)
                susp_ext = rng.uniform(0.70, 0.98)
                depth = rng.randint(5, 13)
                del_rate = rng.uniform(10.0, 55.0)
                cpu = rng.uniform(65.0, 95.0)
                canary = 1 if rng.rand() < 0.82 else 0
                shadow = 1 if rng.rand() < 0.65 else 0
                note = 1 if rng.rand() < 0.95 else 0
                rw_ratio = rng.normal(loc=1.04, scale=0.10)
                ext_count = rng.randint(9, 24)
            elif subtype == "conti_aggressive":
                mod_rate = rng.uniform(75.0, 270.0)
                ren_rate = rng.uniform(55.0, 200.0)
                entropy_delta = rng.uniform(2.6, 4.1)
                susp_ext = rng.uniform(0.75, 0.98)
                depth = rng.randint(5, 14)
                del_rate = rng.uniform(12.0, 70.0)
                cpu = rng.uniform(72.0, 98.0)
                canary = 1 if rng.rand() < 0.88 else 0
                shadow = 1 if rng.rand() < 0.80 else 0
                note = 1 if rng.rand() < 0.90 else 0
                rw_ratio = rng.normal(loc=0.99, scale=0.08)
                ext_count = rng.randint(10, 25)
            elif subtype == "dharma_persistent":
                mod_rate = rng.uniform(30.0, 105.0)
                ren_rate = rng.uniform(20.0, 85.0)
                entropy_delta = rng.uniform(2.0, 3.6)
                susp_ext = rng.uniform(0.55, 0.90)
                depth = rng.randint(4, 10)
                del_rate = rng.uniform(4.0, 25.0)
                cpu = rng.uniform(50.0, 82.0)
                canary = 1 if rng.rand() < 0.70 else 0
                shadow = 1 if rng.rand() < 0.60 else 0
                note = 1 if rng.rand() < 0.85 else 0
                rw_ratio = rng.normal(loc=1.05, scale=0.12)
                ext_count = rng.randint(7, 18)
            else:  # stealthy_dormant (low and slow ransomware evasion)
                mod_rate = rng.uniform(12.0, 42.0)
                ren_rate = rng.uniform(8.0, 30.0)
                entropy_delta = rng.uniform(1.4, 2.7)
                susp_ext = rng.uniform(0.25, 0.65)
                depth = rng.randint(3, 7)
                del_rate = rng.uniform(1.0, 10.0)
                cpu = rng.uniform(28.0, 58.0)
                canary = 1 if rng.rand() < 0.50 else 0
                shadow = 1 if rng.rand() < 0.30 else 0
                note = 1 if rng.rand() < 0.65 else 0
                rw_ratio = rng.normal(loc=1.10, scale=0.18)
                ext_count = rng.randint(5, 14)

            # Evasion noise: 3% of ransomware samples attempt stealth with reduced metrics
            if rng.rand() < 0.03:
                mod_rate = max(5.0, mod_rate * 0.4)
                entropy_delta = max(0.8, entropy_delta * 0.6)

            records.append({
                "process_name": f"{subtype}_{rng.randint(100, 999)}.exe",
                "subtype": subtype,
                "file_modification_rate": max(0.0, round(float(mod_rate), 3)),
                "file_rename_rate": max(0.0, round(float(ren_rate), 3)),
                "entropy_change_mean": round(float(entropy_delta), 3),
                "suspicious_extension_ratio": max(0.0, min(1.0, round(float(susp_ext), 3))),
                "directory_traversal_depth": int(depth),
                "rapid_file_deletion_rate": max(0.0, round(float(del_rate), 3)),
                "process_cpu_usage_burst": max(0.0, min(100.0, round(float(cpu), 2))),
                "canary_file_modified": int(canary),
                "shadow_copy_access_attempt": int(shadow),
                "ransom_note_detected": int(note),
                "file_read_to_write_ratio": max(0.01, round(float(rw_ratio), 3)),
                "unique_file_extensions_accessed": int(ext_count),
                "is_ransomware": 1
            })

    df = pd.DataFrame(records)
    # Shuffle dataframe
    df = df.sample(frac=1.0, random_state=random_state).reset_index(drop=True)
    return df


def save_dataset(df: pd.DataFrame, filepath: str) -> None:
    """Saves dataset to CSV ensuring parent directories exist."""
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    df.to_csv(filepath, index=False)


def load_dataset(filepath: str) -> pd.DataFrame:
    """Loads and validates dataset from CSV."""
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Dataset not found at {filepath}")
    df = pd.read_csv(filepath)
    # Validate required columns
    missing = [c for c in FEATURE_NAMES + ["is_ransomware"] if c not in df.columns]
    if missing:
        raise ValueError(f"Dataset is missing required columns: {missing}")
    return df
