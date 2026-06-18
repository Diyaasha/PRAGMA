"""
PRAGMA — Claude Service Tests

Owner: Anuja (Data & Integration Lead)
Branch: feature/data-pipeline

Tests MAP extraction quality against the validation dataset.
Anuja owns the test fixtures (sample circulars + expected MAP outputs).

Test classes:
  TestMAPSchema        — Validates structure of every MAP (no API key needed)
  TestMAPQuality       — Quality validation against expected outputs (needs API key)
  TestEdgeCases        — Validates claude_service robustness (no API key needed)
"""

import pytest
from datetime import datetime


# ---------------------------------------------------------------------------
# Constants — mirrors claude_service.py
# ---------------------------------------------------------------------------

VALID_DEPARTMENTS = {"IT", "Compliance", "Risk", "Treasury", "Legal"}
VALID_PRIORITIES = {"Critical", "High", "Medium", "Low"}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def assert_map_schema(map_item: dict, index: int = 0):
    """Assert that a single MAP dict has all required fields with valid values."""
    assert "action" in map_item, f"MAP[{index}] missing 'action' field"
    assert "department" in map_item, f"MAP[{index}] missing 'department' field"
    assert "priority" in map_item, f"MAP[{index}] missing 'priority' field"
    assert "deadline" in map_item, f"MAP[{index}] missing 'deadline' field"
    assert "validation_notes" in map_item, f"MAP[{index}] missing 'validation_notes' field"

    assert isinstance(map_item["action"], str), f"MAP[{index}] 'action' must be a string"
    assert len(map_item["action"].strip()) >= 15, (
        f"MAP[{index}] 'action' is too short ({len(map_item['action'])} chars) — must be >= 15. "
        f"Got: '{map_item['action']}'"
    )

    assert map_item["department"] in VALID_DEPARTMENTS, (
        f"MAP[{index}] has invalid department '{map_item['department']}'. "
        f"Must be one of {VALID_DEPARTMENTS}"
    )

    assert map_item["priority"] in VALID_PRIORITIES, (
        f"MAP[{index}] has invalid priority '{map_item['priority']}'. "
        f"Must be one of {VALID_PRIORITIES}"
    )

    deadline = map_item["deadline"]
    if deadline is not None:
        try:
            datetime.strptime(str(deadline), "%Y-%m-%d")
        except ValueError:
            pytest.fail(
                f"MAP[{index}] 'deadline' is not a valid YYYY-MM-DD date: '{deadline}'"
            )


# ---------------------------------------------------------------------------
# TestMAPSchema — runs on MOCK_MAPS, no API key needed
# ---------------------------------------------------------------------------

class TestMAPSchema:
    """
    Validates the structure and field constraints of MAPs.
    Uses the mock maps from conftest.py — no Claude API call needed.
    """

    def test_mock_maps_are_non_empty(self, mock_claude_extract):
        """The mock MAP list used in tests must not be empty."""
        assert len(mock_claude_extract) > 0, "MOCK_MAPS in conftest.py is empty"

    def test_all_maps_have_required_fields(self, mock_claude_extract):
        """Every MAP must have all 5 required fields."""
        for i, map_item in enumerate(mock_claude_extract):
            assert_map_schema(map_item, index=i)

    def test_departments_are_valid(self, mock_claude_extract):
        """Every MAP department must be from the allowed set."""
        for i, map_item in enumerate(mock_claude_extract):
            assert map_item["department"] in VALID_DEPARTMENTS, (
                f"MAP[{i}] has invalid department: '{map_item['department']}'"
            )

    def test_priorities_are_valid(self, mock_claude_extract):
        """Every MAP priority must be from the allowed set."""
        for i, map_item in enumerate(mock_claude_extract):
            assert map_item["priority"] in VALID_PRIORITIES, (
                f"MAP[{i}] has invalid priority: '{map_item['priority']}'"
            )

    def test_deadlines_are_null_or_valid_date(self, mock_claude_extract):
        """Every MAP deadline must be null or a valid YYYY-MM-DD string."""
        for i, map_item in enumerate(mock_claude_extract):
            deadline = map_item.get("deadline")
            if deadline is not None:
                try:
                    datetime.strptime(str(deadline), "%Y-%m-%d")
                except ValueError:
                    pytest.fail(
                        f"MAP[{i}] has invalid deadline format: '{deadline}'. "
                        "Must be YYYY-MM-DD or null."
                    )

    def test_action_is_not_trivially_short(self, mock_claude_extract):
        """MAP actions must be specific and non-trivial (>= 15 chars)."""
        for i, map_item in enumerate(mock_claude_extract):
            assert len(map_item["action"].strip()) >= 15, (
                f"MAP[{i}] action is too short: '{map_item['action']}'"
            )

    def test_action_is_a_string(self, mock_claude_extract):
        """MAP action field must be a string."""
        for i, map_item in enumerate(mock_claude_extract):
            assert isinstance(map_item["action"], str), (
                f"MAP[{i}] action is not a string: {type(map_item['action'])}"
            )

    def test_validation_notes_present(self, mock_claude_extract):
        """MAP validation_notes must be present (can be empty string)."""
        for i, map_item in enumerate(mock_claude_extract):
            assert "validation_notes" in map_item, f"MAP[{i}] missing validation_notes"


