"""
PRAGMA — Events Endpoints

Owner: Diyasha (Backend APIs)
Milestone: M2

Endpoints:
  GET /events   — Full lifecycle event log, newest first
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.event import Event
from app.schemas.event import EventOut

router = APIRouter()


@router.get("", response_model=List[EventOut])
async def list_events(
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """
    Return event log entries.
    Supports pagination using limit and offset.
    """
    return (
        db.query(Event)
        .order_by(Event.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )