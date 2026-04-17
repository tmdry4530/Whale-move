# AGENTS.md — Backend

> 위치: `apps/api/AGENTS.md`
> 루트 AGENTS.md, HANDOFF_PROTOCOL.md를 먼저 읽었다고 가정.

## Role

너는 **Backend** 다. PostgreSQL의 데이터를 React 프론트가 쓸 수 있는 JSON으로 서빙한다.
**비즈니스 로직 최소.** 가공/계산은 모두 파이프라인이 미리 끝낸 상태.

## Scope

- ✅ `apps/api/src/`
- ✅ `apps/api/test/`
- ✅ `apps/api/package.json`
- ✅ `apps/api/tsconfig.json`
- ❌ DB 스키마 변경 (DB Steward에게 HANDOFF로 요청)
- ❌ 파이프라인 코드 변경
- ❌ 프론트 코드

## Inputs

1. 루트 `AGENTS.md`
2. `DATA_SCHEMA.md` §1 (테이블), §4 (API 응답 형식), §5 (명명 규칙)
3. Crawler의 `.ref/HANDOFF.md`

## Output

- Fastify 서버 (TypeScript strict)
- 7개 엔드포인트 (DATA_SCHEMA.md §4):
  - `GET /api/events`
  - `GET /api/events/:id/window`
  - `GET /api/events/:id/news`
  - `GET /api/whale-flows`
  - `GET /api/cex-flows`
  - `GET /api/prices`
  - `GET /api/fear-greed`
- 추가: `GET /health` (단순 200 OK)
- `apps/api/test/*.test.ts` — Vitest 또는 Node test runner
- `.ref/HANDOFF.md` 갱신

## Stack

- Node.js 20 + TypeScript strict
- **Fastify** (Express 아님)
- **postgres.js** (pg 라이브러리. node-postgres도 가능하나 통일)
- 캐시: 인메모리 LRU (`lru-cache` 패키지) — Redis 아님
- 검증: Zod (요청 파라미터 + 응답 스키마)

## Rules

### 책임 경계
- API는 SELECT만 한다. INSERT/UPDATE/DELETE 금지.
- 가공이 필요하면 → 파이프라인에 위임 (HANDOFF로 요청).
- 비즈니스 로직 두지 말 것 (이미 `event_windows` 같은 비정규화 테이블에 미리 집계됨).

### 라우트 구조
```text
src/
├── index.ts                # 부트스트랩
├── server.ts               # Fastify 인스턴스 생성
├── db.ts                   # postgres 연결 (싱글턴)
├── cache.ts                # LRU 캐시 헬퍼
├── routes/
│   ├── health.ts
│   ├── events.ts
│   ├── whale_flows.ts
│   ├── cex_flows.ts
│   ├── prices.ts
│   └── fear_greed.ts
├── schemas/                # Zod 스키마 (request + response)
│   └── ...
└── repos/                  # SQL 쿼리 모음
    └── ...
```

### 응답 직렬화 (중요)
- DB의 snake_case → API JSON의 camelCase로 매핑.
- `NUMERIC` 컬럼은 **문자열로 직렬화** (JS 정밀도 손실 방지).
  - 예: `total_volume_usd` (NUMERIC) → `"3210987654.32"` (string)
- `DATE` → ISO 8601 날짜 문자열 (`"2022-11-11"`).
- `TIMESTAMPTZ` → ISO 8601 (`"2022-11-11T14:23:00Z"`).
- `null`은 `null`로 (생략 X).

### 에러 처리
- 입력 검증 실패: 400 + `{ "error": "...", "details": ... }`.
- 리소스 없음: 404 + `{ "error": "Event not found" }`.
- DB 에러: 500 + 구체적 메시지는 로그에만, 응답엔 `{ "error": "Internal error" }`.
- 모든 에러 응답은 같은 shape.

### 캐싱
- LRU 캐시, TTL 5분.
- 키: 라우트 + 정규화된 쿼리 파라미터 (예: `events:category=crisis`).
- 캐시 무효화 엔드포인트 없음 (TTL로만 갱신).

### CORS
- 개발: `http://localhost:5173` (Vite 기본 포트) 허용.
- 발표용 배포: 환경 변수로 제어.

### 보안
- 모든 쿼리는 **파라미터화된 쿼리** 사용. 문자열 연결 금지 (SQL injection 방지).
- `?asset=ETH` 같은 enum-like 파라미터는 Zod로 화이트리스트 검증.

## Verification

```bash
pnpm --filter api install
pnpm --filter api lint
pnpm --filter api typecheck
pnpm --filter api test

# 통합 테스트
pnpm --filter api dev &
sleep 2
curl -s http://localhost:3001/health | jq .         # → { "status": "ok" }
curl -s http://localhost:3001/api/events | jq 'length'  # → 21
curl -s "http://localhost:3001/api/events/ftx_collapse/window" | jq '.window | length'  # → 15
curl -s "http://localhost:3001/api/events/ftx_collapse/news" | jq 'length'  # → > 0
curl -s "http://localhost:3001/api/fear-greed?from=2022-11-04&to=2022-11-18" | jq 'length'  # → 15
kill %1
```

기대: 위 모든 응답이 빈 배열/null이 아니어야 함.

## OpenAPI / 문서

- Fastify의 `@fastify/swagger` + `@fastify/swagger-ui`로 자동 문서 생성.
- 개발 서버에서 `http://localhost:3001/docs`로 접근 가능하게.
- Frontend가 이 페이지를 보고 응답 형식을 확인할 수 있도록.

## Common Pitfalls

- `BIGINT` 컬럼을 그대로 JSON으로 보내면 JS Number로 변환되며 정밀도 손실. 문자열로.
- `NUMERIC`도 마찬가지. postgres.js는 기본적으로 문자열로 주는데, 명시적으로 확인할 것.
- 시간대: DB는 UTC 저장, API 응답도 UTC. 클라이언트 시간대 변환은 프론트에서.
- `events.id`는 슬러그(string). 정수 PK로 착각하지 말 것.

## Handoff to Frontend

```markdown
# HANDOFF
> From: Backend → To: Frontend

## What was done
- 7개 엔드포인트 구현 + 통과. Swagger UI: http://localhost:3001/docs

## What's next
- React 컴포넌트로 데이터 시각화. PRD §6 사용자 시나리오 참조.

## API Base
- 개발: http://localhost:3001
- 응답 형식: DATA_SCHEMA.md §4

## Verification
(curl 출력 붙여넣기)

## Watchouts
- NUMERIC 필드는 문자열. Number()로 변환해서 차트에 넣을 것.
- /api/events/:id/window는 days 파라미터 기본값 7 (DECISIONS.md).
```