"""
PRAGMA — Departments Endpoints

Owner: Diptanshu (Database Design)
Milestone: M1

Endpoints:
  GET /departments   — List all departments (used by routing logic and UI dropdowns)
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.department import DepartmentOut
from app.services.department_service import get_all_departments

router = APIRouter()


@router.get("", response_model=List[DepartmentOut])
async def list_departments(db: Session = Depends(get_db)):
    """
    List all available departments.
    """
    return get_all_departments(db)
