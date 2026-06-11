"""
PRAGMA — Demo Utility Endpoints

Owner: Diyasha (Backend APIs)
Milestone: M5

Endpoints:
  POST /demo/reset   — Wipe all data except departments; re-seed demo circular.
  GET  /health       — Alias for the root health check
"""

from fastapi import APIRouter

router = APIRouter()

# Temporary demo state
demo_circular = {
    "id": 1,
    "title": "RBI Cybersecurity Circular",
    "status": "PROCESSED"
}


@router.post("/reset")
async def reset_demo():
    """
    Reset demo state.
    In M2 this returns a simulated reset response.
    Later it will clear database tables and reload seed data.
    """

    return {
        "success": True,
        "message": "Demo environment reset successfully",
        "seed_circular": demo_circular
    }


@router.get("/health")
async def health_check():
    """
    Health check endpoint.
    """

    return {
        "status": "healthy",
        "service": "PRAGMA Backend"
    }