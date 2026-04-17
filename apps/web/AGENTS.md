# AGENTS.md — Frontend

> 위치: `apps/web/AGENTS.md`
> 루트 AGENTS.md, HANDOFF_PROTOCOL.md, PRD.md를 먼저 읽었다고 가정.

## Role

너는 **Frontend** 다. Backend가 서빙하는 API를 받아 **스토리텔링 중심**의 인터랙티브 대시보드를 만든다.
**블록체인을 모르는 사람이 5분 안에 이해할 수 있어야 한다** (PRD §4 DoD).

## Scope

- ✅ `apps/web/src/`
- ✅ `apps/web/public/`
- ✅ `apps/web/test/`
- ✅ `apps/web/package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`
- ❌ Backend 응답 형식 변경 (Backend에게 HANDOFF로 요청)
- ❌ DB / 파이프라인 코드

## Inputs

1. 루트 `AGENTS.md`
2. `PRD.md` (특히 §4 DoD, §6 사용자 시나리오, §7 FR-3)
3. `DATA_SCHEMA.md` §4 (API 응답 형식)
4. `EVENTS.md` (이벤트 목록 — UI에 표시할 메타데이터)
5. Backend의 `.ref/HANDOFF.md`

## Output

- 4개 화면 (PRD FR-3):
  - **메인 타임라인**: 전체 기간 + 이벤트 오버레이
  - **이벤트 디테일**: 클릭 시 사이드 패널 (윈도우 차트 + 뉴스 헤드라인)
  - **이벤트 비교 뷰**: 카테고리별 평균 패턴
  - **한국 섹터 뷰**: 한국 이벤트 6개 전용
- 컴포넌트 단위 테스트 (Vitest + Testing Library)
- `.ref/HANDOFF.md` 갱신 (최종 단계 — 사용자에게 인수인계)

## Stack

- React 18 + TypeScript strict
- Vite (CRA 아님)
- **TanStack Query** (React Query) — API 호출 + 캐싱
- **Recharts** (1차) 또는 Visx (필요 시) — 시각화
- **Tailwind CSS** — 스타일
- **React Router** — 라우팅 (필요 최소)
- **Zod** — API 응답 런타임 검증 (Backend와 같은 스키마 공유 권장)

## Rules

### 디렉토리 구조
```text
src/
├── main.tsx
├── App.tsx
├── api/
│   ├── client.ts           # fetch + Zod 검증 래퍼
│   └── endpoints.ts        # 엔드포인트별 함수 (queryFn)
├── features/
│   ├── timeline/
│   │   ├── MainTimeline.tsx
│   │   └── EventMarker.tsx
│   ├── event-detail/
│   │   ├── EventDetailPanel.tsx
│   │   ├── WindowChart.tsx
│   │   └── NewsList.tsx
│   ├── compare/
│   │   └── CategoryCompareView.tsx
│   └── korea/
│       └── KoreaSectorView.tsx
├── components/             # 공용 (Button, Card, Tooltip 등)
├── lib/                    # 포맷터, 유틸
└── styles/
```

### API 호출
- **모든 API 호출은 TanStack Query 통해서만**. fetch 직접 호출 금지.
- 응답은 Zod로 런타임 검증. 실패 시 사용자에게 보이는 에러 표시.
- NUMERIC 문자열 → `Number()` 변환은 차트에 넘기기 직전에만 (정밀도가 중요한 표시는 그대로 문자열).

```typescript
// api/endpoints.ts 예시
export const useEvents = () => useQuery({
  queryKey: ['events'],
  queryFn: async () => {
    const res = await fetch(`${API_BASE}/api/events`);
    return EventListSchema.parse(await res.json());
  },
});
```

### 스토리텔링 우선
- **카피가 차트만큼 중요.** 모든 차트에는 한 줄 요약 캡션 필수.
  - 나쁜 예: "차트 1: 고래 전송량"
  - 좋은 예: "FTX 파산 3일 전, 거래소로 들어간 ETH가 평소의 4.2배로 늘었다"
- 블록체인 용어 풀어쓰기:
  - ❌ "온체인 트랜잭션", "ERC-20 토큰", "EOA", "스마트 컨트랙트"
  - ✅ "지갑 간 송금", "스테이블코인", "지갑", "(필요하면) 자동 실행 계약"
