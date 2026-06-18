"""
PRAGMA — MAPs Endpoints

Owner: Diyasha (Backend APIs)
Milestone: M2

Endpoints:
  GET   /maps                   — List all MAPs (filter: status, department, priority, circular_id)
  GET   /maps/{id}              — Get single MAP with approval history
  PATCH /maps/{id}/status       — Department marks MAP as In Progress / Completed
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app.database import get_db
from app.schemas.map import MAPOut, MAPDetailOut, MAPStatusUpdate
from app.services.map_service import get_maps, get_map_by_id, update_map_status

router = APIRouter()


@router.get("", response_model=List[MAPOut])
async def list_maps(
    status: Optional[str] = None,
    department: Optional[str] = None,
    priority: Optional[str] = None,
    circular_id: Optional[uuid.UUID] = None,
    db: Session = Depends(get_db)
):
    """
    List all MAPs with optional filtering.
    """
    return get_maps(db, status=status, department=department, priority=priority, circular_id=circular_id)


@router.get("/{map_id}", response_model=MAPDetailOut)
async def get_map(map_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Get a single MAP with approval history.
    """
    map_obj = get_map_by_id(db, map_id)
    if not map_obj:
        raise HTTPException(
            status_code=404,
            detail="MAP not found"
        )
    return map_obj


@router.patch("/{map_id}/status")
async def update_status(
    map_id: uuid.UUID,
    payload: MAPStatusUpdate,
    db: Session = Depends(get_db)
):
    """
    Update MAP status.
    """
    try:
        updated_map = update_map_status(db, map_id, payload.status)
        return {
            "message": "MAP status updated successfully",
            "map": MAPOut.model_validate(updated_map)
        }
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )