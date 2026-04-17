from datetime import UTC, datetime

from crawl.models import ArticleCandidate, EventRecord
from crawl.utils import extract_markdown_candidates, match_event, parse_url_date, slug_to_title


def test_parse_url_date_from_path() -> None:
    parsed = parse_url_date("https://www.coindesk.com/markets/2022/11/11/example-story")
    assert parsed == datetime(2022, 11, 11, tzinfo=UTC)


def test_slug_to_title() -> None:
    assert (
        slug_to_title("https://www.coindesk.com/markets/2022/11/11/ftx-collapse-explained")
        == "Ftx Collapse Explained"
    )


def test_extract_markdown_candidates() -> None:
    markdown = "[FTX Files for Bankruptcy](https://www.coindesk.com/markets/2022/11/11/ftx-files-for-bankruptcy)"
    candidates = extract_markdown_candidates(markdown, source="coindesk", language="en")
    assert len(candidates) == 1
    assert candidates[0].title == "FTX Files for Bankruptcy"


def test_match_event_prefers_exact_source_url_then_date() -> None:
    event = EventRecord(
        id="ftx_collapse",
        event_date=datetime(2022, 11, 11, tzinfo=UTC).date(),
        name_ko="FTX 파산",
        name_en="FTX Collapse",
        description="desc",
        source_url="https://en.wikipedia.org/wiki/Bankruptcy_of_FTX",
    )
    candidate = ArticleCandidate(
        url="https://en.wikipedia.org/wiki/Bankruptcy_of_FTX",
        title="Bankruptcy of FTX",
        summary=None,
        published_at=None,
        language="en",
        source="reference",
    )
    assert match_event(candidate, [event]) == "ftx_collapse"
