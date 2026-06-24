"""
PRAGMA — Ollama Local Inference Service
Primary AI extraction engine (offline, local).

Calls Ollama's HTTP API on localhost:11434.
Auto-discovers the best available model from a priority list:
  qwen3:8b > llama3.1:8b > phi3.5 (and others)

Model pull commands:
  ollama pull qwen3:8b        # Best quality (4.7 GB)
  ollama pull llama3.1:8b     # Excellent alternative (4.7 GB)
  ollama pull phi3.5          # Compact fallback (2.2 GB)
"""

import json
import logging
from typing import Optional

import httpx

from app.config import settings, OLLAMA_MODEL_PRIORITY

logger = logging.getLogger(__name__)

# ── Active model (auto-resolved at startup) ───────────────────────────────────
_active_model: Optional[str] = None

# ── Shared prompts ────────────────────────────────────────────────────────────

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
- High: required within 30-90 days, significant compliance risk if missed
- Medium: required within 90-180 days, moderate compliance risk
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
- Deadlines must be real dates from the circular — do not invent them.
- Return ONLY the JSON array. No prose, no markdown, no code fences."""

RETRY_SUFFIX = (
    "\n\nIMPORTANT: Your previous response was not valid JSON. "
    "Return ONLY the raw JSON array. No prose, no markdown, no code fences. "
    "Start your response with [ and end with ]."
)


# ── Model auto-discovery ──────────────────────────────────────────────────────

def _get_pulled_models() -> list[str]:
    """Return list of model names currently pulled in Ollama."""
    try:
        r = httpx.get(f"{settings.OLLAMA_URL}/api/tags", timeout=3.0)
        if r.status_code != 200:
            return []
        return [m.get("name", "").lower() for m in r.json().get("models", [])]
    except Exception:
        return []


def _resolve_active_model(pulled: list[str]) -> Optional[str]:
    """
    Find the best available model from the priority list.
    Returns the model name as Ollama knows it (with tag), or None.
    """
    # First try the configured preferred model
    preferred_base = settings.OLLAMA_MODEL.split(":")[0].lower()
    for name in pulled:
        if preferred_base in name:
            return name

    # Walk the priority list
    for candidate in OLLAMA_MODEL_PRIORITY:
        base = candidate.split(":")[0].lower()
        for name in pulled:
            if base in name:
                return name

    return None


def is_available() -> bool:
    """
    Return True if Ollama is reachable and any compatible model is pulled.
    Side effect: caches the resolved active model in _active_model.
    """
    global _active_model
    pulled = _get_pulled_models()
    if not pulled:
        _active_model = None
        return False

    model = _resolve_active_model(pulled)
    if model:
        _active_model = model
        logger.info("Ollama ready — active model: %s (from %d pulled models)", model, len(pulled))
        return True

    _active_model = None
    logger.warning("Ollama running but no compatible model found. Pull one: ollama pull llama3.1:8b")
    return False


def get_active_model() -> Optional[str]:
    """Return the currently active model name (resolved at last availability check)."""
    return _active_model or settings.OLLAMA_MODEL


# ── Inference call ────────────────────────────────────────────────────────────

def _call_ollama(circular_text: str, strict: bool = False) -> str:
    model = get_active_model()
    content = USER_PROMPT_TEMPLATE.format(circular_text=circular_text[:10000])
    if strict:
        content += RETRY_SUFFIX

    payload = {
        "model":  model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": content},
        ],
        "stream": False,
        "options": {
            "temperature": 0.05,
            "num_predict": 4096,
            "top_p": 0.9,
        },
    }

    with httpx.Client(timeout=settings.OLLAMA_TIMEOUT) as client:
        r = client.post(f"{settings.OLLAMA_URL}/api/chat", json=payload)
        r.raise_for_status()

    return r.json()["message"]["content"].strip()


def _parse_json(raw: str) -> list[dict]:
    text = raw.strip()

    if text.startswith("```"):
        lines = text.split("\n")
        inner = [ln for ln in lines[1:] if ln.strip() != "```"]
        text = "\n".join(inner).strip()

    # qwen3 sometimes wraps in <think>...</think> tags — strip them
    if "<think>" in text:
        import re
        text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()

    start = text.find("[")
    end   = text.rfind("]")
    if start != -1 and end != -1 and end > start:
        text = text[start: end + 1]

    return json.loads(text)


# ── Public API ────────────────────────────────────────────────────────────────

def extract_maps(circular_text: str) -> list[dict]:
    """
    Extract MAPs via local Ollama inference.
    Auto-uses the best available model.
    Raises RuntimeError if Ollama is unreachable.
    """
    from app.services.rule_extractor import _validate_and_normalise

    if not circular_text or not circular_text.strip():
        raise ValueError("circular_text cannot be empty")

    raw = _call_ollama(circular_text)

    try:
        maps = _parse_json(raw)
    except (json.JSONDecodeError, ValueError):
        logger.warning("Ollama returned malformed JSON — retrying with strict prompt")
        try:
            raw = _call_ollama(circular_text, strict=True)
            maps = _parse_json(raw)
        except (json.JSONDecodeError, ValueError) as exc:
            raise ValueError(f"Ollama returned unparseable JSON after retry: {raw[:300]}") from exc

    if not isinstance(maps, list) or not maps:
        raise ValueError("Ollama returned empty or non-list MAP response")

    validated = _validate_and_normalise(maps)
    logger.info("Ollama extracted %d MAPs using model %s", len(validated), get_active_model())
    return validated
