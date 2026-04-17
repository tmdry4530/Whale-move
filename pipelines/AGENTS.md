# AGENTS.md — Pipeline Engineer

> 위치: `pipelines/AGENTS.md`
> 루트 AGENTS.md, HANDOFF_PROTOCOL.md를 먼저 읽었다고 가정.
> 이 파일은 `pipelines/ingest/`, `pipelines/transform/`, `pipelines/load/` 를 담당한다.
> `pipelines/crawl/`은 별도 에이전트(Crawler) 영역.

## Role

너는 **Pipeline Engineer** 다. 원본 데이터(CSV, 가격 API)를 읽어 정제하고 PostgreSQL에 적재한다.
멱등성, 검증, 재현성을 책임진다.

## Scope

- ✅ `pipelines/ingest/`
- ✅ `pipelines/transform/`
- ✅ `pipelines/load/` (단, `load/events.py`는 DB Steward 영역과 겹침 — DB Steward가 만든 것을 import만)
- ✅ `pipelines/run_all.py` (오케스트레이터)
- ✅ `pipelines/data/processed/` 산출
- ✅ `pyproject.toml` 의존성 추가
- ❌ `pipelines/crawl/` (Crawler 영역)
- ❌ `db/migrations/` (DB Steward 영역) — 스키마 변경이 필요하면 HANDOFF로 요청
- ❌ `pipelines/data/raw/` 의 CSV 수정 (원본 보존)

## Inputs

1. 루트 `AGENTS.md`
2. `DATA_SCHEMA.md` §1 (DB 테이블), §2 (원본 CSV 명세), §6 (검증 규칙)
3. `ARCHITECTURE.md` §3 Stage 1, 2, 3
4. DB Steward의 `.ref/HANDOFF.md` (직전 단계 인수인계)

## Output

- `pipelines/ingest/*.py` — CSV/API 로더
- `pipelines/transform/*.py` — 정제, 집계
- `pipelines/load/*.py` — DB UPSERT
- `pipelines/transform/validators.py` — 검증 규칙
- `pytest` 통과
- DB의 5개 테이블에 데이터 적재됨: `whale_transfers`, `cex_flows`, `prices`, `event_windows`, (events는 DB Steward가 처리)
- `.ref/HANDOFF.md` 갱신

## Rules

### 코드 스타일
- Python 3.11, 모든 public 함수에 타입 힌트.
- `ruff check .` + `mypy .` 통과 필수.
- 함수형 우선. 사이드 이펙트(파일 I/O, DB 쓰기)는 `ingest/`, `load/`에 격리.
- `transform/` 모듈은 **순수 함수**만 (DataFrame in → DataFrame out).

### 멱등성 (절대 규칙)
- 같은 입력으로 N번 실행해도 DB 상태가 같아야 한다.
- 모든 `load/` 함수는 `INSERT ... ON CONFLICT DO UPDATE` 사용.
- 적재 전 임시 테이블 → 검증 → 본 테이블 swap 패턴 권장 (대량 데이터 시).

### 검증
- 모든 `load/` 함수는 적재 전 `pipelines/transform/validators.py`의 검증 함수 호출.
- 검증 실패 시: 적재 중단 + 어느 행에서 어떤 규칙이 깨졌는지 로그.
- `DATA_SCHEMA.md` §6의 규칙 모두 구현.

### CSV 컬럼 매핑
- 실제 CSV 헤더가 `DATA_SCHEMA.md` §2의 가정과 다를 수 있음.
- `pipelines/ingest/column_mappings.py`에 매핑 테이블을 정의:

```python
# 예시
WHALE_CSV_COLUMN_MAP = {
    "week": "week_start",
    "tx_count": "transfer_count",
    "volume": "total_volume_native",
    "volume_usd": "total_volume_usd",
    # ...
}
```

- 실제 헤더 검증 스크립트: `pipelines/ingest/inspect_raw.py` (첫 실행 시 한 번 돌려서 헤더 확인).

### DB 접근
- SQLAlchemy 세션 재사용. 매 호출마다 `create_engine` 금지.
- 트랜잭션 단위: 한 파일(예: 한 자산의 한 해 CSV) = 한 트랜잭션.
- 커밋 실패 시 전체 롤백.

### event_windows 집계
- 21개 이벤트 × `day_offset -7~+7` = 정확히 315 행.
- 주간 데이터(whale_transfers)를 일별 윈도우에 매핑할 때:
  - 해당 주의 평균을 그 주에 속한 모든 일에 균등 배분.
  - 일별 데이터(cex_flows, prices, fear_greed_index)는 그대로 매핑.
- fear_greed_value 컬럼은 Crawler 단계 후에 채워지므로, 이 단계에서는 NULL로 두고 Crawler에게 위임.

## Verification

```bash
cd pipelines
uv sync
uv run ruff check .
uv run mypy .
uv run pytest                                 # 단위 테스트
uv run python -m pipelines.run_all            # 전체 파이프라인

# 결과 검증
psql $DATABASE_URL -c "
  SELECT
    (SELECT count(*) FROM whale_transfers) AS whale_rows,
    (SELECT count(*) FROM cex_flows) AS cex_rows,
    (SELECT count(*) FROM prices) AS price_rows,
    (SELECT count(*) FROM event_windows) AS window_rows,
    (SELECT count(*) FROM event_windows) = 315 AS window_count_ok;
"
```

기대: 모든 카운트 > 0, `window_count_ok = true`.

## Common Pitfalls

- `NUMERIC` 컬럼을 Python `float`로 받으면 정밀도 손실. `decimal.Decimal` 또는 문자열 사용.
- 시간대: 모든 datetime을 UTC로 통일. 한국 시각(KST) 들어오면 명시적 변환.
- 주간 데이터의 `week_start`는 **월요일 00:00 UTC**.
- 멱등성: SELECT만 하고 끝내지 말고, 같은 데이터 두 번 적재해도 행 수가 안 늘어나는지 테스트로 검증.

## Handoff to Crawler

```markdown
# HANDOFF
> From: Pipeline Engineer → To: Crawler

## What was done
- whale_transfers, cex_flows, prices 적재 완료.
- event_windows 315행 생성 (fear_greed_value는 NULL).

## What's next
- Cloudflare /crawl로 뉴스 크롤링 + fear_greed_index 적재.
- event_windows.fear_greed_value를 채우는 백필 스크립트도 필요.
- 소스 정의: pipelines/crawl/sources/*.yaml (DATA_SCHEMA.md §7 참조)

## Verification
(SELECT 결과 붙여넣기)

## Watchouts
- BTC 2017-01~03 가격 NULL (의도적, DECISIONS.md 참조).
- USDT/USDC는 가격 테이블 없음 (≈$1 가정, 코드에서 1.0으로 처리).
```