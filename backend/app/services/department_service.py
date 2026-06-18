"""
PRAGMA — Department Service

Owner: Diptanshu (Database Design)
Milestone: M1

Handles department lookup and seed-on-startup logic.
"""

import logging
from sqlalchemy.orm import Session
from app.models.department import Department, DEPARTMENT_NAMES

logger = logging.getLogger(__name__)


def seed_departments(db: Session) -> None:
    """
    Called on app startup. Inserts the default departments if the table is empty.
    """
    try:
        # Check if departments are already seeded
        if db.query(Department).first() is None:
            logger.info("Seeding departments...")
            for name in DEPARTMENT_NAMES:
                dept = Department(name=name)
                db.add(dept)
            db.commit()
            logger.info("Successfully seeded departments.")
        else:
            logger.info("Departments already seeded. Skipping.")
    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding departments: {e}")
        raise


def get_department_by_name(db: Session, name: str) -> Department | None:
    """
    Retrieve a single department by name (case-insensitive).
    """
    return db.query(Department).filter(Department.name.ilike(name.strip())).first()


def get_all_departments(db: Session) -> list[Department]:
    """
    Retrieve all department records.
    """
    return db.query(Department).all()
