"""
PRAGMA — Approval Pydantic Schemas

Owner: Diyasha
Milestone: M2

Defines request/response shapes for the /approvals endpoints.
"""

from enum import Enum
from pydantic import BaseModel, ConfigDict, Field
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


class ApprovalDecision(str, Enum):
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class ApprovalCreateRequest(BaseModel):
    """
    Frontend contract + backward compatibility fields:
    - preferred: decision/reviewer/comments
    - fallback:  action/approved_by/notes
    """
    map_id: uuid.UUID | str | int = Field(..., description="MAP identifier")
    decision: Optional[str] = Field(default=None, description="APPROVED | REJECTED")
    reviewer: Optional[str] = Field(default="Compliance Officer")
    comments: Optional[str] = Field(default="")

    # Backward-compatible aliases
    action: Optional[str] = None
    notes: Optional[str] = None
    approved_by: Optional[str] = None

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "map_id": "c0f82ea8-f0cd-4ed3-8839-f76495de9777",
                "decision": "APPROVED",
                "reviewer": "Ashwin",
                "comments": "Looks good"
            }
        }
    )

    @property
    def normalized_decision(self) -> ApprovalDecision | None:
        token = (self.decision or self.action or "").strip().upper()
        if token == ApprovalDecision.APPROVED.value:
            return ApprovalDecision.APPROVED
        if token == ApprovalDecision.REJECTED.value:
            return ApprovalDecision.REJECTED
        return None

    @property
    def normalized_reviewer(self) -> str:
        reviewer = self.reviewer or self.approved_by or "Compliance Officer"
        return reviewer.strip()

    @property
    def normalized_comments(self) -> str:
        comments = self.comments if self.comments is not None else self.notes
        return (comments or "").strip()


class ApprovalRecordOut(BaseModel):
    id: uuid.UUID
    map_id: uuid.UUID
    decision: ApprovalDecision
    reviewer: str
    comments: str
    created_at: datetime


class ApprovalCreateResponse(BaseModel):
    message: str
    map_status: str
    event_type: str
    event_description: str
    approval: ApprovalRecordOut

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "message": "MAP approved successfully",
                "map_status": "APPROVED",
                "event_type": "MAP_APPROVED",
                "event_description": "MAP c0f82ea8-f0cd-4ed3-8839-f76495de9777 approved by Ashwin",
                "approval": {
                    "id": "634ba081-57fc-4dd5-8038-d9eb53ae6fc1",
                    "map_id": "c0f82ea8-f0cd-4ed3-8839-f76495de9777",
                    "decision": "APPROVED",
                    "reviewer": "Ashwin",
                    "comments": "Looks good",
                    "created_at": "2026-06-18T07:02:41.044301Z"
                }
            }
        }
    )
