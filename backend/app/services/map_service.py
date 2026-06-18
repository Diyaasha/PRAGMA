"""
PRAGMA — MAP Service

Owner: Diyasha (Backend APIs)
Milestone: M2

Responsibilities:
  - Persist MAPs extracted by claude_service into the database
  - Look up department by name and attach to each MAP
  - Update MAP status with validation
  - Query MAPs with filters
"""

from datetime import datetime, date
import logging
from sqlalchemy.orm import Session
import uuid

from app.models.map import MAP, MAP_STATUSES
from app.models.department import Department
from app.services.event_service import log_event

logger = logging.getLogger(__name__)


def create_maps_from_extraction(db: Session, circular_id: uuid.UUID, raw_maps: list[dict]) -> list[MAP]:
    """
    Receive Claude MAP output, resolve departments, create and persist MAP records, and return them.
    """
    created_maps = []
    for raw_map in raw_maps:
        # Resolve department
        dept_name = raw_map.get("department")
        dept = None
        if dept_name:
            dept = db.query(Department).filter(Department.name.ilike(dept_name.strip())).first()

        # Parse deadline
        deadline_date = None
        raw_deadline = raw_map.get("deadline")
        if raw_deadline:
            if isinstance(raw_deadline, str):
                try:
                    deadline_date = datetime.strptime(raw_deadline, "%Y-%m-%d").date()
                except ValueError:
                    logger.warning(f"Could not parse deadline date: {raw_deadline}")
            elif isinstance(raw_deadline, (date, datetime)):
                deadline_date = raw_deadline

        # Build MAP object
        # Note: we also map optional enhancement fields if they are supplied.
        new_map = MAP(
            circular_id=circular_id,
            department_id=dept.id if dept else None,
            action=raw_map.get("action"),
            priority=raw_map.get("priority", "Medium"),
            deadline=deadline_date,
            status="Pending",
            validation_notes=raw_map.get("validation_notes"),
            confidence_score=raw_map.get("confidence_score"),
            source_clause=raw_map.get("source_clause")
        )
        db.add(new_map)
        created_maps.append(new_map)

    db.commit()
    for m in created_maps:
        db.refresh(m)

    # Log maps_extracted event
    log_event(
        db=db,
        event_type="maps_extracted",
        description=f"{len(created_maps)} MAPs extracted and routed successfully",
        circular_id=circular_id
    )

    return created_maps


def get_maps(
    db: Session,
    status: str = None,
    department: str = None,
    priority: str = None,
    circular_id: uuid.UUID = None
) -> list[MAP]:
    """
    Query MAPs with optional filters for status, department name, priority, and parent circular.
    """
    query = db.query(MAP)

    if status:
        query = query.filter(MAP.status.ilike(status.strip()))

    if department:
        query = query.join(MAP.department).filter(Department.name.ilike(department.strip()))

    if priority:
        query = query.filter(MAP.priority.ilike(priority.strip()))

    if circular_id:
        query = query.filter(MAP.circular_id == circular_id)

    return query.all()


def get_map_by_id(db: Session, map_id: uuid.UUID) -> MAP | None:
    """
    Look up a single MAP record by ID.
    """
    return db.query(MAP).filter(MAP.id == map_id).first()


def update_map_status(db: Session, map_id: uuid.UUID, new_status: str) -> MAP:
    """
    Update a MAP's status with validation on allowed state transitions.
    Raises ValueError for invalid transitions.
    """
    map_obj = get_map_by_id(db, map_id)
    if not map_obj:
        raise ValueError("MAP not found")

    current_status = map_obj.status
    # Normalize transition string
    normalized_new_status = new_status.strip().title()
    if normalized_new_status == "In Progress":
        normalized_new_status = "In Progress"

    if normalized_new_status not in MAP_STATUSES:
        raise ValueError(f"Invalid status: {new_status}. Must be one of {MAP_STATUSES}")

    if current_status == normalized_new_status:
        return map_obj

    # Validate state machine transitions:
    # Pending -> Approved
    # Pending -> Rejected
    # Approved -> In Progress
    # In Progress -> Completed
    valid = False
    if current_status == "Pending" and normalized_new_status in ["Approved", "Rejected"]:
        valid = True
    elif current_status == "Approved" and normalized_new_status == "In Progress":
        valid = True
    elif current_status == "In Progress" and normalized_new_status == "Completed":
        valid = True

    if not valid:
        raise ValueError(f"Invalid state transition from {current_status} to {normalized_new_status}")

    # Set new status
    map_obj.status = normalized_new_status
    db.commit()
    db.refresh(map_obj)

    # Determine event log params
    event_type = "map_status_changed"
    actor = "System"
    if normalized_new_status == "Approved":
        event_type = "map_approved"
        actor = "Compliance Officer"
    elif normalized_new_status == "Rejected":
        event_type = "map_rejected"
        actor = "Compliance Officer"
    elif normalized_new_status == "Completed":
        event_type = "map_completed"
        if map_obj.department:
            actor = map_obj.department.name

    log_event(
        db=db,
        event_type=event_type,
        description=f"MAP status updated to {normalized_new_status}",
        actor=actor,
        circular_id=map_obj.circular_id,
        map_id=map_obj.id
    )

    return map_obj