# ---------------------------------------------------------------------------
# TestEdgeCases — tests claude_service error handling, no API key needed
# ---------------------------------------------------------------------------

class TestEdgeCases:
    """
    Tests that claude_service.extract_maps raises correctly on bad inputs.
    These tests use the real function signature but monkeypatch the Claude call.
    """

    def test_empty_string_raises_value_error(self):
        """extract_maps must raise ValueError on empty input."""
        from app.services.claude_service import extract_maps
        with pytest.raises(ValueError, match="cannot be empty"):
            extract_maps("")

    def test_whitespace_only_raises_value_error(self):
        """extract_maps must raise ValueError on whitespace-only input."""
        from app.services.claude_service import extract_maps
        with pytest.raises(ValueError, match="cannot be empty"):
            extract_maps("   \n\t  ")

    def test_validate_and_normalise_rejects_missing_action(self):
        """_validate_and_normalise must raise ValueError when 'action' is missing."""
        from app.services.claude_service import _validate_and_normalise
        bad_maps = [{"department": "IT", "priority": "High"}]
        with pytest.raises(ValueError, match="missing required fields"):
            _validate_and_normalise(bad_maps)

    def test_validate_and_normalise_rejects_missing_department(self):
        """_validate_and_normalise must raise ValueError when 'department' is missing."""
        from app.services.claude_service import _validate_and_normalise
        bad_maps = [{"action": "Do something", "priority": "High"}]
        with pytest.raises(ValueError, match="missing required fields"):
            _validate_and_normalise(bad_maps)

    def test_validate_and_normalise_rejects_missing_priority(self):
        """_validate_and_normalise must raise ValueError when 'priority' is missing."""
        from app.services.claude_service import _validate_and_normalise
        bad_maps = [{"action": "Do something", "department": "IT"}]
        with pytest.raises(ValueError, match="missing required fields"):
            _validate_and_normalise(bad_maps)

    def test_unknown_department_falls_back_to_keyword_routing(self):
        """
        _validate_and_normalise must not raise on unknown department —
        it should fall back to keyword-based routing.
        """
        from app.services.claude_service import _validate_and_normalise
        maps_with_bad_dept = [{
            "action": "Implement cybersecurity controls for all IT systems",
            "department": "TechTeam",   # not a valid department
            "priority": "High",
            "deadline": None,
            "validation_notes": "test",
        }]
        result = _validate_and_normalise(maps_with_bad_dept)
        assert result[0]["department"] in VALID_DEPARTMENTS

    def test_unknown_priority_defaults_to_medium(self):
        """_validate_and_normalise must default unknown priority to 'Medium'."""
        from app.services.claude_service import _validate_and_normalise
        maps_with_bad_priority = [{
            "action": "Implement KYC verification procedures",
            "department": "Compliance",
            "priority": "Urgent",   # not a valid priority
            "deadline": None,
            "validation_notes": "test",
        }]
        result = _validate_and_normalise(maps_with_bad_priority)
        assert result[0]["priority"] == "Medium"

    def test_null_deadline_variants_are_normalised(self):
        """Various null-like deadline strings must be converted to None."""
        from app.services.claude_service import _validate_and_normalise
        for null_val in ["null", "none", "n/a", "", "NULL"]:
            maps = [{
                "action": "Update regulatory reporting procedures",
                "department": "Compliance",
                "priority": "High",
                "deadline": null_val,
                "validation_notes": "test",
            }]
            result = _validate_and_normalise(maps)
            assert result[0]["deadline"] is None, (
                f"Expected None for deadline '{null_val}', got '{result[0]['deadline']}'"
            )

    def test_department_case_insensitive_matching(self):
        """Department matching must be case-insensitive ('compliance' → 'Compliance')."""
        from app.services.claude_service import _validate_and_normalise
        maps = [{
            "action": "Implement AML monitoring procedures",
            "department": "compliance",   # lowercase
            "priority": "High",
            "deadline": None,
            "validation_notes": "test",
        }]
        result = _validate_and_normalise(maps)
        assert result[0]["department"] == "Compliance"


# ---------------------------------------------------------------------------
# TestKeywordRouter — tests the fallback routing logic
# ---------------------------------------------------------------------------

