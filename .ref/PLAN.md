# PLAN

## Current Stage: Complete (verified)

## Preflight Notes
- `sub-agents/` directory is not present in this workspace.
- Scoped AGENTS files already exist at `db/`, `apps/api/`, `apps/web/`, `pipelines/`, and `pipelines/crawl/`.
- Execution order follows `HANDOFF_PROTOCOL.md` (`DB → Pipeline → Crawler → Backend → Frontend`) even though `ARCHITECTURE.md` presents crawler earlier in runtime data flow.

## Stage: DB ✅ (완료 2026-04-17)
- [x] Create PostgreSQL docker compose service and migration runner path
- [x] Add migrations for 8 core tables and indexes
- [x] Add idempotent events seed loader from `EVENTS.md`
- [x] Verify fresh migration + 21 seeded events (HANDOFF_PROTOCOL.md §3.2 DB→Pipeline gate)

## Stage: Pipeline ✅ (완료 2026-04-17)
- [x] Scaffold Python project + loaders/transforms/loaders orchestration
- [x] Load whale, exchange flow, and price raw datasets into PostgreSQL
- [x] Build `event_windows` daily offsets (315 rows)
- [x] Verify non-empty tables + `event_windows = 315` (HANDOFF_PROTOCOL.md §3.2 Pipeline→Crawler gate)

## Stage: Crawler ✅ (완료 2026-04-17)
- [x] Define Cloudflare crawl sources and parser/load pipeline
- [x] Implement job submit/collect with DB persistence and cache handling
- [x] Load news + fear/greed data and backfill `event_windows.fear_greed_value`
- [x] Verify all 21 events have news, fear/greed coverage exists, and all crawl jobs are `done` or explicitly `errored` (HANDOFF_PROTOCOL.md §3.2 Crawler→Backend gate, with user-approved 2017 fear/greed exception)

## Stage: Backend ✅ (완료 2026-04-17)
- [x] Scaffold Fastify API, DB access, schemas, tests, and docs
- [x] Implement 7 required endpoints + `/health`
- [x] Verify 200 + non-empty payloads and update OpenAPI or README endpoint table (HANDOFF_PROTOCOL.md §3.2 Backend→Frontend gate)

## Stage: Frontend ✅ (완료 2026-04-17)
- [x] Scaffold React/Vite app with TanStack Query and charts
- [x] Implement timeline, event detail, comparison, and Korea views
- [x] Verify 21 markers, detail panel window+news, and Korea tab (HANDOFF_PROTOCOL.md §3.2 Frontend→Final gate)
