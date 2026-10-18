"""
Database ORM models for Detection Events, Alerts, and Simulations.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from backend.app.database.session import Base


def utcnow():
    return datetime.now(timezone.utc)


class DetectionEvent(Base):
    __tablename__ = "detection_events"

    id = Column(String(36), primary_key=True, index=True)
    timestamp = Column(DateTime, default=utcnow, index=True)
    process_name = Column(String(128), default="unknown.exe", index=True)
    pid = Column(Integer, default=0)
    prediction = Column(String(32), index=True)  # "Ransomware" or "Benign"
    is_ransomware = Column(Boolean, default=False, index=True)
    confidence = Column(Float, default=0.0)
    probability = Column(Float, default=0.0)
    risk_score = Column(Integer, default=0, index=True)
    severity = Column(String(32), default="Informational", index=True)
    
    # Raw features stored as JSON string
    features_json = Column(Text, nullable=False)
    
    # Plain-English AI explanation summary
    explanation_summary = Column(Text, nullable=True)
    
    # Detailed SHAP values and contributions stored as JSON string
    shap_values_json = Column(Text, nullable=True)
    
    # Flag to differentiate simulated events from real agent detections
    is_simulated = Column(Boolean, default=False, index=True)
    simulation_session_id = Column(String(36), nullable=True)

    # Relationships
    alert = relationship("Alert", back_populates="event", uselist=False, cascade="all, delete-orphan")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String(36), primary_key=True, index=True)
    event_id = Column(String(36), ForeignKey("detection_events.id"), nullable=False, index=True)
    severity = Column(String(32), index=True)  # "Medium", "High", "Critical"
    status = Column(String(32), default="NEW", index=True)  # "NEW", "ACKNOWLEDGED", "INVESTIGATING", "RESOLVED"
    analyst_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow, index=True)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    # Relationship
    event = relationship("DetectionEvent", back_populates="alert")


class SimulationSession(Base):
    __tablename__ = "simulation_sessions"

    id = Column(String(36), primary_key=True, index=True)
    scenario = Column(String(64), nullable=False)  # "benign_office", "benign_developer", "fast_ransomware", "stealthy_ransomware"
    status = Column(String(32), default="running")  # "running", "stopped", "completed"
    total_events = Column(Integer, default=0)
    suspicious_events = Column(Integer, default=0)
    started_at = Column(DateTime, default=utcnow)
    completed_at = Column(DateTime, nullable=True)
