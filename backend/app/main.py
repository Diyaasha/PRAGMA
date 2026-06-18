"""
PRAGMA — FastAPI Application Factory

Owner: Diyasha (Backend APIs)
Registers CORS middleware, mounts all API routers, exposes health check.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api.v1.router import api_router
from app.database import SessionLocal
from app.services.department_service import seed_departments


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Seed departments on startup
    db = SessionLocal()
    try:
        seed_departments(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="PRAGMA API",
    description=(
        "Proactive Regulatory Autonomous Governance & Management Agent — "
        "SuRaksha Cyber Hackathon 2.0"
    ),
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS — open for prototype; lock down origins before any public deployment
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(api_router, prefix="/api/v1")

# ---------------------------------------------------------------------------
# Health check — used by frontend to verify backend is alive
# ---------------------------------------------------------------------------


@app.get("/health", tags=["system"])
async def health_check():
    return {"status": "ok", "service": "PRAGMA API", "version": "0.1.0"}
