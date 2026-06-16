"""
PRAGMA — Regulatory Feed Ingestion Service

Owner: Anuja (Data & Integration Lead)
Branch: feature/data-pipeline
Milestone: M4 (demo-enhancing, non-blocking)

Fetches and parses RSS/Atom feeds from RBI, SEBI, and MCA.
Converts feed entries into CircularPreview objects for display
in the frontend's "Feed Monitor" panel (future feature).

This service is NOT called during the hackathon demo flow.
The demo uses manually pasted circular text.
This is included for:
  - Presentation slides showing the full vision
  - Future production integration
  - Demonstrating proactive regulatory monitoring capability

Usage:
    from app.services.feed_service import fetch_all_feeds, CircularPreview

    previews = fetch_all_feeds()
    for p in previews:
        print(p.title, p.source, p.published)
"""

import logging
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

import feedparser
import requests
from requests.exceptions import RequestException, Timeout

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Feed URLs — RBI, SEBI, MCA RSS endpoints
# ---------------------------------------------------------------------------

FEED_URLS: dict[str, str] = {
    "RBI": "https://www.rbi.org.in/scripts/rss.aspx",
    "SEBI": "https://www.sebi.gov.in/sebiweb/home/HomeAction.do?doListing=yes&sid=6&ssid=29&smid=0",
    "MCA": "https://www.mca.gov.in/mca/frontend/en/rss-feeds",
}

# Timeout for all HTTP requests (seconds)
REQUEST_TIMEOUT = 10

# Maximum number of circulars to return per feed source
MAX_ENTRIES_PER_SOURCE = 20

# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------


@dataclass
class CircularPreview:
    """
    Lightweight representation of a regulatory circular from an RSS feed.
    Used to display pending circulars in the PRAGMA feed monitor.
    """
    title: str
    source: str                        # 'RBI' | 'SEBI' | 'MCA'
    url: str
    published: Optional[str] = None    # ISO datetime string, e.g. '2024-01-15T10:30:00'
    summary: str = ""                  # Brief description from the feed entry
    tags: list[str] = field(default_factory=list)  # Feed category tags if available

    def to_dict(self) -> dict:
        """Serialise to dict for API responses."""
        return {
            "title": self.title,
            "source": self.source,
            "url": self.url,
            "published": self.published,
            "summary": self.summary,
            "tags": self.tags,
        }


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _parse_published(entry) -> Optional[str]:
    """
    Extract and normalise the published date from a feed entry.
    Returns an ISO format datetime string, or None if unparseable.
    """
    # feedparser populates published_parsed as a time.struct_time
    if hasattr(entry, "published_parsed") and entry.published_parsed:
        try:
            dt = datetime(*entry.published_parsed[:6])
            return dt.isoformat()
        except (TypeError, ValueError):
            pass

    # Fallback: try the raw published string
    if hasattr(entry, "published") and entry.published:
        return str(entry.published)

    return None


