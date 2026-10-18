"""
FastAPI Main Application Entry Point.
AI Ransomware Detection with Explainable AI (XAI).
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.core.config import settings
from backend.app.database.session import Base, engine, SessionLocal
from backend.app.api.router import api_router
from backend.app.services.detection_service import detection_service


# Ensure SQLite database tables are created immediately
Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables and seed initial demo data
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        detection_service.seed_initial_data(db)
    finally:
        db.close()
    
    yield
    # Shutdown logic (if any)


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Final-Year B.Tech CSE Cybersecurity Project: Machine Learning Ransomware Detection with SHAP Explainable AI",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local development and demonstration
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount REST API
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "title": settings.PROJECT_NAME,
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR,
        "status": "operational"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
