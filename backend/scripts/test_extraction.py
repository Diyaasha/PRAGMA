"""
Standalone Claude extraction test — run this BEFORE any FastAPI work.

Usage (from backend/ directory, with venv active):
    python scripts/test_extraction.py

Requires a valid .env file with ANTHROPIC_API_KEY set.
No database needed.
"""

import sys
import json
from pathlib import Path

# Allow importing from app/ without installing the package
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv  # pip install python-dotenv if not present
load_dotenv(Path(__file__).parent.parent / ".env")

from app.services.claude_service import extract_maps
from app.utils.demo_fallback import DEMO_CIRCULAR

SEPARATOR = "-" * 60


def test_circular(name: str, text: str) -> bool:
    print(f"\n{SEPARATOR}")
    print(f"Testing: {name}")
    print(SEPARATOR)

    try:
        maps = extract_maps(text)
        print(f"  Extracted {len(maps)} MAPs\n")

        for i, m in enumerate(maps, 1):
            print(f"  [{i}] {m['department']} | {m['priority']}")
            print(f"       Action : {m['action'][:80]}...")
            print(f"       Deadline: {m['deadline']}")
            print()

        # Basic quality checks
        assert len(maps) >= 3, f"Expected >= 3 MAPs, got {len(maps)}"
        assert all(m["department"] in {"IT", "Compliance", "Risk", "Treasury", "Legal"} for m in maps)
        assert all(m["priority"] in {"Critical", "High", "Medium", "Low"} for m in maps)
        assert all(m["action"] for m in maps)

        print(f"  All checks passed.")
        return True

    except Exception as e:
        print(f"  FAILED: {e}")
        return False


if __name__ == "__main__":
    results = []

    # Test 1: demo circular (the one we use in the live demo)
    results.append(
        test_circular("RBI Digital Lending (demo circular)", DEMO_CIRCULAR["content"])
    )

    # Test 2: minimal circular — tests graceful handling of sparse input
    minimal = (
        "RBI Circular RBI/2024-25/55\n"
        "All banks are required to update their cybersecurity frameworks to align "
        "with the RBI Cybersecurity Framework 2024. Banks must conduct a gap "
        "assessment within 60 days and submit a Board-approved remediation plan "
        "to RBI within 90 days. Banks must also ensure that all critical IT "
        "systems are covered under a Business Continuity Plan tested annually."
    )
    results.append(test_circular("RBI Cybersecurity (minimal circular)", minimal))

    print(f"\n{SEPARATOR}")
    passed = sum(results)
    print(f"Results: {passed}/{len(results)} circulars passed")

    if passed < len(results):
        print("One or more tests failed — check prompt or API key")
        sys.exit(1)
    else:
        print("All tests passed — claude_service.py is ready for integration")
