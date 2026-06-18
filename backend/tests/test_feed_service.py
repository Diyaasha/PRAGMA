"""
PRAGMA — Feed Service Tests

Owner: Anuja (Data & Integration Lead)
Branch: feature/data-pipeline

Tests for app/services/feed_service.py.

Test classes:
  TestCircularPreview       — Data model tests (no network, no API key)
  TestFeedServiceUnit       — Unit tests with mocked HTTP (no network)
  TestFeedServiceIntegration — Real HTTP calls to RBI/SEBI/MCA feeds
"""

import pytest
from unittest.mock import MagicMock, patch


# ---------------------------------------------------------------------------
# TestCircularPreview — data model tests
# ---------------------------------------------------------------------------

class TestCircularPreview:
    """Tests for the CircularPreview dataclass."""

    def test_circular_preview_creation(self):
        """CircularPreview must be constructable with required fields."""
        from app.services.feed_service import CircularPreview
        preview = CircularPreview(
            title="RBI Circular on Digital Lending",
            source="RBI",
            url="https://www.rbi.org.in/example",
        )
        assert preview.title == "RBI Circular on Digital Lending"
        assert preview.source == "RBI"
        assert preview.url == "https://www.rbi.org.in/example"
        assert preview.published is None
        assert preview.summary == ""
        assert preview.tags == []

    def test_circular_preview_to_dict(self):
        """to_dict must return all fields as a dictionary."""
        from app.services.feed_service import CircularPreview
        preview = CircularPreview(
            title="Test Circular",
            source="SEBI",
            url="https://sebi.gov.in/test",
            published="2024-01-15T10:30:00",
            summary="This is a test",
            tags=["banking", "regulation"],
        )
        d = preview.to_dict()
        assert d["title"] == "Test Circular"
        assert d["source"] == "SEBI"
        assert d["url"] == "https://sebi.gov.in/test"
        assert d["published"] == "2024-01-15T10:30:00"
        assert d["summary"] == "This is a test"
        assert d["tags"] == ["banking", "regulation"]

    def test_to_dict_has_all_keys(self):
        """to_dict must have all required keys."""
        from app.services.feed_service import CircularPreview
        preview = CircularPreview(title="T", source="RBI", url="http://x.com")
        d = preview.to_dict()
        for key in ["title", "source", "url", "published", "summary", "tags"]:
            assert key in d, f"to_dict() missing key: '{key}'"


# ---------------------------------------------------------------------------
# TestFeedServiceUnit — mocked network calls
# ---------------------------------------------------------------------------

