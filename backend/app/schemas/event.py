"""
PRAGMA — Event Pydantic Schemas

Owner: Diyasha
Milestone: M2

Defines response shape for the /events endpoint (audit log).
Events are read-only — no create schema needed for external callers.
"""

from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
import uuid


class EventOut(BaseModel):
    id: uuid.UUID
    circular_id: Optional[uuid.UUID] = None
    map_id: Optional[uuid.UUID] = None
    event_type: str
    description: str
    actor: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
