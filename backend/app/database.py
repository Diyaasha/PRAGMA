"""
PRAGMA — Database Engine, Session, and Base

All SQLAlchemy models inherit from Base.
Use get_db() as a FastAPI dependency to obtain a session.

Offline-first: defaults to SQLite for demo/submission.
PostgreSQL is supported for development (set DATABASE_URL in .env).
"""

import uuid as _uuid_module
from sqlalchemy import create_engine, String
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy.types import TypeDecorator

from app.config import settings


# ── Platform-independent UUID column type ─────────────────────────────────────
# Stores as String(36) so it works identically on SQLite and PostgreSQL.
# process_bind_param: converts UUID objects to str before SQL binding.
# process_result_value: returns value as-is (str); callers treat IDs as strings.

class UUIDType(TypeDecorator):
    """
    Database-agnostic UUID column.

    SQLite:     stored as TEXT(36)
    PostgreSQL: stored as TEXT(36) (not native UUID — keeps migration trivial)
    """
    impl      = String(36)
    cache_ok  = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        return str(value)

    def process_result_value(self, value, dialect):
        return value   # string UUID — consistent across both backends

    @staticmethod
    def new() -> str:
        """Generate a new UUID4 string. Use as column default."""
        return str(_uuid_module.uuid4())


# ── Engine factory ────────────────────────────────────────────────────────────

def _build_engine():
    url = settings.DATABASE_URL

    # Disable SQLAlchemy 2.0 "insertmanyvalues" batching. Our UUID primary key is a
    # custom TypeDecorator (UUIDType) with a client-side default (UUIDType.new). When
    # several rows are inserted in one flush (e.g. multiple MAPs from one circular),
    # the insertmanyvalues sentinel mechanism cannot correlate the RETURNING rows on
    # PostgreSQL and raises "Can't match sentinel values in result set". Falling back
    # to per-row INSERT...RETURNING is correct and fast enough at our scale.
    if url.startswith("sqlite"):
        # SQLite: no connection pool, enable WAL for concurrent reads during demo
        from sqlalchemy.pool import StaticPool
        return create_engine(
            url,
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
            use_insertmanyvalues=False,
        )

    # PostgreSQL (development / future production)
    if "connect_timeout" not in url:
        sep = "&" if "?" in url else "?"
        url = f"{url}{sep}connect_timeout=10"

    return create_engine(
        url,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=5,
        pool_timeout=10,
        pool_recycle=1800,
        connect_args={"connect_timeout": 10},
        use_insertmanyvalues=False,
    )


engine = _build_engine()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_all_tables() -> None:
    """Create all tables if they do not already exist. Safe to call repeatedly."""
    Base.metadata.create_all(bind=engine)