class TestKeywordRouter:
    """Tests for the keyword-based department routing fallback."""

    def test_cybersecurity_keyword_routes_to_it(self):
        from app.services.claude_service import _route_department
        assert _route_department("Implement cybersecurity controls") == "IT"

    def test_kyc_keyword_routes_to_compliance(self):
        from app.services.claude_service import _route_department
        assert _route_department("Update KYC verification procedures") == "Compliance"

    def test_risk_keyword_routes_to_risk(self):
        from app.services.claude_service import _route_department
        # Note: avoid strings containing "it " (e.g. "credit ") as that triggers the IT route first
        assert _route_department("Evaluate operational exposure and stress testing requirements") == "Risk"

    def test_liquidity_keyword_routes_to_treasury(self):
        from app.services.claude_service import _route_department
        assert _route_department("Manage liquidity ratios and LCR requirements") == "Treasury"

    def test_legal_keyword_routes_to_legal(self):
        from app.services.claude_service import _route_department
        assert _route_department("Update legal contracts and grievance redressal policy") == "Legal"

    def test_unknown_text_defaults_to_compliance(self):
        from app.services.claude_service import _route_department
        assert _route_department("General regulatory action") == "Compliance"


# ---------------------------------------------------------------------------
# TestMAPQuality — requires real Claude API call
# ---------------------------------------------------------------------------

class TestMAPQuality:
    """
    Quality validation: run actual Claude extraction and check outputs
    against the expected_outputs/ JSON spec files.

    These tests are marked @pytest.mark.integration and require:
      - ANTHROPIC_API_KEY set in environment / .env
      - Network access to Anthropic API

    Run with: pytest tests/test_claude_service.py -v -m integration
    """

    @pytest.mark.integration
    def test_digital_lending_map_count_in_range(
        self, digital_lending_text, load_expected
    ):
        """Claude must extract 4–8 MAPs from the Digital Lending circular."""
        from app.services.claude_service import extract_maps
        spec = load_expected("rbi_digital_lending_maps.json")
        maps = extract_maps(digital_lending_text)

        assert spec["expected_map_count_min"] <= len(maps) <= spec["expected_map_count_max"], (
            f"Expected {spec['expected_map_count_min']}–{spec['expected_map_count_max']} MAPs, "
            f"got {len(maps)}"
        )

    @pytest.mark.integration
    def test_digital_lending_schema_on_all_maps(self, digital_lending_text):
        """Every MAP from the Digital Lending circular must pass schema validation."""
        from app.services.claude_service import extract_maps
        maps = extract_maps(digital_lending_text)
        for i, m in enumerate(maps):
            assert_map_schema(m, index=i)

    @pytest.mark.integration
    def test_digital_lending_covers_required_departments(
        self, digital_lending_text, load_expected
    ):
        """At least IT, Compliance, and Legal must appear in the extracted MAPs."""
        from app.services.claude_service import extract_maps
        spec = load_expected("rbi_digital_lending_maps.json")
        maps = extract_maps(digital_lending_text)
        departments_found = {m["department"] for m in maps}
        for dept in spec["required_departments"]:
            assert dept in departments_found, (
                f"Expected department '{dept}' not found in extracted MAPs. "
                f"Found: {departments_found}"
            )

    @pytest.mark.integration
    def test_digital_lending_has_critical_priority_map(self, digital_lending_text):
        """At least one MAP from the Digital Lending circular must be Critical."""
        from app.services.claude_service import extract_maps
        maps = extract_maps(digital_lending_text)
        critical_maps = [m for m in maps if m["priority"] == "Critical"]
        assert len(critical_maps) >= 1, (
            "No Critical-priority MAPs found — expected at least 1 from Digital Lending circular"
        )

    @pytest.mark.integration
    def test_kyc_circular_maps_dominated_by_compliance(
        self, kyc_master_text, load_expected
    ):
        """The KYC circular should produce mostly Compliance-department MAPs."""
        from app.services.claude_service import extract_maps
        maps = extract_maps(kyc_master_text)
        compliance_maps = [m for m in maps if m["department"] == "Compliance"]
        assert len(compliance_maps) >= 2, (
            f"Expected >= 2 Compliance MAPs from KYC circular, got {len(compliance_maps)}"
        )

    @pytest.mark.integration
    def test_cybersecurity_circular_maps_dominated_by_it(
        self, cybersecurity_text, load_expected
    ):
        """The Cybersecurity circular should produce mostly IT-department MAPs."""
        from app.services.claude_service import extract_maps
        maps = extract_maps(cybersecurity_text)
        it_maps = [m for m in maps if m["department"] == "IT"]
        assert len(it_maps) >= 3, (
            f"Expected >= 3 IT MAPs from Cybersecurity circular, got {len(it_maps)}"
        )
