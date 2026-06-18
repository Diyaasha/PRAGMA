"""
PRAGMA — Approval Pydantic Schemas

Owner: Diyasha
Milestone: M2

Defines request/response shapes for the /approvals endpoints.
"""

from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
import uuid


class ApprovalCreate(BaseModel):
    map_id: uuid.UUID
    action: str                      # 'Approved' | 'Rejected'
    notes: Optional[str] = None
    approved_by: Optional[str] = "Compliance Officer"


class ApprovalOut(BaseModel):
    id: uuid.UUID
    map_id: uuid.UUID
    action: str
    notes: Optional[str] = None
    approved_by: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
