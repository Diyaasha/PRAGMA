"""
PRAGMA — Approvals Endpoints

Owner: Diyasha (Backend APIs)
Milestone: M2

Endpoints:
  POST /approvals   — Compliance officer approves or rejects a MAP
  GET  /approvals   — List all approval actions (audit trail)
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app.database import get_db
from app.models.approval import Approval
from app.schemas.approval import ApprovalOut
from app.services.map_service import update_map_status

router = APIRouter()


class ApprovalRequest(BaseModel):
    map_id: uuid.UUID
    decision: Optional[str] = None      # "APPROVED" | "REJECTED"
    reviewer: Optional[str] = "Compliance Officer"
    comments: Optional[str] = ""

    # Compatibility fields for docs/api-reference.md
    action: Optional[str] = None
    notes: Optional[str] = None
    approved_by: Optional[str] = None


@router.post("")
async def create_approval(payload: ApprovalRequest, db: Session = Depends(get_db)):
    """
    Approve or reject a MAP.
    """
    # Normalize fields (checking both frontend and docs naming)
    action_val = payload.action or payload.decision
    if not action_val:
        raise HTTPException(
            status_code=400,
            detail="Action or Decision is required"
        )

    action_normalized = action_val.strip().title()  # Approved / Rejected
    if action_normalized not in ["Approved", "Rejected"]:
        raise HTTPException(
            status_code=400,
            detail="Action must be APPROVED or REJECTED"
        )

    notes_val = payload.notes if payload.notes is not None else payload.comments
    approved_by_val = payload.approved_by or payload.reviewer or "Compliance Officer"

    try:
        # 1. Update the status of the MAP in the database
        # This will validate the transition and log the corresponding event
        update_map_status(db, payload.map_id, action_normalized)

        # 2. Record the compliance review decision
        approval = Approval(
            map_id=payload.map_id,
            action=action_normalized,
            notes=notes_val,
            approved_by=approved_by_val
        )
        db.add(approval)
        db.commit()
        db.refresh(approval)

        return {
            "message": f"MAP {action_normalized.lower()} successfully",
            "approval": {
                "id": str(approval.id),
                "map_id": str(approval.map_id),
                "decision": approval.action,
                "reviewer": approval.approved_by,
                "comments": approval.notes
            }
        }

    except ValueError as e:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.get("", response_model=List[ApprovalOut])
async def list_approvals(db: Session = Depends(get_db)):
    """
    List all approval actions.
    """
    return db.query(Approval).all()