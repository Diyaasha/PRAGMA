"""
PRAGMA — Circulars Endpoints

Endpoints:
  POST /circulars/upload       — Upload circular text, trigger MAP extraction
  POST /circulars/upload-file  — Upload PDF/DOCX/TXT file, parse locally, extract MAPs
  GET  /circulars              — List all circulars (summary)
  GET  /circulars/{id}         — Get single circular with its MAPs
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app.database import get_db
from app.models.circular import Circular
from app.schemas.circular import CircularUploadRequest, CircularOut, CircularSummaryOut
from app.services.ai_engine import extract_maps as ai_extract_maps
from app.services.map_service import create_maps_from_extraction
from app.services.event_service import log_event

router = APIRouter()

MAX_FILE_BYTES = 20 * 1024 * 1024  # 20 MB


def _persist_and_extract(db: Session, title: str, source: str, content: str) -> dict:
    """Shared logic: save circular → extract MAPs → return response dict."""
    circular = Circular(title=title, source=source, content=content, status="processed")
    db.add(circular)
    db.commit()
    db.refresh(circular)

    log_event(
        db=db,
        event_type="circular_uploaded",
        description=f"Circular '{title}' uploaded successfully",
        circular_id=circular.id,
    )

    raw_maps, engine_used = ai_extract_maps(content)
    created_maps = create_maps_from_extraction(db, circular.id, raw_maps)

    log_event(
        db=db,
        event_type="maps_extracted",
        description=f"Local AI Engine extracted {len(created_maps)} MAPs from '{title}' using {engine_used}",
        circular_id=circular.id,
    )

    return {
        "success":     True,
        "circular_id": str(circular.id),
        "maps_count":  len(created_maps),
        "engine_used": engine_used,
        "maps": [
            {
                "action":           m.action,
                "department":       m.department.name if m.department else None,
                "priority":         m.priority,
                "deadline":         m.deadline.isoformat() if m.deadline else None,
                "validation_notes": m.validation_notes,
            }
            for m in created_maps
        ],
    }


@router.post("/upload")
async def upload_circular(payload: CircularUploadRequest, db: Session = Depends(get_db)):
    """Upload circular as JSON text body and extract MAPs offline."""
    try:
        return _persist_and_extract(db, payload.title, payload.source, payload.content)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload-file")
async def upload_circular_file(
    file:   UploadFile = File(...),
    title:  str        = Form(...),
    source: str        = Form("RBI"),
    db:     Session    = Depends(get_db),
):
    """
    Upload a PDF, DOCX, DOC, or TXT file.
    Parsed locally via PyMuPDF / python-docx — zero internet required.
    """
    raw = await file.read()

    if len(raw) > MAX_FILE_BYTES:
        raise HTTPException(status_code=413, detail="File exceeds 20 MB limit")

    if not raw:
        raise HTTPException(status_code=422, detail="Uploaded file is empty")

    # Parse document to text (offline)
    try:
        from app.services.document_parser import parse_document
        content = parse_document(file.filename or "upload.txt", raw)
    except (ValueError, RuntimeError) as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document parsing failed: {e}")

    if not content.strip():
        raise HTTPException(status_code=422, detail="Could not extract text from uploaded file")

    try:
        return _persist_and_extract(db, title, source, content)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=List[CircularSummaryOut])
async def list_circulars(db: Session = Depends(get_db)):
    """List all uploaded circulars (summary only, no content/maps)."""
    return db.query(Circular).order_by(Circular.uploaded_at.desc()).all()


@router.get("/{circular_id}", response_model=CircularOut)
async def get_circular(circular_id: uuid.UUID, db: Session = Depends(get_db)):
    """Get a single circular with its extracted MAPs."""
    circular = db.query(Circular).filter(Circular.id == str(circular_id)).first()
    if not circular:
        raise HTTPException(status_code=404, detail="Circular not found")
    return circular
