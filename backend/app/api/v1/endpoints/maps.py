"""
PRAGMA — MAPs Endpoints

Owner: Diyasha (Backend APIs)
Milestone: M2

Endpoints:
  GET   /maps                   — List all MAPs (filter: status, department, priority)
  GET   /maps/{id}              — Get single MAP with approval history
  PATCH /maps/{id}/status       — Department marks MAP as In Progress / Completed
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

# Temporary demo storage for M2
maps_db = [
    {
        "id": 1,
        "action": "Update KYC verification process",
        "department": "Compliance",
        "priority": "Critical",
        "status": "PENDING"
    },
    {
        "id": 2,
        "action": "Implement cybersecurity controls",
        "department": "IT",
        "priority": "High",
        "status": "IN_PROGRESS"
    },
    {
        "id": 3,
        "action": "Perform quarterly risk assessment",
        "department": "Risk",
        "priority": "Medium",
        "status": "COMPLETED"
    }
]


class StatusUpdateRequest(BaseModel):
    status: str


@router.get("")
async def list_maps(
    status: Optional[str] = None,
    department: Optional[str] = None,
    priority: Optional[str] = None,
):
    """
    List all MAPs with optional filtering.
    """

    results = maps_db

    if status:
        results = [
            m for m in results
            if m["status"].lower() == status.lower()
        ]

    if department:
        results = [
            m for m in results
            if m["department"].lower() == department.lower()
        ]

    if priority:
        results = [
            m for m in results
            if m["priority"].lower() == priority.lower()
        ]

    return results


@router.get("/{map_id}")
async def get_map(map_id: int):
    """
    Get a single MAP with approval history.
    """

    for m in maps_db:
        if m["id"] == map_id:
            return {
                **m,
                "approval_history": [
                    {
                        "status": m["status"],
                        "timestamp": "2026-06-11T15:00:00"
                    }
                ]
            }

    raise HTTPException(
        status_code=404,
        detail="MAP not found"
    )


@router.patch("/{map_id}/status")
async def update_map_status(
    map_id: int,
    payload: StatusUpdateRequest
):
    """
    Update MAP status.
    """

    valid_statuses = [
        "PENDING",
        "IN_PROGRESS",
        "APPROVED",
        "COMPLETED"
    ]

    if payload.status.upper() not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Status must be one of {valid_statuses}"
        )

    for m in maps_db:
        if m["id"] == map_id:
            m["status"] = payload.status.upper()

            return {
                "message": "MAP status updated successfully",
                "map": m
            }

    raise HTTPException(
        status_code=404,
        detail="MAP not found"
    )