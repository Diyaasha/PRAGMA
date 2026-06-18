"""
PRAGMA — Circular Pydantic Schemas

Owner: Diptanshu / Diyasha
Milestone: M2

Defines request/response shapes for the /circulars endpoints.
"""

from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
import uuid

from app.schemas.map import MAPOut


class CircularUploadRequest(BaseModel):
    title: str
    source: str                      # 'RBI' | 'SEBI' | 'MCA'
    content: str


class CircularOut(BaseModel):
    id: uuid.UUID
    title: str
    source: str
    content: str
    status: str
    uploaded_at: datetime
    maps: List[MAPOut] = []

    model_config = ConfigDict(from_attributes=True)
