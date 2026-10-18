"""
Simulation Service for Safe, Controlled Demonstrations of Ransomware & Benign Behavior.
Exercises the actual ML inference and XAI pipeline without performing any real destruction.
"""

import asyncio
import uuid
import random
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from backend.app.database.session import SessionLocal
from backend.app.schemas.event import TelemetryInput, SimulationStatusResponse
from backend.app.services.detection_service import detection_service


class SimulationManager:
    def __init__(self):
        self.is_running = False
        self.current_scenario: Optional[str] = None
        self.current_session_id: Optional[str] = None
        self.events_generated = 0
        self.suspicious_count = 0
        self.task: Optional[asyncio.Task] = None
        self.live_logs: List[Dict[str, Any]] = []

    def get_status(self) -> SimulationStatusResponse:
        return SimulationStatusResponse(
            is_running=self.is_running,
            scenario=self.current_scenario,
            events_generated=self.events_generated,
            suspicious_count=self.suspicious_count,
            session_id=self.current_session_id,
            message="Simulation actively running" if self.is_running else "Simulation idle / stopped"
        )

    def get_logs(self, limit: int = 20) -> List[Dict[str, Any]]:
        return self.live_logs[-limit:]

    async def start_simulation(self, scenario: str, event_count: int = 8, interval_seconds: float = 0.8) -> dict:
        if self.is_running:
            return {"status": "error", "message": "A simulation is already in progress. Stop it first."}

        self.is_running = True
        self.current_scenario = scenario
        self.current_session_id = str(uuid.uuid4())
        self.events_generated = 0
        self.suspicious_count = 0
        self.live_logs = []

        self.task = asyncio.create_task(
            self._run_simulation_loop(scenario, event_count, interval_seconds, self.current_session_id)
        )

        return {
            "status": "started",
            "session_id": self.current_session_id,
            "scenario": scenario,
            "event_count": event_count
        }

    async def stop_simulation(self) -> dict:
        if not self.is_running:
            return {"status": "idle", "message": "No active simulation to stop."}

        self.is_running = False
        if self.task and not self.task.done():
            self.task.cancel()

        return {
            "status": "stopped",
            "session_id": self.current_session_id,
            "events_generated": self.events_generated,
            "suspicious_count": self.suspicious_count
        }

    async def _run_simulation_loop(self, scenario: str, count: int, interval: float, session_id: str):
        try:
            for step in range(1, count + 1):
                if not self.is_running:
                    break

                # Generate scenario-specific telemetry
                telemetry = self._generate_scenario_telemetry(scenario, step, session_id)

                # Send directly to the real ML detection engine and database!
                db: Session = SessionLocal()
                try:
                    res = detection_service.analyze_and_store(db, telemetry)
                    self.events_generated += 1
                    if res.is_ransomware:
                        self.suspicious_count += 1

                    log_entry = {
                        "step": step,
                        "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S"),
                        "process_name": telemetry.process_name,
                        "prediction": res.prediction,
                        "risk_score": res.risk_score,
                        "severity": res.severity,
                        "explanation_summary": res.explanation_summary,
                        "event_id": res.id
                    }
                    self.live_logs.append(log_entry)
                finally:
                    db.close()

                await asyncio.sleep(interval)
        except asyncio.CancelledError:
            pass
        finally:
            self.is_running = False

    def _generate_scenario_telemetry(self, scenario: str, step: int, session_id: str) -> TelemetryInput:
        pid = random.randint(3000, 19999)

        if scenario == "benign_office":
            procs = ["WINWORD.EXE", "EXCEL.EXE", "OUTLOOK.EXE", "OneDrive.exe", "POWERPNT.EXE"]
            return TelemetryInput(
                process_name=random.choice(procs),
                pid=pid,
                is_simulated=True,
                simulation_session_id=session_id,
                file_modification_rate=round(random.uniform(0.2, 2.5), 3),
                file_rename_rate=round(random.uniform(0.0, 0.4), 3),
                entropy_change_mean=round(random.uniform(-0.1, 0.3), 3),
                suspicious_extension_ratio=0.0,
                directory_traversal_depth=random.randint(1, 3),
                rapid_file_deletion_rate=round(random.uniform(0.0, 0.1), 3),
                process_cpu_usage_burst=round(random.uniform(4.0, 20.0), 2),
                canary_file_modified=0,
                shadow_copy_access_attempt=0,
                ransom_note_detected=0,
                file_read_to_write_ratio=round(random.uniform(0.6, 2.0), 3),
                unique_file_extensions_accessed=random.randint(1, 3)
            )

        elif scenario == "benign_developer":
            procs = ["node.exe", "cargo.exe", "rustc.exe", "tsc.exe", "git.exe"]
            return TelemetryInput(
                process_name=random.choice(procs),
                pid=pid,
                is_simulated=True,
                simulation_session_id=session_id,
                file_modification_rate=round(random.uniform(12.0, 32.0), 3),
                file_rename_rate=round(random.uniform(0.3, 1.8), 3),
                entropy_change_mean=round(random.uniform(0.1, 0.5), 3),
                suspicious_extension_ratio=0.0,
                directory_traversal_depth=random.randint(3, 6),
                rapid_file_deletion_rate=round(random.uniform(0.5, 3.5), 3),
                process_cpu_usage_burst=round(random.uniform(55.0, 88.0), 2),
                canary_file_modified=0,
                shadow_copy_access_attempt=0,
                ransom_note_detected=0,
                file_read_to_write_ratio=round(random.uniform(0.5, 1.6), 3),
                unique_file_extensions_accessed=random.randint(2, 5)
            )

        elif scenario == "fast_ransomware":
            procs = ["svchost_updater.exe", "lockbit_enc.exe", "wncry_burst.exe", "crypto_locker.exe"]
            # Ramp up aggression with steps
            mod = min(350.0, 80.0 + step * 30.0)
            ren = min(260.0, 60.0 + step * 25.0)
            return TelemetryInput(
                process_name=random.choice(procs),
                pid=pid,
                is_simulated=True,
                simulation_session_id=session_id,
                file_modification_rate=round(random.uniform(mod - 20, mod + 20), 3),
                file_rename_rate=round(random.uniform(ren - 15, ren + 15), 3),
                entropy_change_mean=round(random.uniform(3.2, 4.3), 3),
                suspicious_extension_ratio=round(random.uniform(0.85, 1.0), 3),
                directory_traversal_depth=min(16, 6 + step),
                rapid_file_deletion_rate=round(random.uniform(25.0, 85.0), 3),
                process_cpu_usage_burst=round(random.uniform(85.0, 99.0), 2),
                canary_file_modified=1 if step >= 2 else 0,
                shadow_copy_access_attempt=1 if step >= 3 else 0,
                ransom_note_detected=1 if step >= 4 else 0,
                file_read_to_write_ratio=round(random.uniform(0.98, 1.05), 3),
                unique_file_extensions_accessed=random.randint(15, 28)
            )

        else:  # stealthy_ransomware
            procs = ["system_idle_worker.exe", "dharma_bg.exe", "conti_dormant.exe"]
            return TelemetryInput(
                process_name=random.choice(procs),
                pid=pid,
                is_simulated=True,
                simulation_session_id=session_id,
                file_modification_rate=round(random.uniform(22.0, 52.0), 3),
                file_rename_rate=round(random.uniform(15.0, 38.0), 3),
                entropy_change_mean=round(random.uniform(2.1, 3.4), 3),
                suspicious_extension_ratio=round(random.uniform(0.45, 0.75), 3),
                directory_traversal_depth=random.randint(4, 8),
                rapid_file_deletion_rate=round(random.uniform(3.0, 14.0), 3),
                process_cpu_usage_burst=round(random.uniform(40.0, 68.0), 2),
                canary_file_modified=1 if step >= 4 else 0,
                shadow_copy_access_attempt=1 if step >= 5 else 0,
                ransom_note_detected=1 if step >= 6 else 0,
                file_read_to_write_ratio=round(random.uniform(1.02, 1.12), 3),
                unique_file_extensions_accessed=random.randint(8, 18)
            )


simulation_manager = SimulationManager()
