"""
PRAGMA — Event Logging Service

Owner: Diyasha (Backend APIs)
Milestone: M2

Every significant state change writes an event row.
This service is called by other services — never directly from endpoints.

Callers:
  - map_service: MAP created, status changed
  - approvals endpoint: MAP approved/rejected
  - circulars endpoint: circular uploaded, extraction complete
  - demo endpoint: demo reset
"""

from sqlalchemy.orm import Session
from app.models.event import Event


def log_event(
    db: Session,
    event_type: str,
    description: str,
    actor: str = "System",
    circular_id=None,
    map_id=None
) -> Event:
    """
    Creates and persists a new lifecycle event.
    """
    event = Event(
        event_type=event_type,
        description=description,
        actor=actor,
        circular_id=circular_id,
        map_id=map_id
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event
