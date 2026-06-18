"""
PRAGMA — MAP (Measurable Action Point) ORM Model

The core entity of PRAGMA. Extracted from a circular by Claude.
Each MAP is assigned to a department, approved by compliance, and actioned.

Owner: Diptanshu (Database Design)
Milestone: M1
"""

import uuid
from sqlalchemy import Column, String, Text, Date, DateTime, ForeignKey, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base

# Valid status transitions:
# Pending → Approved → In Progress → Completed
# Pending → Rejected
MAP_STATUSES = ["Pending", "Approved", "Rejected", "In Progress", "Completed"]
MAP_PRIORITIES = ["Critical", "High", "Medium", "Low"]


class MAP(Base):
    __tablename__ = "maps"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    circular_id = Column(UUID(as_uuid=True), ForeignKey("circulars.id", ondelete="CASCADE"), nullable=False)
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"), nullable=True)

    action = Column(Text, nullable=False)           # What must be done
    priority = Column(String, nullable=False)        # Critical | High | Medium | Low
    deadline = Column(Date, nullable=True)
    status = Column(String, default="Pending")       # See MAP_STATUSES above
    validation_notes = Column(Text, nullable=True)   # Claude's reasoning / Anuja's notes

    # Optional enhancements (Task 11)
    confidence_score = Column(Float, nullable=True)
    source_clause = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    circular = relationship("Circular", back_populates="maps")
    department = relationship("Department", back_populates="maps")
    approvals = relationship("Approval", back_populates="map", cascade="all, delete-orphan")
    events = relationship("Event", back_populates="map")

    def __repr__(self):
        return f"<MAP id={self.id} priority={self.priority} status={self.status}>"
