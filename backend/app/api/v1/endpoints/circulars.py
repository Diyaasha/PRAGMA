"""
PRAGMA — Circulars Endpoints

Owner: Diyasha (Backend APIs) + Anoushka (LLM pipeline)
Milestone: M2

Endpoints:
  POST /circulars/upload   — Upload circular text, trigger MAP extraction
  GET  /circulars          — List all circulars with status
  GET  /circulars/{id}     — Get single circular with its MAPs
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.database import get_db
from app.models.circular import Circular
from app.schemas.circular import CircularUploadRequest, CircularOut
from app.services.claude_service import extract_maps
from app.services.map_service import create_maps_from_extraction
from app.services.event_service import log_event

router = APIRouter()


@router.post("/upload")
async def upload_circular(payload: CircularUploadRequest, db: Session = Depends(get_db)):
    """
    Upload circular text and trigger Claude MAP extraction.
    """
    try:
        # Create Circular in database
        circular = Circular(
            title=payload.title,
            source=payload.source,
            content=payload.content,
            status="processed"
        )
        db.add(circular)
        db.commit()
        db.refresh(circular)

        # Log event circular_uploaded
        log_event(
            db=db,
            event_type="circular_uploaded",
            description=f"Circular '{payload.title}' uploaded successfully",
            circular_id=circular.id
        )

        # Extract MAPs using Claude service
        raw_maps = extract_maps(payload.content)

        # Create and persist MAP records
        created_maps = create_maps_from_extraction(db, circular.id, raw_maps)

        return {
            "success": True,
            "circular_id": str(circular.id),
            "maps_count": len(created_maps),
            "maps": [
                {
                    "action": m.action,
                    "department": m.department.name if m.department else None,
                    "priority": m.priority,
                    "deadline": m.deadline.isoformat() if m.deadline else None,
                    "validation_notes": m.validation_notes
                }
                for m in created_maps
            ]
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.get("", response_model=List[CircularOut])
async def list_circulars(db: Session = Depends(get_db)):
    """
    List all uploaded circulars.
    """
    return db.query(Circular).all()


@router.get("/{circular_id}", response_model=CircularOut)
async def get_circular(circular_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Get a single circular and its extracted MAPs.
    """
    circular = db.query(Circular).filter(Circular.id == circular_id).first()
    if not circular:
        raise HTTPException(
            status_code=404,
            detail="Circular not found"
        )
    return circular