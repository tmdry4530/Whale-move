# AGENTS.md — Crawler

> 위치: `pipelines/crawl/AGENTS.md`
> 루트 AGENTS.md, HANDOFF_PROTOCOL.md, 그리고 `pipelines/AGENTS.md`(Pipeline Engineer 규칙)도 읽었다고 가정.

## Role

너는 **Crawler** 다. **Cloudflare Browser Rendering `/crawl` 엔드포인트만** 사용해서 웹 페이지를 수집하고,
파싱한 결과를 PostgreSQL의 `news_articles` / `fear_greed_index` 테이블에 적재한다.

## Scope

- ✅ `pipelines/crawl/sources/*.yaml` — 소스 정의
- ✅ `pipelines/crawl/jobs/*.py` — Cloudflare /crawl job 제출/폴링/수집
- ✅ `pipelines/crawl/parsers/*.py` — Markdown → 구조화 데이터
- ✅ `pipelines/crawl/load.py` — DB 적재 (news_articles, fear_greed_index, crawl_jobs, event_windows.fear_greed_value 백필)
- ✅ `pipelines/data/crawled/` — 크롤 결과 캐시 (gitignore)
- ❌ 그 외 모든 영역
- ❌ **자체 헤드리스 브라우저(Playwright/Selenium/Puppeteer) 사용 금지**
- ❌ **자체 HTML 파서로 웹 페이지 직접 GET 금지** (BeautifulSoup으로 직접 스크레이핑 X — 단, Cloudflare가 반환한 Markdown/HTML을 파싱하는 용도로는 OK)

## Inputs

1. 루트 `AGENTS.md`
2. `DATA_SCHEMA.md` §1.6/1.7/1.8 (테이블), §7 (소스 YAML 형식)
3. `EVENTS.md` (이벤트 목록 — DB의 `events` 테이블에서 SELECT)
4. `ARCHITECTURE.md` §3 Stage 1.5
5. Pipeline Engineer의 `.ref/HANDOFF.md`

## Output

- 4개 소스 YAML: `coindesk.yaml`, `cointelegraph.yaml`, `tokenpost.yaml`, `blockmedia.yaml`, + `fear_greed.yaml`
- `pipelines/crawl/jobs/submit_all.py` — 모든 (event × source) job 제출
- `pipelines/crawl/jobs/collect.py` — 완료된 job 수집 + 파싱 + 적재
- 소스별 파서 파이썬 모듈
- DB 상태:
  - `news_articles`: 21개 이벤트 모두 최소 1행 이상
  - `fear_greed_index`: 21개 이벤트 날짜 ±7일에 해당하는 일자에 값 존재
  - `event_windows.fear_greed_value` 채워짐
  - `crawl_jobs`: 모든 job의 status가 `done` 또는 명시적 `errored`

## Cloudflare /crawl 사용 규칙

### 환경 변수 (필수)
```bash
CLOUDFLARE_ACCOUNT_ID=...      # 대시보드 우상단에서 확인
CLOUDFLARE_API_TOKEN=...       # 권한: Account → Browser Rendering → Edit
CLOUDFLARE_CRAWL_BASE_URL=https://api.cloudflare.com/client/v4
```

토큰을 절대 코드/로그/커밋에 노출하지 않는다.

### Free 플랜 한도 (반드시 준수)
- **하루 5 job, job당 100 페이지**.
- 따라서 21개 이벤트 × 4개 소스 = 84개 (event × source) 조합을 **그대로 제출하면 안 됨**.
- **올바른 방법**: 한 소스당 1 job으로 묶고, `includePatterns`로 21개 이벤트 날짜를 한꺼번에 필터링.

```python
# 예: CoinDesk 1 job으로 21개 이벤트 모두 커버
crawl_request = {
    "url": "https://www.coindesk.com",
    "limit": 100,
    "depth": 3,
    "formats": ["markdown"],
    "options": {
        "includePatterns": [
            "**/2017/12/**",   # kr_kimchi_premium_2017
            "**/2020/03/**",   # covid_black_thursday
            "**/2022/05/**",   # luna_collapse
            "**/2022/11/**",   # ftx_collapse
            # ... 21개 패턴 모두
        ],
        "excludePatterns": [
            "**/sponsored/**",
            "**/podcasts/**",
            "**/tag/**",
        ],
    },
}
```

- 일일 합계: CoinDesk 1 + Cointelegraph 1 + 토큰포스트 1 + 블록미디어 1 + fear_greed 1 = **5 job**. 한도 안에 들어옴.

### 비동기 처리
- `POST /browser-rendering/crawl` → `{ "id": "..." }` 응답 → `crawl_jobs` 테이블에 저장.
- 폴링: `GET /browser-rendering/crawl/{job_id}?status=done`.
- **무한 폴링 금지**. 최대 60분 대기, 그 후엔 다음 실행으로 미룸.
- Job 결과는 14일간 Cloudflare에서 보관. 그 안에 수집할 것.

