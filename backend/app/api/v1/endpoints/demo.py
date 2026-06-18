"""
PRAGMA — Demo Utility Endpoints

Owner: Diyasha (Backend APIs)
Milestone: M5

Endpoints:
  POST /demo/reset   — Wipe all data except departments; re-seed demo circular.
  GET  /health       — Alias for the root health check
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.circular import Circular
from app.models.map import MAP
from app.models.approval import Approval
from app.models.event import Event
from app.services.event_service import log_event

router = APIRouter()


@router.post("/reset")
async def reset_demo(db: Session = Depends(get_db)):
    """
    Reset demo state by wiping all transactional data from the database.
    """
    try:
        # Delete dependent tables first to respect foreign keys
        db.query(Approval).delete()
        db.query(Event).delete()
        db.query(MAP).delete()
        db.query(Circular).delete()
        db.commit()

        # Log event demo_reset
        log_event(
            db=db,
            event_type="demo_reset",
            description="Demo environment reset - all transactional data cleared",
            actor="System"
        )

        return {
            "success": True,
            "message": "Demo environment reset successfully"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Wiping database failed: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """
    Health check endpoint.
    """
    return {
        "status": "healthy",
        "service": "PRAGMA Backend"
    }