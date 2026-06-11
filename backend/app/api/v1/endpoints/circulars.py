"""
PRAGMA — Circulars Endpoints

Owner: Diyasha (Backend APIs) + Anoushka (LLM pipeline)
Milestone: M2

Endpoints:
  POST /circulars/upload   — Upload circular text, trigger MAP extraction
  GET  /circulars          — List all circulars with status
  GET  /circulars/{id}     — Get single circular with its MAPs
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.claude_service import extract_maps

router = APIRouter()

# Temporary in-memory storage for M2
circulars_db = []


class CircularUploadRequest(BaseModel):
    title: str
    content: str


@router.post("/upload")
async def upload_circular(payload: CircularUploadRequest):
    """
    Upload circular text and trigger Claude MAP extraction.
    """

    try:
        maps = extract_maps(payload.content)

        circular = {
            "id": len(circulars_db) + 1,
            "title": payload.title,
            "content": payload.content,
            "status": "PROCESSED",
            "maps": maps,
        }

        circulars_db.append(circular)

        return {
            "success": True,
            "circular_id": circular["id"],
            "maps_count": len(maps),
            "maps": maps,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.get("")
async def list_circulars():
    """
    List all uploaded circulars.
    """

    return [
        {
            "id": c["id"],
            "title": c["title"],
            "status": c["status"],
        }
        for c in circulars_db
    ]


@router.get("/{circular_id}")
async def get_circular(circular_id: int):
    """
    Get a single circular and its extracted MAPs.
    """

    for circular in circulars_db:
        if circular["id"] == circular_id:
            return circular

    raise HTTPException(
        status_code=404,
        detail="Circular not found"
    )