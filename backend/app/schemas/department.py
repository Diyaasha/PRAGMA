"""
PRAGMA — Department Pydantic Schemas

Owner: Diptanshu
Milestone: M1

Simple read-only schema — departments are seeded, not created via API.
"""

from pydantic import BaseModel, ConfigDict
import uuid


class DepartmentOut(BaseModel):
    id: uuid.UUID
    name: str

    model_config = ConfigDict(from_attributes=True)
