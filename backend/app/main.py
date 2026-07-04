"""
PRAGMA — FastAPI Application Factory

Registers CORS middleware, mounts all API routers, exposes health check.
Offline-first: creates SQLite tables on startup, seeds departments.
"""

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api.v1.router import api_router
from app.database import SessionLocal, create_all_tables
from app.services.department_service import seed_departments

logger = logging.getLogger(__name__)


def _startup_sync() -> None:
    """
    Run synchronous startup tasks in a worker thread so the event loop stays free.

    Order:
      1. create_all_tables() — DDL; safe to call repeatedly (IF NOT EXISTS)
      2. seed_departments()  — inserts 5 department rows if table is empty
    """
    # Ensure tables exist (critical for SQLite — no external migration tool)
    create_all_tables()
    logger.info("[PRAGMA] Tables created / verified")

    db = SessionLocal()
    try:
        seed_departments(db)
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    loop = asyncio.get_event_loop()
    try:
        await asyncio.wait_for(
            loop.run_in_executor(None, _startup_sync),
            timeout=15.0,
        )
    except asyncio.TimeoutError:
        logger.warning("[PRAGMA] Startup tasks timed out — continuing anyway")
    except Exception as exc:
        logger.warning(
            "[PRAGMA] Startup tasks failed: %s — continuing anyway",
            exc,
        )
    yield


app = FastAPI(
    title="PRAGMA API",
    description=(
        "Proactive Regulatory Autonomous Governance & Management Agent — "
        "Air-Gapped Compliance Intelligence Platform for Canara Bank"
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────

app.include_router(api_router, prefix="/api/v1")

# ── Root ──────────────────────────────────────────────────────────────────────


@app.get("/", tags=["system"])
async def root():
    return {
        "status": "ok",
        "service": "PRAGMA API",
        "message": "PRAGMA backend is live",
        "health": "/health",
        "docs": "/docs",
    }


# ── Health — never blocks; reports AI engine status ───────────────────────────


@app.get("/health", tags=["system"])
async def health_check():
    """
    Tri-state health endpoint.
    status: "ok"       — API reachable, AI engine available
    status: "degraded" — API reachable, AI running in rule-based fallback mode
    """
    try:
        from app.services.ai_engine import get_engine_status

        ai = get_engine_status()
    except Exception:
        ai = {
            "engine": "unknown",
            "model": None,
            "available": False,
            "label": "Unknown",
        }

    try:
        from app.services.ollama_service import get_cache_stats

        cache = get_cache_stats()
    except Exception:
        cache = {}

    return {
        "status": "ok",
        "service": "PRAGMA API",
        "version": "1.0.0",
        "ai_engine": ai["engine"],
        "ai_model": ai.get("model"),
        "ai_available": ai.get("available", False),
        "ai_label": ai.get("label", ""),
        "offline_mode": True,
        "prompt_cache": cache,
    }