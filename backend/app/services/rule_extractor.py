"""
PRAGMA — Rule-Based MAP Extractor
Automatic fallback when Ollama is unavailable.

Uses regex + keyword heuristics to extract Measurable Action Points from
regulatory circular text. Produces 3-7 MAPs from any RBI/SEBI/MCA circular.

No external dependencies. Zero network calls. Always succeeds.
"""

import re
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

# ── Valid values (mirrors claude_service constants) ───────────────────────────
VALID_DEPARTMENTS = {"IT", "Compliance", "Risk", "Treasury", "Legal"}
VALID_PRIORITIES  = {"Critical", "High", "Medium", "Low"}

# ── Department keyword routing ────────────────────────────────────────────────
_DEPT_KEYWORDS: dict[str, list[str]] = {
    "IT":         ["cyber", "security", "system", "software", "platform",
                   "data infra", "it ", "digital platform", "technolog",
                   "implement system", "network", "firewall", "encryption",
                   "application", "database", "api", "interface", "deploy"],
    "Compliance": ["kyc", "aml", "cft", "report", "audit", "disclosure",
                   "document", "monitor", "filing", "regulatory submission",
                   "know your customer", "anti-money", "policy", "procedure",
                   "circular", "guideline", "directive", "notification"],
    "Risk":       ["risk", "credit", "fraud", "stress", "operational",
                   "exposure", "npa", "provision", "assessment", "control",
                   "mitigation", "contingency", "concentration"],
    "Treasury":   ["capital", "liquidity", "treasury", "funding", "interest rate",
                   "investment", "nsfr", "lcr", "reserve", "rrb", "slr", "crr",
                   "yield", "bond", "msme", "priority sector"],
    "Legal":      ["legal", "contract", "policy update", "grievance", "redress",
                   "obligation", "penalty", "penal", "prosecution", "court",
                   "litigation", "dispute", "adjudication", "arbitration"],
}

# ── Obligation trigger patterns ───────────────────────────────────────────────
_MANDATE_PATTERNS: list[str] = [
    r"\bshall\s+(?:ensure|implement|maintain|establish|provide|conduct|submit|update|review|designate|appoint|monitor|comply|report|create|develop|adopt|introduce|integrate|migrate|upgrade|deploy|test|validate|certify)\b",
    r"\bmust\s+(?:be|ensure|implement|submit|provide|conduct|maintain|comply|report|establish|designate)\b",
    r"\bare\s+required\s+to\b",
    r"\bregulated\s+entities?\s+shall\b",
    r"\bbanks?\s+shall\b",
    r"\bnbfc[s]?\s+shall\b",
    r"\ball\s+(?:banks?|entities?|institutions?)\s+shall\b",
    r"\bshall\s+be\s+(?:mandatory|required|obligatory|compulsory)\b",
    r"\bmandatory\s+(?:requirement|compliance|implementation)\b",
    r"\bimmediate(?:ly)?\s+(?:implement|comply|report|notify|take)\b",
    r"\bno\s+(?:bank|entity|institution)\s+shall\b",
    r"\bprohibited?\b.{0,60}\bshall\b",
]

# ── Deadline extraction ───────────────────────────────────────────────────────
_DEADLINE_PATTERNS: list[tuple[str, str]] = [
    (r"within\s+(\d+)\s+days?",                                       "days"),
    (r"within\s+(\d+)\s+months?",                                      "months"),
    (r"within\s+(\d+)\s+weeks?",                                       "weeks"),
    (r"(?:by|before|not\s+later\s+than)\s+(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})", "dmy"),
    (r"(?:by|before)\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})", "month_year"),
    (r"(?:31st?|30th?|15th?|1st?)\s+(March|June|September|December|January|April|July|October)\s+(\d{4})", "day_month_year"),
    (r"(?:with\s+)?immediate(?:ly)?(?:\s+effect)?",                   "immediate"),
    (r"forthwith",                                                      "immediate"),
    (r"at\s+the\s+earliest",                                           "immediate"),
    (r"end\s+of\s+(?:the\s+)?(?:current\s+)?(?:financial\s+)?year",   "eoy"),
    (r"end\s+of\s+(?:this\s+)?quarter",                               "eoq"),
]

_MONTH_TO_NUM: dict[str, str] = {
    "January": "01", "February": "02", "March": "03",    "April":    "04",
    "May":     "05", "June":     "06", "July":  "07",    "August":   "08",
    "September":"09","October":  "10", "November":"11",  "December": "12",
}

# ── Priority signals ──────────────────────────────────────────────────────────
_PRIORITY_SIGNALS: dict[str, list[str]] = {
    "Critical": ["immediately", "immediate effect", "penalty", "penal action",
                 "prohibited", "strictly prohibited", "critical", "urgent",
                 "without delay", "within 30 days", "within 15 days",
                 "within 7 days", "highest priority", "forthwith"],
    "High":     ["within 60 days", "within 90 days", "mandatory",
                 "shall ensure", "must be", "obligatory", "compulsory",
                 "required to", "no later than", "not later than"],
    "Medium":   ["within 6 months", "within 180 days", "within 120 days",
                 "should ensure", "recommended", "advised"],
    "Low":      ["best practice", "encouraged", "may consider",
                 "guidance", "advisory", "voluntary", "suggested"],
}


