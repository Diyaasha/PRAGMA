"""
PRAGMA — Claude MAP Extraction Service
Owner: Anoushka (AI Lead)
"""

import json
import logging
import anthropic
from app.config import settings

logger = logging.getLogger(__name__)

client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

VALID_DEPARTMENTS = {"IT", "Compliance", "Risk", "Treasury", "Legal"}
VALID_PRIORITIES = {"Critical", "High", "Medium", "Low"}

# ---------------------------------------------------------------------------
# Prompt
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """You are a regulatory compliance analyst for an Indian bank. \
Your job is to read regulatory circulars from RBI, SEBI, or MCA and extract \
Measurable Action Points (MAPs).

A MAP is a specific, concrete action the bank must take to comply with the regulation. \
Not a general observation — a precise, actionable task with a clear owner and deadline.

Department routing guide:
- IT: technology systems, cybersecurity, digital platforms, software upgrades, \
data infrastructure, IT security controls, system implementations
- Compliance: KYC procedures, regulatory reporting, documentation, audits, \
disclosures, AML/CFT monitoring, regulatory filings
- Risk: risk assessment, credit risk, market risk, operational risk, stress testing, \
fraud detection, exposure limits
- Treasury: capital adequacy, liquidity management, investments, interest rates, \
funding, NSFR/LCR ratios, reserve requirements
- Legal: legal documentation, contracts, regulatory interpretation, policy updates, \
grievance redressal mechanisms, legal obligations

Priority guide:
- Critical: immediate regulatory mandate, high penalty risk, or core customer impact
- High: required within 30–90 days, significant compliance risk if missed
- Medium: required within 90–180 days, moderate compliance risk
- Low: best practice, longer timeline, or advisory guidance

CRITICAL OUTPUT RULE: Respond with ONLY a valid JSON array. No introduction, \
no explanation, no markdown formatting, no code blocks. \
The first character of your response must be [ and the last must be ]."""

USER_PROMPT_TEMPLATE = """Extract all Measurable Action Points from the following \
regulatory circular:

---
{circular_text}
---

Return a JSON array. Each element must have exactly these fields:
{{
  "action": "specific actionable task the bank must perform (precise, not generic)",
  "department": "one of: IT, Compliance, Risk, Treasury, Legal",
  "priority": "one of: Critical, High, Medium, Low",
  "deadline": "YYYY-MM-DD if stated or inferrable from the circular, otherwise null",
  "validation_notes": "cite the specific section or clause that mandates this, \
and explain your department and priority reasoning in one sentence"
}}

Rules:
- Extract between 3 and 8 MAPs. Prefer precision over volume.
- Each MAP must be independently actionable by a single department.
- Deadlines must be real dates from the circular — do not invent them."""

RETRY_SUFFIX = (
    "\n\nIMPORTANT: Your previous response was not valid JSON. "
    "Return ONLY the raw JSON array. No prose, no markdown, no code fences. "
    "Start your response with [ and end with ]."
)


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _call_claude(circular_text: str, strict: bool = False) -> str:
    """Make a single Claude API call and return the raw text response."""
    content = USER_PROMPT_TEMPLATE.format(circular_text=circular_text)
    if strict:
        content += RETRY_SUFFIX

    response = client.messages.create(
        model=settings.CLAUDE_MODEL,
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": content}],
    )
    return response.content[0].text.strip()


def _parse_json(raw: str) -> list[dict]:
    """Parse a JSON array from Claude's response, stripping markdown fences if present."""
    text = raw.strip()

    # Strip ```json ... ``` or ``` ... ``` wrappers if Claude adds them
    if text.startswith("```"):
        lines = text.split("\n")
        # Drop first line (```json or ```) and last line (```)
        inner = [l for l in lines[1:] if l.strip() != "```"]
        text = "\n".join(inner).strip()

    return json.loads(text)


def _route_department(action_text: str) -> str:
    """Keyword-based fallback router when Claude returns an unrecognised department name."""
    text = action_text.lower()

    if any(k in text for k in [
        "cyber", "security", "system", "software", "platform",
        "data infra", "it ", "digital platform", "technolog", "implement system",
    ]):
        return "IT"
    if any(k in text for k in [
        "kyc", "aml", "cft", "report", "audit", "disclosure",
        "document", "monitor", "filing", "regulatory submission",
    ]):
        return "Compliance"
    if any(k in text for k in [
        "risk", "credit", "fraud", "stress", "operational", "exposure",
    ]):
        return "Risk"
    if any(k in text for k in [
        "capital", "liquidity", "treasury", "funding", "interest rate",
        "investment", "nsfr", "lcr", "reserve",
    ]):
        return "Treasury"
    if any(k in text for k in [
        "legal", "contract", "policy", "grievance", "redress", "obligation",
    ]):
        return "Legal"

    return "Compliance"  # most regulatory actions default to Compliance


def _validate_and_normalise(maps: list[dict]) -> list[dict]:
    """
    Validate required fields and normalise department/priority to canonical values.
    Raises ValueError if a MAP is missing required fields.
    """
    required = {"action", "department", "priority"}
    result = []

    for i, m in enumerate(maps):
        missing = required - m.keys()
        if missing:
            raise ValueError(f"MAP at index {i} is missing required fields: {missing}")

        # Case-insensitive match against canonical department names
        raw_dept = m["department"].strip()
        dept_lookup = {d.upper(): d for d in VALID_DEPARTMENTS}
        dept = dept_lookup.get(raw_dept.upper())
        if dept is None:
            logger.warning(
                "Unknown department %r in MAP %d — applying keyword routing", raw_dept, i
            )
            dept = _route_department(m["action"])

        priority = m["priority"].strip().title()
        if priority not in VALID_PRIORITIES:
            logger.warning(
                "Unknown priority %r in MAP %d — defaulting to Medium", priority, i
            )
            priority = "Medium"

        deadline = m.get("deadline")
        if deadline is None or str(deadline).strip().lower() in ("null", "none", "n/a", ""):
            deadline = None

        result.append({
            "action": m["action"].strip(),
            "department": dept,
            "priority": priority,
            "deadline": deadline,
            "validation_notes": m.get("validation_notes", "").strip(),
        })

    return result


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def extract_maps(circular_text: str) -> list[dict]:
    """
    Extract Measurable Action Points from a regulatory circular using Claude.

    Returns a list of validated MAP dicts, each with:
        action, department, priority, deadline, validation_notes

    Retries once with a stricter prompt on malformed JSON.

    Raises:
        ValueError  — if circular_text is empty, or JSON is unparseable after retry,
                      or Claude returns zero MAPs
        RuntimeError — if the Claude API call itself fails
    """
    if not circular_text or not circular_text.strip():
        raise ValueError("circular_text cannot be empty")

    # First attempt
    try:
        raw = _call_claude(circular_text)
    except anthropic.APIError as e:
        raise RuntimeError(f"Claude API error on first call: {e}") from e

    try:
        maps = _parse_json(raw)
    except json.JSONDecodeError:
        logger.warning("Malformed JSON on first attempt — retrying with strict prompt")
        try:
            raw = _call_claude(circular_text, strict=True)
            maps = _parse_json(raw)
        except json.JSONDecodeError as e:
            raise ValueError(
                f"Claude returned unparseable JSON after retry. "
                f"First 300 chars: {raw[:300]}"
            ) from e

    if not maps:
        raise ValueError("Claude returned an empty MAP list — circular may be too short or ambiguous")

    return _validate_and_normalise(maps)
