"""
PRAGMA — pytest Configuration and Shared Fixtures

Owner: Anuja (Data & Integration Lead)
Branch: feature/data-pipeline

Provides:
  - FastAPI TestClient
  - Circular text loader (reads from tests/fixtures/)
  - Expected output loader (reads from tests/expected_outputs/)
  - Mock Claude extract_maps (avoids real API calls in unit tests)
  - Seeded in-memory state helpers

Usage:
  All fixtures defined here are auto-available in every test file.
  Tests that call the real Claude API must be marked @pytest.mark.integration.
  Those tests are skipped automatically when ANTHROPIC_API_KEY is not set.
"""

import json
import os
import pytest
from pathlib import Path
from fastapi.testclient import TestClient


# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

FIXTURES_DIR = Path(__file__).parent / "fixtures"
EXPECTED_DIR = Path(__file__).parent / "expected_outputs"


# ---------------------------------------------------------------------------
# pytest markers
# ---------------------------------------------------------------------------

def pytest_configure(config):
    """Register custom markers so pytest doesn't warn about unknown marks."""
    config.addinivalue_line(
        "markers",
        "integration: marks tests that call real external APIs (Claude, RBI feeds). "
        "Skipped when ANTHROPIC_API_KEY is not set in environment.",
    )


def pytest_collection_modifyitems(config, items):
    """Auto-skip integration tests when ANTHROPIC_API_KEY is missing."""
    if not os.environ.get("ANTHROPIC_API_KEY"):
        skip_integration = pytest.mark.skip(
            reason="ANTHROPIC_API_KEY not set — skipping integration tests"
        )
        for item in items:
            if "integration" in item.keywords:
                item.add_marker(skip_integration)


# ---------------------------------------------------------------------------
# FastAPI TestClient
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session")
def client():
    """
    FastAPI TestClient wrapping the full PRAGMA app.
    Session-scoped for performance — one client for all tests.

    Works with both in-memory (M2) and PostgreSQL-backed (M3+) backends.
    Use the `fresh_client` fixture to get a clean state between tests.
    """
    from app.main import app
    with TestClient(app) as c:
        yield c


@pytest.fixture
def fresh_client():
    """
    A TestClient that starts each test from a clean state.

    Uses POST /demo/reset which works with both:
      - In-memory backend (M2): clears the in-memory lists
      - PostgreSQL backend (M3+): truncates DB tables, keeps departments

    This fixture is forward-compatible with Diptanshu's DB integration.
    """
    from app.main import app
    with TestClient(app) as c:
        # Reset state using the demo/reset endpoint — works for both backends
        c.post("/api/v1/demo/reset")
        yield c


# ---------------------------------------------------------------------------
# Fixture file loaders
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session")
def load_circular():
    """
    Returns a callable that reads a circular text file from tests/fixtures/.

    Usage:
        def test_something(load_circular):
            text = load_circular("rbi_digital_lending.txt")
    """
    def _load(filename: str) -> str:
        path = FIXTURES_DIR / filename
        if not path.exists():
            raise FileNotFoundError(
                f"Fixture not found: {path}\n"
                f"Available fixtures: {list(FIXTURES_DIR.glob('*.txt'))}"
            )
        return path.read_text(encoding="utf-8")
    return _load


@pytest.fixture(scope="session")
def load_expected():
    """
    Returns a callable that reads an expected output JSON file from tests/expected_outputs/.

    Usage:
        def test_quality(load_expected):
            spec = load_expected("rbi_digital_lending_maps.json")
            assert len(maps) >= spec["expected_map_count_min"]
    """
    def _load(filename: str) -> dict:
        path = EXPECTED_DIR / filename
        if not path.exists():
            raise FileNotFoundError(
                f"Expected output file not found: {path}\n"
                f"Available: {list(EXPECTED_DIR.glob('*.json'))}"
            )
        return json.loads(path.read_text(encoding="utf-8"))
    return _load


# ---------------------------------------------------------------------------
# Circular text fixtures (pre-loaded for convenience)
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session")
def digital_lending_text(load_circular):
    """Full text of the RBI Digital Lending Guidelines circular."""
    return load_circular("rbi_digital_lending.txt")


