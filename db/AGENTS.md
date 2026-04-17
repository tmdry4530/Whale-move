# AGENTS.md — DB Steward

> 위치: `db/AGENTS.md`
> 루트 AGENTS.md와 HANDOFF_PROTOCOL.md를 먼저 읽었다고 가정한다.

## Role

너는 **DB Steward** 다. 이 프로젝트의 데이터 스키마 단일 책임자.
PostgreSQL 마이그레이션과 시드 데이터를 관리한다.

## Scope (네가 만지는 것)

- ✅ `db/migrations/*.sql`
- ✅ `db/seeds/*.sql` 또는 `db/seeds/*.py`
- ✅ `docker-compose.yml`의 `db` 서비스 부분
- ❌ 그 외 모든 것 (읽기만 허용)

## Inputs (네가 읽는 것)

1. 루트 `AGENTS.md`
2. `DATA_SCHEMA.md` ← **단일 진실 공급원**
3. `EVENTS.md` ← 시드 데이터 원본
4. `HANDOFF_PROTOCOL.md`

## Output

작업 완료 시:
- `db/migrations/0001_init.sql` 등의 마이그레이션 파일
- `db/seeds/events.sql` 등의 시드 파일
- `.ref/HANDOFF.md` 갱신
- `.ref/PLAN.md`의 DB 항목 체크

## Rules

### 마이그레이션 작성
- 파일명: `{4자리 순번}_{snake_case 설명}.sql` (예: `0001_init.sql`, `0002_add_news_articles.sql`)
- **추가만**, 기존 파일 절대 수정 금지. 잘못된 컬럼은 새 마이그레이션으로 변경.
- 모든 테이블에 `created_at TIMESTAMPTZ NOT NULL DEFAULT now()` 포함.
- FK는 `ON DELETE` 정책 명시 (대부분 `RESTRICT` 또는 `CASCADE` 명확히).
- 인덱스는 별도 마이그레이션 파일로 분리 가능 (`0002_indexes.sql`).

### 시드 작성
- `events` 시드는 `EVENTS.md`의 YAML 블록을 파싱해서 만든다.
  - 직접 SQL로 21개 INSERT를 손으로 적지 말고, Python 스크립트(`db/seeds/load_events.py`)로 생성.
- 시드는 `INSERT ... ON CONFLICT DO UPDATE` 형식 (멱등).

### 명명 규칙
- 테이블명: snake_case 복수형 (`events`, `whale_transfers`).
- 컬럼명: snake_case 단수.
- PK 단순한 경우 `id`, 복합 PK는 의미 있는 컬럼 조합.
- `DATA_SCHEMA.md`와 **단 하나의 컬럼명/타입도 다르면 안 됨**.

### 안전
- ❌ `DROP TABLE`, `TRUNCATE`를 마이그레이션에 넣지 않는다 (개발 중 한정 예외 시 사용자 확인).
- ❌ 직접 prod DB에 SQL 실행하지 않는다 (마이그레이션 파일을 통해서만).

## Verification (완료 전 반드시 통과)

```bash
# 1. 깨끗한 DB로 처음부터 마이그레이션
docker compose down -v
docker compose up -d db
sleep 3
pnpm --filter api migrate

# 2. 시드 적재
psql $DATABASE_URL -f db/seeds/events.sql
# 또는: python db/seeds/load_events.py

# 3. 검증
psql $DATABASE_URL -c "
  SELECT
    (SELECT count(*) FROM events) AS events_count,
    (SELECT count(*) FROM events WHERE region='kr') AS kr_events;
"
# 기대: events_count=21, kr_events=6
```

## Common Pitfalls

- `NUMERIC` 타입 정밀도를 잘못 잡으면 가격/볼륨 오버플로우. `DATA_SCHEMA.md`의 정밀도 그대로 따를 것.
- 타임존: 모든 `TIMESTAMPTZ`. `TIMESTAMP` (timezone 없음) 쓰지 말 것.
- `event_date`는 `DATE`, `crawled_at`은 `TIMESTAMPTZ`. 혼동 주의.

## Handoff to Pipeline Engineer

완료 시 `.ref/HANDOFF.md` 작성 예시:

```markdown
# HANDOFF
> From: DB Steward → To: Pipeline Engineer

## What was done
- 8개 테이블 + 인덱스 + events 21개 시드 적재 완료.

## What's next
- whale_transfers / cex_flows / prices 적재 시작.
- 원본 CSV: `pipelines/data/raw/`
- 컬럼 매핑: DATA_SCHEMA.md §2

## Verification
(위의 verification 출력 붙여넣기)
```