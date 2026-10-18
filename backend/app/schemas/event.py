"""
Pydantic Schemas for Request Validation and Response Serialization.
"""

from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, ConfigDict


class TelemetryInput(BaseModel):
    process_name: Optional[str] = "svchost.exe"
    pid: Optional[int] = 1204
    is_simulated: Optional[bool] = False
    simulation_session_id: Optional[str] = None
    
    # Behavioral Features
    file_modification_rate: float = Field(default=0.0, ge=0.0, description="Files modified per second")
    file_rename_rate: float = Field(default=0.0, ge=0.0, description="Files renamed per second")
    entropy_change_mean: float = Field(default=0.0, description="Delta Shannon entropy")
    suspicious_extension_ratio: float = Field(default=0.0, ge=0.0, le=1.0, description="Fraction of encrypted/ransom extensions")
    directory_traversal_depth: int = Field(default=1, ge=0, description="Nesting traversal depth")
    rapid_file_deletion_rate: float = Field(default=0.0, ge=0.0, description="Files deleted per second")
    process_cpu_usage_burst: float = Field(default=0.0, ge=0.0, le=100.0, description="CPU usage spike %")
    canary_file_modified: int = Field(default=0, ge=0, le=1, description="Decoy file modification flag")
    shadow_copy_access_attempt: int = Field(default=0, ge=0, le=1, description="Volume Shadow Copy deletion flag")
    ransom_note_detected: int = Field(default=0, ge=0, le=1, description="Ransom payment note created flag")
    file_read_to_write_ratio: float = Field(default=1.0, ge=0.0, description="Read/Write byte ratio")
    unique_file_extensions_accessed: int = Field(default=1, ge=0, description="Unique target extensions count")


class BatchTelemetryInput(BaseModel):
    events: List[TelemetryInput]


class FeatureContributionSchema(BaseModel):
    feature: str
    display_name: str
    shap_value: float
    actual_value: float
    unit: str
    direction: str
    description: str
    benign_range: List[float]
    is_anomalous: bool


class ExplanationSchema(BaseModel):
    predicted_class: str
    predicted_probability: float
    base_value: float
    contributions: List[FeatureContributionSchema]
    top_risk_factors: List[FeatureContributionSchema]
    top_mitigating_factors: List[FeatureContributionSchema]
    plain_english_explanation: str


class DetectionEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    timestamp: datetime
    process_name: str
    pid: int
    prediction: str
    is_ransomware: bool
    confidence: float
    probability: float
    risk_score: int
    severity: str
    features: Dict[str, Any]
    explanation_summary: Optional[str] = None
    explanation: Optional[ExplanationSchema] = None
    is_simulated: bool
    simulation_session_id: Optional[str] = None


class AlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    event_id: str
    severity: str
    status: str
    analyst_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    process_name: Optional[str] = None
    risk_score: Optional[int] = None
    prediction: Optional[str] = None
    is_simulated: Optional[bool] = False


class AlertUpdate(BaseModel):
    status: Optional[str] = Field(default=None, pattern="^(NEW|ACKNOWLEDGED|INVESTIGATING|RESOLVED)$")
    analyst_notes: Optional[str] = None


class TimelineTrendPoint(BaseModel):
    time_label: str
    benign_count: int
    ransomware_count: int
    avg_risk_score: float


class DashboardSummary(BaseModel):
    total_events: int
    benign_count: int
    ransomware_count: int
    active_alerts_count: int
    critical_alerts_count: int
    high_alerts_count: int
    accuracy: float
    recall: float
    champion_model: str
    recent_events: List[DetectionEventResponse]
    timeline_trends: List[TimelineTrendPoint]


class SimulationStartRequest(BaseModel):
    scenario: str = Field(default="fast_ransomware", description="Scenario: benign_office, benign_developer, fast_ransomware, stealthy_ransomware")
    event_count: int = Field(default=8, ge=1, le=50)
    interval_seconds: float = Field(default=0.8, ge=0.1, le=5.0)


class SimulationStatusResponse(BaseModel):
    is_running: bool
    scenario: Optional[str] = None
    events_generated: int
    suspicious_count: int
    session_id: Optional[str] = None
    message: str
