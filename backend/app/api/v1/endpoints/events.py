"""
PRAGMA — Events Endpoints

Owner: Diyasha (Backend APIs)
Milestone: M2

Endpoints:
  GET /events   — Full lifecycle event log, newest first
"""

from fastapi import APIRouter

router = APIRouter()

# Temporary event log storage for M2
events_db = [
    {
        "id": 1,
        "event_type": "CIRCULAR_UPLOADED",
        "description": "RBI circular uploaded",
        "timestamp": "2026-06-11T10:00:00"
    },
    {
        "id": 2,
        "event_type": "MAP_EXTRACTED",
        "description": "Claude extracted MAPs",
        "timestamp": "2026-06-11T10:01:00"
    },
    {
        "id": 3,
        "event_type": "MAP_APPROVED",
        "description": "Compliance approved MAP",
        "timestamp": "2026-06-11T10:05:00"
    }
]


@router.get("")
async def list_events(
    limit: int = 50,
    offset: int = 0
):
    """
    Return event log entries.
    Supports pagination using limit and offset.
    """

    return events_db[offset: offset + limit]