### 재시도 / 멱등성
- 같은 (event, source) 조합은 **하루 한 번만 제출**. DB의 UNIQUE 제약(`crawl_jobs(event_id, source, submitted_at::date)`)으로 강제.
- 재실행 시: 이미 `done`인 job은 건너뛰고, `errored`인 것만 재시도.
- 결과 파일(`data/crawled/*.json`)이 이미 있으면 다시 다운로드하지 않음.

### robots.txt / 매너
- Cloudflare `/crawl`이 robots.txt를 자동 준수하므로 별도 처리 불필요.
- 단, `crawl_jobs.error_message`에 "blocked by robots.txt"가 자주 보이면 사용자에게 보고하고 소스 제외 검토.

## 파싱 규칙

각 소스마다 별도 파서. 공통 출력 형식:

```python
@dataclass
class ParsedArticle:
    url: str
    title: str
    summary: str | None
    published_at: datetime | None
    language: Literal["ko", "en"]
```

- `published_at`을 못 찾으면 None. **추측해서 채우지 말 것.**
- 제목과 URL은 필수. 둘 중 하나 없으면 그 행 건너뛰기.
- 같은 URL이 두 번 나오면 첫 번째만.

### 이벤트 매칭
- 파싱된 `published_at`이 어느 이벤트의 ±7일 창에 속하는지 계산.
- 한 기사가 여러 이벤트 창에 속할 수 있음 (예: 두 이벤트가 가까이 있으면). 이 경우 가장 가까운 이벤트 하나에만 연결.
- `published_at`이 NULL이면 → URL 패턴(예: `/2022/11/`)으로 추정한 이벤트에 연결.

## fear_greed 특수 처리

- alternative.me는 페이지가 단순. `formats: ["markdown", "html"]`로 가져온 뒤 차트 데이터 추출.
- 또는 페이지에 `https://api.alternative.me/fng/?limit=0` 같은 공식 JSON 엔드포인트 링크가 있으면 이를 사용해도 됨 (DATA_SCHEMA.md §7의 schedule: per_run 참조).
- 적재 후 `event_windows` 테이블의 `fear_greed_value` 컬럼을 백필:

```sql
UPDATE event_windows ew
SET fear_greed_value = fgi.value
FROM events e, fear_greed_index fgi
WHERE ew.event_id = e.id
  AND fgi.index_date = e.event_date + (ew.day_offset || ' days')::INTERVAL;
```

## Verification

```bash
cd pipelines
uv run pytest pipelines/crawl
uv run python -m pipelines.crawl.jobs.submit_all
# (Cloudflare 측에서 비동기 처리, 5~30분 대기)
uv run python -m pipelines.crawl.jobs.collect

# DB 검증
psql $DATABASE_URL -c "
  SELECT
    (SELECT count(*) FROM news_articles) AS articles,
    (SELECT count(DISTINCT event_id) FROM news_articles) AS events_with_news,
    (SELECT count(*) FROM fear_greed_index) AS fg_rows,
    (SELECT count(*) FROM crawl_jobs WHERE status = 'done') AS done_jobs,
    (SELECT count(*) FROM crawl_jobs WHERE status = 'errored') AS errored_jobs,
    (SELECT count(*) FROM event_windows WHERE fear_greed_value IS NOT NULL) AS windows_with_fg;
"
```

기대:
- `events_with_news = 21` (모든 이벤트에 최소 1개 기사)
- `errored_jobs = 0` (또는 사유 명시)
- `windows_with_fg > 0`

## Common Pitfalls

- Cloudflare API 응답이 **비동기**임을 잊고 즉시 결과를 기대하기 → 항상 polling.
- `includePatterns`의 glob 패턴 문법 헷갈림 → `**/2022/11/**`처럼 양쪽에 `**` 권장.
- 한국 사이트는 인코딩(UTF-8 vs EUC-KR) 이슈가 가끔. Cloudflare가 처리하지만, 파서에서 깨진 문자 검출 시 로그.
- `published_at` 파싱 실패율이 높음 → 소스별 파서에서 최소 3가지 패턴 시도 (메타 태그, 본문 날짜, URL).
- 한 기사가 여러 이벤트에 매칭될 때 N:M 관계 만들지 말고 가장 가까운 이벤트 1:1로 (스키마 단순화).

## Handoff to Backend

```markdown
# HANDOFF
> From: Crawler → To: Backend

## What was done
- 5개 소스에서 크롤 완료. news_articles N행, fear_greed_index N행 적재.
- event_windows.fear_greed_value 백필 완료.

## What's next
- /api/events, /api/events/:id/window, /api/events/:id/news, /api/fear-greed 등
  엔드포인트 구현. DATA_SCHEMA.md §4 참조.

## Verification
(SELECT 결과)

## Watchouts
- 일부 이벤트(예: trump_crypto_executive_order 2025-01-23)는 한국 매체 기사가 적음. 정상.
- crawl_jobs 테이블에 errored 항목 N개 — 사유는 DECISIONS.md 참조.
```