def _entry_to_preview(entry, source: str) -> CircularPreview:
    """Convert a single feedparser entry to a CircularPreview."""
    title = getattr(entry, "title", "Untitled Circular").strip()
    url = getattr(entry, "link", "").strip()
    summary = getattr(entry, "summary", "").strip()

    # Some feeds use 'description' instead of 'summary'
    if not summary and hasattr(entry, "description"):
        summary = entry.description.strip()

    # Strip HTML tags from summary (basic approach — no extra dependency)
    if "<" in summary and ">" in summary:
        import re
        summary = re.sub(r"<[^>]+>", " ", summary).strip()
        summary = " ".join(summary.split())  # normalise whitespace

    # Extract tags
    tags = []
    if hasattr(entry, "tags"):
        tags = [t.get("term", "") for t in entry.tags if t.get("term")]

    return CircularPreview(
        title=title,
        source=source,
        url=url,
        published=_parse_published(entry),
        summary=summary[:500],   # cap at 500 chars to avoid huge payloads
        tags=tags,
    )


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def fetch_feed(source: str) -> list[CircularPreview]:
    """
    Fetch and parse the RSS feed for a single regulatory source.

    Args:
        source: One of 'RBI', 'SEBI', 'MCA' (case-insensitive)

    Returns:
        List of CircularPreview objects, newest first.
        Returns empty list on any network or parsing error (does not raise).

    Raises:
        ValueError: If source is not one of the supported regulators.
    """
    source_upper = source.upper()
    if source_upper not in FEED_URLS:
        raise ValueError(
            f"Unknown feed source: '{source}'. "
            f"Supported sources: {list(FEED_URLS.keys())}"
        )

    url = FEED_URLS[source_upper]
    logger.info("Fetching %s regulatory feed from %s", source_upper, url)

    try:
        response = requests.get(url, timeout=REQUEST_TIMEOUT, headers={
            "User-Agent": "PRAGMA-Compliance-Monitor/1.0"
        })
        response.raise_for_status()
        feed_text = response.text
    except Timeout:
        logger.warning("Timeout fetching %s feed from %s", source_upper, url)
        return []
    except RequestException as e:
        logger.warning("Network error fetching %s feed: %s", source_upper, e)
        return []

    # Parse with feedparser
    feed = feedparser.parse(feed_text)

    if feed.bozo and not feed.entries:
        logger.warning(
            "feedparser reports malformed feed for %s (bozo_exception: %s)",
            source_upper,
            feed.bozo_exception,
        )
        return []

    previews = []
    for entry in feed.entries[:MAX_ENTRIES_PER_SOURCE]:
        try:
            preview = _entry_to_preview(entry, source_upper)
            if preview.title and preview.url:
                previews.append(preview)
        except Exception as e:
            logger.warning("Failed to parse feed entry from %s: %s", source_upper, e)
            continue

    logger.info("Fetched %d circulars from %s feed", len(previews), source_upper)
    return previews


def fetch_all_feeds() -> list[CircularPreview]:
    """
    Fetch circulars from all regulatory sources (RBI, SEBI, MCA).

    Returns a combined, deduplicated list sorted newest-first.
    Individual source failures do not affect other sources.
    """
    all_previews = []

    for source in FEED_URLS:
        try:
            previews = fetch_feed(source)
            all_previews.extend(previews)
        except ValueError as e:
            logger.error("Config error for source %s: %s", source, e)

    # Sort by published date descending (None dates go to end)
    all_previews.sort(
        key=lambda p: p.published or "",
        reverse=True,
    )

    # Deduplicate by URL
    seen_urls: set[str] = set()
    deduped = []
    for p in all_previews:
        if p.url and p.url not in seen_urls:
            seen_urls.add(p.url)
            deduped.append(p)

    return deduped


def fetch_circular_text(url: str) -> str:
    """
    Attempt to fetch plain text content from a circular URL.

    This is a best-effort function — many RBI/SEBI circulars are PDFs
    and cannot be directly extracted without a PDF parser.
    Returns empty string if the URL is inaccessible or returns binary content.

    Args:
        url: The URL of the circular to fetch.

    Returns:
        Plain text content, or empty string on failure.
    """
    if not url:
        return ""

    try:
        response = requests.get(url, timeout=REQUEST_TIMEOUT, headers={
            "User-Agent": "PRAGMA-Compliance-Monitor/1.0"
        })
        response.raise_for_status()

        content_type = response.headers.get("Content-Type", "")

        # Skip PDF and binary content
        if "pdf" in content_type.lower() or "octet-stream" in content_type.lower():
            logger.info("Skipping binary content from %s (content-type: %s)", url, content_type)
            return ""

        return response.text

    except RequestException as e:
        logger.warning("Failed to fetch circular text from %s: %s", url, e)
        return ""


def get_supported_sources() -> list[str]:
    """Return list of supported regulatory feed source names."""
    return list(FEED_URLS.keys())