# ── Internal helpers ──────────────────────────────────────────────────────────

def _route_department(action_text: str) -> str:
    """Keyword-based department routing. Matches the most-signalled department."""
    text = action_text.lower()
    scores: dict[str, int] = {d: 0 for d in VALID_DEPARTMENTS}
    for dept, keywords in _DEPT_KEYWORDS.items():
        for kw in keywords:
            if kw in text:
                scores[dept] += 1
    best = max(scores, key=lambda d: scores[d])
    return best if scores[best] > 0 else "Compliance"


def _score_priority(sentence: str) -> str:
    text = sentence.lower()
    for priority in ["Critical", "High", "Medium", "Low"]:
        if any(sig in text for sig in _PRIORITY_SIGNALS[priority]):
            return priority
    return "Medium"


def _extract_deadline(sentence: str) -> str | None:
    now = datetime.now()
    text = sentence.lower()

    for pattern, kind in _DEADLINE_PATTERNS:
        m = re.search(pattern, sentence, re.IGNORECASE)
        if not m:
            continue

        if kind == "days":
            return (now + timedelta(days=int(m.group(1)))).strftime("%Y-%m-%d")
        if kind == "weeks":
            return (now + timedelta(weeks=int(m.group(1)))).strftime("%Y-%m-%d")
        if kind == "months":
            months = int(m.group(1))
            year  = now.year + (now.month - 1 + months) // 12
            month = (now.month - 1 + months) % 12 + 1
            return f"{year:04d}-{month:02d}-{now.day:02d}"
        if kind == "immediate":
            return (now + timedelta(days=30)).strftime("%Y-%m-%d")
        if kind == "eoy":
            # End of financial year = March 31 of next year
            fy_year = now.year if now.month < 4 else now.year + 1
            return f"{fy_year:04d}-03-31"
        if kind == "eoq":
            # Next quarter end
            q_ends = [3, 6, 9, 12]
            nxt = next((q for q in q_ends if q > now.month), 3)
            yr  = now.year + (1 if nxt == 3 and now.month > 3 else 0)
            return f"{yr:04d}-{nxt:02d}-{31 if nxt in [3, 12] else 30:02d}"
        if kind == "month_year":
            month_num = _MONTH_TO_NUM.get(m.group(1), "12")
            return f"{m.group(2)}-{month_num}-01"
        if kind == "day_month_year":
            month_num = _MONTH_TO_NUM.get(m.group(1), "12")
            return f"{m.group(2)}-{month_num}-01"
        if kind == "dmy":
            # Try D/M/YYYY or M/D/YYYY (regulatory circulars usually use D/M/YYYY)
            try:
                d, mo, y = m.group(1), m.group(2), m.group(3)
                if len(y) == 2:
                    y = "20" + y
                return f"{y}-{int(mo):02d}-{int(d):02d}"
            except Exception:
                return None

    return None


def _find_source_clause(sentence: str, preceding_text: str) -> str:
    """Try to find the section/clause reference nearest to the sentence."""
    window = preceding_text[-300:] + sentence[:100]
    # Most specific match first
    for pat in [
        r"(?:Section|Clause|Para(?:graph)?|Rule|Article|Regulation)\s*[\d.]+(?:\(\w+\))*",
        r"CHAPTER\s+[IVX\d]+",
        r"Para\s*[\d.]+",
        r"Annex(?:ure)?\s+[A-Z\d]+",
    ]:
        hits = re.findall(pat, window, re.IGNORECASE)
        if hits:
            return hits[-1]
    return "Regulatory circular"


def _clean_action(sentence: str) -> str:
    """Strip boilerplate preamble and return a clean imperative action phrase."""
    text = sentence.strip()

    # Drop a trailing clause/list marker the sentence splitter pulled in from the
    # start of the *next* clause, e.g. "...every quarter.\n2." -> "...every quarter."
    # Requires the number to be on its own line so real in-sentence numbers
    # (e.g. "within 90 days") are never touched.
    text = re.sub(r"\s*\n\s*\d{1,3}[.)]?\s*$", "", text).strip()

    # Strip leading clause/section/para references: "Para 4.2: ...", "Section 5: ..."
    text = re.sub(
        r"^(?:Section|Clause|Para(?:graph)?|Rule|Article|Regulation|Annex(?:ure)?)\s*[\d.]+(?:\(\w+\))*\s*[:\-–—]\s*",
        "", text, flags=re.IGNORECASE
    ).strip()

    preambles = [
        r"^Regulated\s+entities?\s+shall\s+",
        r"^All\s+(?:banks?|entities?|institutions?|regulated\s+entities?)\s+shall\s+",
        r"^Banks?\s+shall\s+",
        r"^NBFCs?\s+shall\s+",
        r"^Every\s+(?:bank|entity|institution)\s+shall\s+",
        r"^It\s+is\s+(?:mandatory|required)\s+(?:that|for)\s+",
        r"^(?:Each|Every)\s+regulated\s+entity\s+shall\s+",
    ]
    for pat in preambles:
        text = re.sub(pat, "", text, flags=re.IGNORECASE).strip()
    # Capitalize first letter
    if text:
        text = text[0].upper() + text[1:]
    return text.rstrip(".")


