"""
PRAGMA — Approvals Endpoints

Owner: Diyasha (Backend APIs)
Milestone: M2

Endpoints:
  POST /approvals   — Compliance officer approves or rejects a MAP
  GET  /approvals   — List all approval actions (audit trail)
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import List

from app.database import get_db
from app.models.approval import Approval
from app.models.event import Event
from app.schemas.approval import (
    ApprovalCreateRequest,
    ApprovalCreateResponse,
    ApprovalDecision,
    ApprovalOut,
)
from app.services.map_service import resolve_map_by_identifier

router = APIRouter()



def _normalize_map_status(status: str) -> str:
    """
    Convert any MAP status format to a normalized token for transition checks.
    Example: "In Progress" -> "IN_PROGRESS"
    """
    return status.strip().upper().replace(" ", "_")


@router.post("", response_model=ApprovalCreateResponse, status_code=201)
async def create_approval(payload: ApprovalCreateRequest, db: Session = Depends(get_db)):
    """
    Approve or reject a MAP.
    This endpoint updates MAP status and appends an audit event in the same transaction.
    """
    map_obj = resolve_map_by_identifier(db, payload.map_id)
    if not map_obj:
        raise HTTPException(
            status_code=404,
            detail=f"MAP not found for map_id={payload.map_id}"
        )
    decision = payload.normalized_decision
    if decision is None:
        raise HTTPException(
            status_code=400,
            detail='Decision must be "APPROVED" or "REJECTED"'
        )

    normalized_status = _normalize_map_status(map_obj.status)
    if normalized_status != "PENDING":
        raise HTTPException(
            status_code=400,
            detail=f"MAP is already actioned with status '{map_obj.status}'"
        )

    reviewer = payload.normalized_reviewer
    comments = payload.normalized_comments
    status_for_map = "Approved" if decision == ApprovalDecision.APPROVED else "Rejected"
    event_type = "MAP_APPROVED" if decision == ApprovalDecision.APPROVED else "MAP_REJECTED"
    decision_label = "approved" if decision == ApprovalDecision.APPROVED else "rejected"
    event_description = f"MAP {map_obj.id} {decision_label} by {reviewer}"

    try:
        # 1) Update MAP status for frontend-driven state refresh.
        map_obj.status = status_for_map

        # 2) Record compliance decision in approvals audit trail.
        approval = Approval(
            map_id=map_obj.id,
            action=status_for_map,
            notes=comments,
            approved_by=reviewer
        )

        # 3) Append lifecycle event for GET /events.
        event = Event(
            circular_id=map_obj.circular_id,
            map_id=map_obj.id,
            event_type=event_type,
            description=event_description,
            actor=reviewer
        )

        db.add_all([approval, event])
        db.commit()
        db.refresh(approval)
        db.refresh(event)
        db.refresh(map_obj)

        return {
            "message": f"MAP {decision_label} successfully",
            "map_status": map_obj.status.upper(),
            "event_type": event.event_type,
            "event_description": event.description,
            "approval": {
                "id": str(approval.id),
                "map_id": str(approval.map_id),
                "decision": decision.value,
                "reviewer": approval.approved_by,
                "comments": approval.notes or "",
                "created_at": approval.created_at
            }
        }
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to persist approval workflow"
        )


@router.get("", response_model=List[ApprovalOut])
async def list_approvals(db: Session = Depends(get_db)):
    """
    List all approval actions.
    """
    return db.query(Approval).all()