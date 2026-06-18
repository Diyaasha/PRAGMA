"""
PRAGMA — Circular Endpoint Integration Tests

Owner: Anuja (Data & Integration Lead)
Branch: feature/data-pipeline

Tests the POST /circulars/upload, GET /circulars, GET /circulars/{id} endpoints.
All tests use mock_claude_extract by default — no API key required.

NOTE: CircularUploadRequest requires a 'source' field (RBI | SEBI | MCA)
as of Diptanshu's DB integration. All payloads include source: 'RBI'.
"""

import pytest


# ---------------------------------------------------------------------------
# POST /circulars/upload
# ---------------------------------------------------------------------------

class TestCircularUpload:
    """Tests for POST /api/v1/circulars/upload"""

    def test_upload_returns_200(self, fresh_client, mock_claude_extract, digital_lending_text):
        """Uploading a valid circular must return HTTP 200."""
        response = fresh_client.post(
            "/api/v1/circulars/upload",
            json={
                "title": "RBI Digital Lending Guidelines 2022",
                "source": "RBI",
                "content": digital_lending_text,
            },
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"

    def test_upload_response_has_success_flag(self, fresh_client, mock_claude_extract, digital_lending_text):
        """Upload response must include success: True."""
        response = fresh_client.post(
            "/api/v1/circulars/upload",
            json={"title": "Test Circular", "source": "RBI", "content": digital_lending_text},
        )
        data = response.json()
        assert data.get("success") is True

    def test_upload_response_includes_maps(self, fresh_client, mock_claude_extract, digital_lending_text):
        """Upload response must include the extracted MAPs array."""
        response = fresh_client.post(
            "/api/v1/circulars/upload",
            json={"title": "Test Circular", "source": "RBI", "content": digital_lending_text},
        )
        data = response.json()
        assert "maps" in data, "Response missing 'maps' field"
        assert isinstance(data["maps"], list), "'maps' must be a list"
        assert len(data["maps"]) > 0, "MAPs list must not be empty"

    def test_upload_response_maps_count_matches(
        self, fresh_client, mock_claude_extract, digital_lending_text
    ):
        """maps_count in response must match the actual number of maps returned."""
        response = fresh_client.post(
            "/api/v1/circulars/upload",
            json={"title": "Test Circular", "source": "RBI", "content": digital_lending_text},
        )
        data = response.json()
        assert data["maps_count"] == len(data["maps"])

    def test_upload_maps_count_matches_mock_length(
        self, fresh_client, mock_claude_extract, digital_lending_text
    ):
        """The number of MAPs returned must equal the number in the mock."""
        response = fresh_client.post(
            "/api/v1/circulars/upload",
            json={"title": "Test Circular", "source": "RBI", "content": digital_lending_text},
        )
        data = response.json()
        assert data["maps_count"] == len(mock_claude_extract)

    def test_upload_response_includes_circular_id(
        self, fresh_client, mock_claude_extract, digital_lending_text
    ):
        """Upload response must include a circular_id."""
        response = fresh_client.post(
            "/api/v1/circulars/upload",
            json={"title": "Test Circular", "source": "RBI", "content": digital_lending_text},
        )
        data = response.json()
        assert "circular_id" in data, f"Response missing 'circular_id'. Got: {data}"
        assert data["circular_id"] is not None

    def test_upload_maps_have_valid_department(
        self, fresh_client, mock_claude_extract, digital_lending_text
    ):
        """All returned MAPs must have a valid department."""
        valid_departments = {"IT", "Compliance", "Risk", "Treasury", "Legal"}
        response = fresh_client.post(
            "/api/v1/circulars/upload",
            json={"title": "Test Circular", "source": "RBI", "content": digital_lending_text},
        )
        data = response.json()
        for i, m in enumerate(data["maps"]):
            assert m["department"] in valid_departments, (
                f"MAP[{i}] has invalid department: '{m['department']}'"
            )

    def test_upload_maps_have_valid_priority(
        self, fresh_client, mock_claude_extract, digital_lending_text
    ):
        """All returned MAPs must have a valid priority."""
        valid_priorities = {"Critical", "High", "Medium", "Low"}
        response = fresh_client.post(
            "/api/v1/circulars/upload",
            json={"title": "Test Circular", "source": "RBI", "content": digital_lending_text},
        )
        data = response.json()
        for i, m in enumerate(data["maps"]):
            assert m["priority"] in valid_priorities, (
                f"MAP[{i}] has invalid priority: '{m['priority']}'"
            )

    def test_upload_missing_title_returns_422(self, fresh_client, digital_lending_text):
        """Upload without 'title' field must return HTTP 422 (validation error)."""
        response = fresh_client.post(
            "/api/v1/circulars/upload",
            json={"source": "RBI", "content": digital_lending_text},
        )
        assert response.status_code == 422

    def test_upload_missing_source_returns_422(self, fresh_client, digital_lending_text):
        """Upload without 'source' field must return HTTP 422."""
        response = fresh_client.post(
            "/api/v1/circulars/upload",
            json={"title": "Test Circular", "content": digital_lending_text},
        )
        assert response.status_code == 422

    def test_upload_missing_content_returns_422(self, fresh_client):
        """Upload without 'content' field must return HTTP 422."""
        response = fresh_client.post(
            "/api/v1/circulars/upload",
            json={"title": "Test Circular", "source": "RBI"},
        )
        assert response.status_code == 422

    def test_upload_claude_failure_returns_500(
        self, fresh_client, mock_claude_runtime_error, digital_lending_text
    ):
        """When Claude API is unavailable, upload must return 500."""
        response = fresh_client.post(
            "/api/v1/circulars/upload",
            json={"title": "Test Circular", "source": "RBI", "content": digital_lending_text},
        )
        assert response.status_code == 500


# ---------------------------------------------------------------------------
# GET /circulars
# ---------------------------------------------------------------------------

class TestListCirculars:
    """Tests for GET /api/v1/circulars"""

    def test_list_circulars_returns_200(self, fresh_client):
        """GET /circulars must return HTTP 200."""
        response = fresh_client.get("/api/v1/circulars")
        assert response.status_code == 200

    def test_list_circulars_empty_initially(self, fresh_client):
        """List must be empty on a fresh reset state."""
        response = fresh_client.get("/api/v1/circulars")
        assert response.json() == []

    def test_list_circulars_after_upload(
        self, fresh_client, mock_claude_extract, digital_lending_text
    ):
        """After one upload, list must have exactly one circular."""
        fresh_client.post(
            "/api/v1/circulars/upload",
            json={"title": "RBI Digital Lending 2022", "source": "RBI", "content": digital_lending_text},
        )
        response = fresh_client.get("/api/v1/circulars")
        circulars = response.json()
        assert len(circulars) == 1

    def test_list_circulars_includes_title(
        self, fresh_client, mock_claude_extract, digital_lending_text
    ):
        """Each circular in the list must include the title."""
        fresh_client.post(
            "/api/v1/circulars/upload",
            json={"title": "RBI Digital Lending 2022", "source": "RBI", "content": digital_lending_text},
        )
        response = fresh_client.get("/api/v1/circulars")
        circulars = response.json()
        assert circulars[0]["title"] == "RBI Digital Lending 2022"

    def test_list_circulars_includes_status(
        self, fresh_client, mock_claude_extract, digital_lending_text
    ):
        """Each circular in the list must include a status field."""
        fresh_client.post(
            "/api/v1/circulars/upload",
            json={"title": "Test", "source": "RBI", "content": digital_lending_text},
        )
        response = fresh_client.get("/api/v1/circulars")
        circulars = response.json()
        assert "status" in circulars[0]


# ---------------------------------------------------------------------------
# GET /circulars/{id}
# ---------------------------------------------------------------------------

class TestGetCircular:
    """Tests for GET /api/v1/circulars/{id}"""

    def test_get_circular_by_id_returns_200(
        self, fresh_client, mock_claude_extract, digital_lending_text
    ):
        """GET /circulars/{id} for a valid circular must return 200."""
        upload = fresh_client.post(
            "/api/v1/circulars/upload",
            json={"title": "Test Circular", "source": "RBI", "content": digital_lending_text},
        )
        circular_id = upload.json()["circular_id"]
        response = fresh_client.get(f"/api/v1/circulars/{circular_id}")
        assert response.status_code == 200

    def test_get_circular_includes_maps(
        self, fresh_client, mock_claude_extract, digital_lending_text
    ):
        """GET /circulars/{id} must include the circular's MAPs."""
        upload = fresh_client.post(
            "/api/v1/circulars/upload",
            json={"title": "Test Circular", "source": "RBI", "content": digital_lending_text},
        )
        circular_id = upload.json()["circular_id"]
        response = fresh_client.get(f"/api/v1/circulars/{circular_id}")
        data = response.json()
        assert "maps" in data, "Circular detail missing 'maps' field"
        assert len(data["maps"]) > 0

    def test_get_nonexistent_circular_returns_404(self, fresh_client):
        """GET /circulars/{fake_uuid} must return 404 or 422."""
        response = fresh_client.get("/api/v1/circulars/00000000-0000-0000-0000-000000000000")
        assert response.status_code in (404, 422), (
            f"Expected 404 or 422 for non-existent circular, got {response.status_code}"
        )
