# HANDOFF

> From: Frontend → To: User (시연 안내)
> Date: 2026-04-17
> Status: ready

## How to demo
1. `docker compose up -d db`
2. `cd pipelines && uv sync`
3. `python -m pipelines.run_all`
4. `export CLOUDFLARE_ACCOUNT_ID=...` / `export CLOUDFLARE_API_TOKEN=...`
5. `python -m crawl.jobs.submit_all && python -m crawl.jobs.collect`
6. `cd ../apps/api && pnpm install && pnpm dev`
7. `cd ../web && pnpm install && pnpm dev --host 0.0.0.0`
8. 브라우저에서 `http://localhost:5173` 열기

## Demo script (5분)
1. 메인 화면 — 큰 지갑 활동 타임라인과 21개 이벤트 마커 소개
2. `FTX 파산` 선택 — 사이드 패널에서 전후 7일 송금/거래소 입출금/공포·탐욕 지수 + 뉴스 확인
3. `이벤트 비교` 탭 — 이벤트 유형별 평균 반응 비교
4. `한국 섹터` 탭 — 한국 이벤트 6개만 따로 모아 비교

## Verification summary
- `apps/web`: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` 통과
- Headless Chrome 확인:
  - `/?tab=timeline&event=ftx_collapse`에서 21개 이벤트 선택 버튼 렌더
  - `그때 나온 헤드라인` 섹션 렌더
  - `/?tab=korea&event=ftx_collapse`에서 `한국 섹터` heading과 6개 한국 이벤트 카드 렌더
- `apps/api`: `/health`, `/api/events`, `/api/events/:id/window`, `/api/events/:id/news`, `/api/fear-greed`, `/docs`, `/docs/json` 응답 확인

## Known limitations
- 2017 이벤트 2건(`kr_ico_ban`, `kr_kimchi_premium_2017`)은 공식 fear & greed 원천 데이터가 없어 `fearGreedValue = null`로 남음.
- 현재 `news_articles`는 CoinDesk/reference 기반 비중이 높고, 다른 크롤 소스는 terminal job이지만 기사 매칭률이 낮음.
- 테스트 환경에서는 Recharts의 `ResponsiveContainer`가 실제 폭/높이를 계산하지 못해 경고가 출력되지만, 브라우저 렌더에는 영향 없음.