def _sentences(text: str) -> list[str]:
    """Split text into sentences, respecting abbreviations."""
    # Split on sentence-ending punctuation followed by whitespace and capital letter
    parts = re.split(r"(?<=[.!?])\s+(?=[A-Z\(\[])", text)
    # Also split on numbered list items: "1. " or "(a) "
    result = []
    for part in parts:
        sub = re.split(r"\n(?=\d+\.\s+[A-Z]|\([a-z]\)\s)", part)
        result.extend(sub)
    return [s.strip() for s in result if s.strip()]


# ── Public API ────────────────────────────────────────────────────────────────

def _validate_and_normalise(maps: list[dict]) -> list[dict]:
    """Normalise and validate a list of MAP dicts. Same contract as claude_service."""
    dept_lookup   = {d.upper(): d for d in VALID_DEPARTMENTS}
    result = []
    for i, m in enumerate(maps):
        if not m.get("action") or len(m["action"].strip()) < 20:
            continue

        raw_dept = (m.get("department") or "").strip()
        dept = dept_lookup.get(raw_dept.upper(), _route_department(m["action"]))

        priority = (m.get("priority") or "Medium").strip().title()
        if priority not in VALID_PRIORITIES:
            priority = "Medium"

        deadline = m.get("deadline")
        if deadline and str(deadline).strip().lower() in ("null", "none", "n/a", "", "–"):
            deadline = None

        result.append({
            "action":           m["action"].strip(),
            "department":       dept,
            "priority":         priority,
            "deadline":         deadline,
            "validation_notes": (m.get("validation_notes") or "").strip(),
            "source_clause":    m.get("source_clause"),
            "confidence_score": m.get("confidence_score"),
        })
    return result


def extract_maps(circular_text: str) -> list[dict]:
    """
    Rule-based MAP extraction. No network calls, never fails.

    Returns a list of MAP dicts with the same schema as claude_service.extract_maps().
    """
    if not circular_text or not circular_text.strip():
        raise ValueError("circular_text cannot be empty")

    sents = _sentences(circular_text)
    candidates: list[tuple[str, int]] = []  # (sentence, char_offset)

    # Walk text tracking approximate character offset for clause lookups
    offset = 0
    for sent in sents:
        pos = circular_text.find(sent[:40], offset)
        char_pos = pos if pos != -1 else offset
        offset = char_pos + len(sent)

        if len(sent) < 35 or len(sent) > 600:
            continue

        for pat in _MANDATE_PATTERNS:
            if re.search(pat, sent, re.IGNORECASE):
                candidates.append((sent, char_pos))
                break

    # Deduplicate — remove sentences whose first 60 chars are already represented
    unique: list[tuple[str, int]] = []
    seen_keys: set[str] = set()
    for sent, pos in candidates:
        key = re.sub(r"\s+", " ", sent[:60].lower().strip())
        if key not in seen_keys:
            seen_keys.add(key)
            unique.append((sent, pos))

    # Build MAP dicts (cap at 7)
    maps: list[dict] = []
    for sent, pos in unique[:7]:
        preceding = circular_text[max(0, pos - 400): pos]
        action    = _clean_action(sent)
        if not action or len(action) < 20:
            continue

        dept     = _route_department(sent)
        priority = _score_priority(sent)
        deadline = _extract_deadline(sent)
        clause   = _find_source_clause(sent, preceding)

        # Confidence scoring: deterministic signals → [0.55, 0.95]
        score = 0.60
        if clause != "Regulatory circular":   score += 0.10  # specific clause found
        if deadline is not None:              score += 0.10  # explicit timeline
        if len(action) > 60:                  score += 0.05  # specific action phrase
        # Department keyword strength
        text_l = sent.lower()
        dept_hits = sum(1 for kw in _DEPT_KEYWORDS.get(dept, []) if kw in text_l)
        if dept_hits >= 2:                    score += 0.05
        if priority == "Critical":            score += 0.05

        maps.append({
            "action":           action,
            "department":       dept,
            "priority":         priority,
            "deadline":         deadline,
            "source_clause":    clause,
            "confidence_score": round(min(score, 0.95), 2),
            "validation_notes": f"{clause} — {dept} obligation identified via PRAGMA Intelligence Engine; priority {priority} based on mandate language and timeline signals.",
        })

    # Absolute fallback — always return at least one MAP
    if not maps:
        logger.warning("Rule extractor found no obligation sentences — returning generic fallback MAP")
        maps.append({
            "action":           "Review regulatory circular and identify all compliance obligations requiring immediate action",
            "department":       "Compliance",
            "priority":         "High",
            "deadline":         None,
            "source_clause":    "Full circular",
            "confidence_score": 0.40,
            "validation_notes": "Full circular — manual review required. No specific obligation clauses auto-detected.",
        })

    validated = _validate_and_normalise(maps)
    logger.info("Rule extractor produced %d MAPs", len(validated))
    return validated