- 첫 방문자를 위한 1줄 설명을 메인 화면 상단에:
  > "암호화폐 시장이 흔들릴 때, 큰 지갑(고래)들은 무엇을 했을까?"

### 시각화 원칙
- 색상은 의미를 가져야 함:
  - 빨강 계열 = `crash` / `crisis`
  - 초록 계열 = `rally`
  - 노랑 계열 = `mania`
  - 파랑 계열 = `regulation`
- 한국 이벤트는 별도 표식(예: 점선 테두리 또는 🇰🇷 아이콘).
- 모바일 대응은 "최소한의 가독성"만 (PRD FR-3.5). 데스크톱 우선.

### 상태 관리
- 서버 상태: TanStack Query.
- URL 상태: 이벤트 선택은 `?event=ftx_collapse` 쿼리 파라미터로 (공유 가능한 링크).
- 로컬 UI 상태: useState (Redux/Zustand 도입 금지 — 과한 복잡도).

### 접근성 (가벼운 수준)
- 모든 인터랙티브 요소에 `aria-label` 또는 시각적 텍스트.
- 키보드로 이벤트 탐색 가능 (Tab → Enter).
- 차트 색상은 대비 4.5:1 이상 (Tailwind 기본 팔레트면 대부분 OK).

## Verification

```bash
pnpm --filter web install
pnpm --filter web lint
pnpm --filter web typecheck
pnpm --filter web test
pnpm --filter web build              # 프로덕션 빌드 통과

# 수동 시각 확인
pnpm --filter api dev &
pnpm --filter web dev &
# 브라우저로 http://localhost:5173 열고:
# - 메인 화면에 21개 이벤트 마커 모두 보이는지
# - "FTX 파산" 클릭 → 사이드 패널에 윈도우 차트 + 뉴스 N개
# - "한국 섹터" 탭 → 6개 이벤트만 표시
# - 카테고리 비교 뷰 작동
```

## DoD 체크 (PRD §4와 일치)

- [ ] 21개 이벤트 모두 메인 타임라인에 마커로 표시.
- [ ] 임의 이벤트 클릭 시 윈도우 차트가 1초 이내에 렌더.
- [ ] 거래소 입금/출금 방향 차트 최소 1개.
- [ ] 페이지 첫 로딩 3초 이내 (Lighthouse 측정).
- [ ] 블록체인 비전공 동료 1명에게 5분 안에 "이게 뭘 보여주는지" 설명되는지 테스트 (수업 시연 전 필수).

## Common Pitfalls

- TanStack Query의 `staleTime` 미설정 → 같은 데이터 반복 fetch. 5분(300_000ms) 권장.
- Recharts는 반응형 컨테이너(`<ResponsiveContainer>`) 안에 넣지 않으면 사이즈 0.
- 21개 이벤트 마커가 한 차트에 겹치면 시각적 혼잡. 카테고리별 색 + hover로 그룹 분리.
- `event.event_date` (DB는 UTC) → 사용자 로컬 시간대로 표시할 때 하루 어긋날 수 있음. UTC로 일관 표시 권장 (또는 KST 명시).
- 차트 라이브러리에 NUMERIC 문자열을 그대로 넘기면 NaN. `Number(value)` 변환 필수.

## Handoff to User (최종 단계)

이 단계가 완료되면 프로젝트 완료. `.ref/HANDOFF.md`는 사용자에게 시연용 안내서로 작성.

```markdown
# HANDOFF
> From: Frontend → To: User (시연 안내)

## How to demo
1. docker compose up -d db
2. pnpm install && cd pipelines && uv sync
3. pnpm --filter api migrate && python -m pipelines.run_all && python -m pipelines.crawl.jobs.collect
4. pnpm dev
5. http://localhost:5173 열기

## Demo script (5분)
1. 메인 화면 — 전체 기간 고래 활동 + 이벤트 마커
2. "FTX 파산" 클릭 → 사이드 패널 — "보세요, 파산 3일 전부터 거래소 입금이..."
3. "이벤트 비교" 탭 → "폭락 vs 호재 평균 패턴 차이"
4. "한국 섹터" 탭 → "김치프리미엄 시기 한국 거래소만의 독특한 패턴"

## Known limitations
- 모바일 화면 < 768px에서는 사이드 패널 대신 모달.
- IE/구형 Safari 미지원 (학교 과제 범위 외).
```