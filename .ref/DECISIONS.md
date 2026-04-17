# DECISIONS

## 2026-04-17 — DB Steward
- `events` 시드는 `EVENTS.md` YAML 블록을 파싱해 `db/seeds/events.sql`을 생성하는 방식으로 유지.
  이유: 사람이 직접 21개 INSERT를 손으로 관리하지 않고 멱등성을 보장하기 위함.

## 2026-04-17 — Pipeline Engineer
- `exchange_flow_data/*.csv`는 모두 `wallet_to_wallet`만 포함해 `cex_flows` 적재에 사용하지 않음.
  이유: `cex_flows.direction IN (inflow, outflow)` 스키마를 임의 추정 없이 충족해야 하므로, Dune query `7329547`의 방향성 CSV를 기준 데이터로 채택.

## 2026-04-17 — Pipeline Engineer
- 연도 경계에 중복된 whale 주간 row는 `(week_start, asset)` 기준으로 합산 후 사용.
  이유: 연도별 CSV가 경계 주를 분할 포함하고 있어, 합산해야 DB 적재와 event_windows 집계가 동일한 단일 주간 값에 수렴함.

## 2026-04-17 — Pipeline Engineer
- `run_all`은 적재 후 DB에 남은 stale row를 제거하고 source-derived row와 persisted row의 일치를 검증함.
  이유: upsert만으로는 이전 실행의 잔여 row가 남을 수 있어, Pipeline→Crawler 게이트를 데이터 정합성까지 포함해 통과시키기 위함.

## 2026-04-17 — Crawler
- `fear_greed_index`는 `alternative.me` 공식 JSON 히스토리를 사용하고, 데이터 시작일(2018-02-01) 이전인 2017 이벤트 2건은 `NULL`로 유지.
  이유: 사용자 승인 하에 원천 데이터 부재를 보존하고, 합성값을 만들어 분석 기준을 오염시키지 않기 위함.
- FSC 관련 reference crawl이 `522`를 반환한 경우에도 해당 URL을 fallback article row로 보존.
  이유: 공식 출처 URL 자체는 유효하지만 Cloudflare/origin 응답이 불안정하므로, coverage와 provenance를 잃지 않기 위함.

## 2026-04-17 — Backend
- API validation 실패는 모두 `400 { error, details }` 형태로 반환.
  이유: Frontend가 입력 오류와 서버 오류를 구분할 수 있어야 하고, AGENTS.md의 에러 응답 규약을 충족해야 하기 때문.
- `/docs`와 `/docs/json`을 Frontend handoff의 단일 API 계약 진입점으로 사용.
  이유: README 대신 살아있는 OpenAPI 스키마를 바로 참조할 수 있게 하기 위함.

## 2026-04-17 — Frontend
- Frontend는 `tab`/`event` 쿼리 파라미터를 URL 상태로 사용해 화면 상태를 공유 가능하게 유지.
  이유: 발표 시 특정 사건 화면을 바로 열 수 있어 시연 동선을 단순화할 수 있기 때문.
- 숫자형 API 필드는 문자열 그대로 받고, 차트 직전에만 `Number()`로 변환.
  이유: Backend가 precision 보호를 위해 `NUMERIC/BIGINT`를 문자열로 내려주므로, UI 표현과 차트 계산의 책임을 분리하기 위함.
