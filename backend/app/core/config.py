"""
Application Configuration and Settings.
"""

import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Ransomware Detection with Explainable AI"
    API_V1_STR: str = "/api"
    DATABASE_URL: str = "sqlite:///./ransomware_detection.db"
    MODELS_DIR: str = "backend/ml/saved_models"
    DATA_PATH: str = "backend/ml/data/ransomware_behavioral_dataset.csv"
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000"
    ]

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()