@pytest.fixture(scope="session")
def kyc_master_text(load_circular):
    """Full text of the RBI KYC Master Direction circular."""
    return load_circular("rbi_kyc_master.txt")


@pytest.fixture(scope="session")
def cybersecurity_text(load_circular):
    """Full text of the RBI Cybersecurity Framework Guidelines circular."""
    return load_circular("rbi_cybersecurity.txt")


# ---------------------------------------------------------------------------
# Mock Claude — use this in all unit/integration tests to avoid API calls
# ---------------------------------------------------------------------------

MOCK_MAPS = [
    {
        "action": "Provide Key Fact Statement (KFS) to borrowers before loan contract execution, including APR and cooling-off period details",
        "department": "Compliance",
        "priority": "Critical",
        "deadline": "2022-11-30",
        "validation_notes": "Section 5(a) mandates KFS disclosure — Compliance owns disclosure obligations, Critical due to immediate regulatory mandate",
    },
    {
        "action": "Implement system to compute and display Annual Percentage Rate (APR) on net disbursed amount for all digital loan products",
        "department": "IT",
        "priority": "Critical",
        "deadline": "2022-11-30",
        "validation_notes": "Section 5(b) requires APR disclosure upfront — IT owns platform implementation, Critical due to November 2022 deadline",
    },
    {
        "action": "Designate a Nodal Grievance Redressal Officer for digital lending complaints and display contact details on website and app",
        "department": "Legal",
        "priority": "High",
        "deadline": "2022-11-30",
        "validation_notes": "Section 6(a) mandates grievance officer designation — Legal owns compliance obligations",
    },
    {
        "action": "Ensure all borrower data collected by Digital Lending Apps is stored exclusively on servers located within India",
        "department": "IT",
        "priority": "High",
        "deadline": "2022-11-30",
        "validation_notes": "Section 8(b) mandates data localisation — IT owns infrastructure, High due to data sovereignty requirement",
    },
    {
        "action": "Submit quarterly report to RBI on digital loan volume, outstanding portfolio, LSPs engaged, and customer grievances",
        "department": "Compliance",
        "priority": "High",
        "deadline": "2022-12-31",
        "validation_notes": "Section 11(a-b) mandates quarterly RBI reporting with explicit December 2022 first submission",
    },
]


@pytest.fixture
def mock_claude_extract(monkeypatch):
    """
    Monkeypatches claude_service.extract_maps to return MOCK_MAPS.
    Use this fixture in any test that triggers POST /circulars/upload
    to avoid real Claude API calls.

    Returns the mock maps list so tests can assert against it.
    """
    monkeypatch.setattr(
        "app.services.claude_service.extract_maps",
        lambda circular_text: MOCK_MAPS,
    )
    return MOCK_MAPS


@pytest.fixture
def mock_claude_empty(monkeypatch):
    """Mock that simulates Claude returning an empty list (error condition)."""
    def _raise(circular_text):
        raise ValueError("Claude returned an empty MAP list — circular may be too short or ambiguous")
    monkeypatch.setattr("app.services.claude_service.extract_maps", _raise)


@pytest.fixture
def mock_claude_runtime_error(monkeypatch):
    """Mock that simulates Claude API being unavailable."""
    def _raise(circular_text):
        raise RuntimeError("Claude API error on first call: connection timeout")
    monkeypatch.setattr("app.services.claude_service.extract_maps", _raise)


# ---------------------------------------------------------------------------
# Upload helper — convenience fixture for e2e tests
# ---------------------------------------------------------------------------

@pytest.fixture
def upload_digital_lending(fresh_client, mock_claude_extract, digital_lending_text):
    """
    Uploads the RBI Digital Lending circular with mocked Claude extraction.
    Returns the full upload response JSON.

    Use this in e2e tests as the starting point instead of repeating setup.
    """
    response = fresh_client.post(
        "/api/v1/circulars/upload",
        json={
            "title": "RBI Digital Lending Guidelines 2022",
            "source": "RBI",
            "content": digital_lending_text,
        },
    )
    assert response.status_code == 200, f"Upload failed: {response.text}"
    return response.json()