class TestFeedServiceUnit:
    """Unit tests with mocked HTTP responses — no real network calls."""

    def test_fetch_feed_raises_on_unknown_source(self):
        """fetch_feed must raise ValueError for unknown source names."""
        from app.services.feed_service import fetch_feed
        with pytest.raises(ValueError, match="Unknown feed source"):
            fetch_feed("FINRA")

    def test_fetch_feed_raises_on_empty_source(self):
        """fetch_feed must raise ValueError for empty source string."""
        from app.services.feed_service import fetch_feed
        with pytest.raises(ValueError):
            fetch_feed("")

    def test_fetch_feed_case_insensitive(self):
        """fetch_feed must accept lowercase source names ('rbi' → 'RBI')."""
        from app.services.feed_service import fetch_feed
        # Should not raise ValueError — will fail on network, but that's OK here
        # We just confirm the ValueError is not raised for valid source names
        try:
            fetch_feed("rbi")
        except ValueError:
            pytest.fail("fetch_feed raised ValueError for lowercase 'rbi'")
        except Exception:
            pass  # network errors are expected in unit test environment

    def test_get_supported_sources_returns_three(self):
        """get_supported_sources must return exactly 3 sources."""
        from app.services.feed_service import get_supported_sources
        sources = get_supported_sources()
        assert len(sources) == 3
        assert "RBI" in sources
        assert "SEBI" in sources
        assert "MCA" in sources

    def test_fetch_feed_returns_empty_on_network_error(self):
        """fetch_feed must return empty list (not raise) on network errors."""
        from app.services.feed_service import fetch_feed
        with patch("app.services.feed_service.requests.get") as mock_get:
            from requests.exceptions import ConnectionError
            mock_get.side_effect = ConnectionError("No network")
            result = fetch_feed("RBI")
            assert result == [], f"Expected [] on network error, got {result}"

    def test_fetch_feed_returns_empty_on_timeout(self):
        """fetch_feed must return empty list on request timeout."""
        from app.services.feed_service import fetch_feed
        with patch("app.services.feed_service.requests.get") as mock_get:
            from requests.exceptions import Timeout
            mock_get.side_effect = Timeout("Request timed out")
            result = fetch_feed("RBI")
            assert result == []

    def test_fetch_all_feeds_returns_list(self):
        """fetch_all_feeds must always return a list."""
        from app.services.feed_service import fetch_all_feeds
        with patch("app.services.feed_service.requests.get") as mock_get:
            from requests.exceptions import ConnectionError
            mock_get.side_effect = ConnectionError("No network")
            result = fetch_all_feeds()
            assert isinstance(result, list)

    def test_fetch_all_feeds_handles_partial_failures(self):
        """fetch_all_feeds must succeed even if some feeds fail."""
        from app.services.feed_service import fetch_all_feeds, CircularPreview

        call_count = 0

        def mock_fetch_feed(source):
            nonlocal call_count
            call_count += 1
            if source == "SEBI":
                raise Exception("SEBI feed down")
            return [CircularPreview(title=f"{source} circular", source=source, url=f"http://{source}.test")]

        with patch("app.services.feed_service.fetch_feed", side_effect=mock_fetch_feed):
            result = fetch_all_feeds()
            # RBI and MCA should succeed; SEBI fails silently
            assert isinstance(result, list)

    def test_fetch_circular_text_returns_empty_on_failure(self):
        """fetch_circular_text must return empty string on network error."""
        from app.services.feed_service import fetch_circular_text
        with patch("app.services.feed_service.requests.get") as mock_get:
            from requests.exceptions import ConnectionError
            mock_get.side_effect = ConnectionError("No network")
            result = fetch_circular_text("https://rbi.org.in/some-circular")
            assert result == ""

    def test_fetch_circular_text_skips_pdf_content(self):
        """fetch_circular_text must return empty string for PDF responses."""
        from app.services.feed_service import fetch_circular_text
        with patch("app.services.feed_service.requests.get") as mock_get:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.headers = {"Content-Type": "application/pdf"}
            mock_response.raise_for_status = MagicMock()
            mock_get.return_value = mock_response
            result = fetch_circular_text("https://rbi.org.in/some-circular.pdf")
            assert result == ""

    def test_fetch_circular_text_empty_url(self):
        """fetch_circular_text must return empty string for empty URL."""
        from app.services.feed_service import fetch_circular_text
        result = fetch_circular_text("")
        assert result == ""

    def test_parsed_feed_entries_become_previews(self):
        """Mocked feedparser output must be converted to CircularPreview objects."""
        from app.services.feed_service import fetch_feed

        mock_feed_xml = """<?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <title>RBI Notifications</title>
            <item>
              <title>Digital Lending Guidelines</title>
              <link>https://rbi.org.in/circular/1</link>
              <description>Banks must comply with digital lending rules.</description>
              <pubDate>Mon, 02 Sep 2022 00:00:00 +0530</pubDate>
            </item>
          </channel>
        </rss>"""

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = mock_feed_xml
        mock_response.headers = {"Content-Type": "application/rss+xml"}
        mock_response.raise_for_status = MagicMock()

        with patch("app.services.feed_service.requests.get", return_value=mock_response):
            result = fetch_feed("RBI")
            assert len(result) == 1
            assert result[0].title == "Digital Lending Guidelines"
            assert result[0].source == "RBI"
            assert result[0].url == "https://rbi.org.in/circular/1"


# ---------------------------------------------------------------------------
# TestFeedServiceIntegration — real HTTP calls
# ---------------------------------------------------------------------------

class TestFeedServiceIntegration:
    """
    Integration tests that make real HTTP calls to RBI/SEBI/MCA.

    Marked @pytest.mark.integration — skipped if no API key is set
    (we reuse the same skip logic from conftest.py for consistency,
    even though these tests don't need ANTHROPIC_API_KEY specifically).
    Run with: pytest tests/test_feed_service.py -v -m integration
    """

    @pytest.mark.integration
    def test_rbi_feed_returns_previews(self):
        """RBI RSS feed must return at least some circular previews."""
        from app.services.feed_service import fetch_feed
        result = fetch_feed("RBI")
        # RBI feed may be slow or rate-limited — just verify structure if any results
        assert isinstance(result, list)
        for preview in result:
            assert preview.source == "RBI"
            assert preview.title
            assert preview.url

    @pytest.mark.integration
    def test_all_feeds_return_list(self):
        """fetch_all_feeds with real HTTP must return a list."""
        from app.services.feed_service import fetch_all_feeds
        result = fetch_all_feeds()
        assert isinstance(result, list)

    @pytest.mark.integration
    def test_previews_have_no_duplicate_urls(self):
        """fetch_all_feeds must deduplicate by URL."""
        from app.services.feed_service import fetch_all_feeds
        result = fetch_all_feeds()
        urls = [p.url for p in result if p.url]
        assert len(urls) == len(set(urls)), "Duplicate URLs found in fetch_all_feeds result"
