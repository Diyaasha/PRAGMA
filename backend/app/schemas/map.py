"""
PRAGMA — MAP Pydantic Schemas

Owner: Diptanshu / Diyasha
Milestone: M2

Defines request/response shapes for the /maps endpoints.
MAPOut is the primary response schema used across the dashboard.
"""

from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional, List
from datetime import datetime, date
import uuid

from app.schemas.approval import ApprovalOut


class MAPOut(BaseModel):
    id: uuid.UUID
    circular_id: uuid.UUID
    department: Optional[str] = None
    action: str
    priority: str
    deadline: Optional[date] = None
    status: str
    validation_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    # Optional enhancement fields (Task 11)
    confidence_score: Optional[float] = None
    source_clause: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

    @field_validator("department", mode="before")
    @classmethod
    def serialize_department(cls, v):
        if v and not isinstance(v, str):
            # If it is a Department ORM model instance, extract its name
            return v.name
        return v


class MAPDetailOut(MAPOut):
    approvals: List[ApprovalOut] = []


class MAPStatusUpdate(BaseModel):
    status: str
