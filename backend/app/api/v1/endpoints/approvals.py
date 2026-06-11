"""
PRAGMA — Approvals Endpoints

Owner: Diyasha (Backend APIs)
Milestone: M2

Endpoints:
  POST /approvals   — Compliance officer approves or rejects a MAP
  GET  /approvals   — List all approval actions (audit trail)
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

# Temporary in-memory storage for M2
approvals_db = []


class ApprovalRequest(BaseModel):
    map_id: int
    decision: str
    reviewer: str
    comments: str = ""


@router.post("")
async def create_approval(payload: ApprovalRequest):
    """
    Approve or reject a MAP.
    """

    decision = payload.decision.upper()

    if decision not in ["APPROVED", "REJECTED"]:
        raise HTTPException(
            status_code=400,
            detail="Decision must be APPROVED or REJECTED"
        )

    approval = {
        "id": len(approvals_db) + 1,
        "map_id": payload.map_id,
        "decision": decision,
        "reviewer": payload.reviewer,
        "comments": payload.comments
    }

    approvals_db.append(approval)

    return {
        "message": f"MAP {decision.lower()} successfully",
        "approval": approval
    }


@router.get("")
async def list_approvals():
    """
    List all approval actions.
    """

    return approvals_db