import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { z } from 'zod'

import { SectionCard } from '../../components/SectionCard'
import { useCategoryWindows } from '../../api/endpoints'
import type { eventSchema } from '../../api/schemas'
import {
  buildCategoryComparisonData,
  buildRegionComparisonData
} from '../../lib/eventAnalysis'

type EventRecord = z.infer<typeof eventSchema>

const comparisonHypotheses = [
  {
    id: 'h1',
    title: '가설 1',
    summary: '위기·폭락 이벤트는 사건일 거래소 입금이 가장 크게 튄다.'
  },
  {
    id: 'h2',
    title: '가설 2',
    summary: '호재 이벤트는 거래소 출금이 입금보다 강하게 반응한다.'
  },
  {
    id: 'h3',
    title: '가설 3',
    summary: '위기·폭락 카테고리에서는 입금과 출금이 함께 커져 자금 재배치가 나타난다.'
  },
  {
    id: 'h4',
    title: '가설 4',
    summary: '사건 후 7일 가격 변화는 시장이 사건을 어떻게 해석했는지 보여준다.'
  },
  {
    id: 'h5',
    title: '가설 5',
    summary: '한국 이벤트는 글로벌 이벤트보다 변화폭이 완만하다.'
  }
]

function ComparisonChart({
  title,
  description,
  data
}: {
  title: string
  description: string
  data: Array<{
    label: string
    whaleChangePct: number
    inflowChangePct: number
    outflowChangePct: number
    priceChangePct: number
  }>
}) {
  return (
    <div className="border border-brand-border bg-[#10141d] p-4">
      <h3 className="text-lg font-body text-brand-text">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-brand-muted font-body">{description}</p>
      <div className="mt-4 overflow-x-auto">
        <div className="h-[300px] min-w-[640px] w-full">
          <ResponsiveContainer>
            <BarChart data={data}>
            <CartesianGrid stroke="rgba(255, 255, 255, 0.1)" strokeDasharray="3 3" />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.25)" />
            <XAxis dataKey="label" tick={{ fill: 'rgba(255, 255, 255, 0.65)', fontFamily: 'var(--font-body)' }} />
            <YAxis tick={{ fill: 'rgba(255, 255, 255, 0.65)', fontFamily: 'var(--font-body)' }} tickFormatter={(value) => `${Number(value).toFixed(0)}%`} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0b0d12', border: '1px solid rgba(255, 255, 255, 0.24)', borderRadius: 0, fontFamily: 'var(--font-body)', color: '#fff' }}
              formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name]}
            />
            <Bar dataKey="inflowChangePct" fill="#f59e0b" name="입금 변화율" />
            <Bar dataKey="outflowChangePct" fill="#10b981" name="출금 변화율" />
            <Bar dataKey="whaleChangePct" fill="#38bdf8" name="고래 송금 변화율" />
            <Bar dataKey="priceChangePct" fill="#e879f9" name="사건 후 7일 ETH 변화율" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export function CategoryCompareView({ events }: { events: EventRecord[] }) {
  const eventIds = events.map((event) => event.id)
  const queries = useCategoryWindows(eventIds)
  const hasLoading = queries.some((query) => query.isLoading)
  const hasError = queries.some((query) => query.isError)
  const responses = queries
    .map((query) => query.data)
    .filter((response): response is NonNullable<(typeof queries)[number]['data']> => Boolean(response))

  const categoryData = buildCategoryComparisonData(responses)
  const regionData = buildRegionComparisonData(responses)

  return (
    <SectionCard title="가설 검증 비교실" eyebrow="이벤트 비교">
      <p className="mb-6 text-base text-brand-muted font-body leading-relaxed">
        이 탭은 사건 하나를 자세히 보는 대신, 여러 사건을 평균내어 가설이 전체적으로도 반복되는지 확인하는 곳이다.
        노란·초록·파란 막대는 <span className="font-semibold text-brand-text">사건 전 7일 평균 대비 사건일 변화율</span>,
        보라 막대는 <span className="font-semibold text-brand-text">사건 전 7일 평균 대비 사건 후 7일 가격 변화율</span>을 뜻한다.
      </p>
      <p className="mb-6 text-sm leading-relaxed text-brand-muted font-body">
        모바일에서는 비교 차트를 좌우로 밀어 보면 카테고리 레이블과 막대 간격을 더 편하게 읽을 수 있다.
      </p>

      {hasLoading ? (
        <div className="mb-6 border border-brand-border bg-brand-surface p-4 text-sm leading-relaxed text-brand-muted font-body">
          비교용 이벤트 윈도우를 모으는 중이다. 아직 일부 사건만 반영됐을 수 있다.
        </div>
      ) : null}

      {hasError ? (
        <div className="mb-6 border border-red-300/40 bg-red-300/10 p-4 text-sm leading-relaxed text-red-100 font-body">
          일부 비교 데이터가 비어 있어 평균 막대가 부분 집계로 보일 수 있다.
        </div>
      ) : null}

      <div className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {comparisonHypotheses.map((item) => (
          <article key={item.id} className="border border-brand-border bg-brand-surface p-4">
            <div className="font-display text-[12px] uppercase tracking-[1px] text-brand-muted">{item.title}</div>
            <p className="mt-2 text-base leading-relaxed text-brand-text font-body">{item.summary}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ComparisonChart
          title="카테고리별 사건일 변화율"
          description="폭락·위기·호재·과열·규제 이벤트를 평균낸 뒤, 거래소 입금·출금·고래 송금이 얼마나 튀었는지 비교했다."
          data={categoryData}
        />
        <ComparisonChart
          title="지역별 사건일 변화율"
          description="글로벌 사건과 한국 사건을 나눠 보면, 어느 쪽이 더 큰 온체인 재배치를 만드는지 읽을 수 있다."
          data={regionData}
        />
      </div>

      <div className="mt-4 border border-brand-border bg-brand-surface p-4">
        <div className="font-display text-[12px] uppercase tracking-[1px] text-brand-muted">읽는 법</div>
        <p className="mt-2 text-sm leading-relaxed text-brand-muted font-body">
          노란 막대는 거래소 입금, 초록 막대는 거래소 출금, 파란 막대는 고래 송금, 보라 막대는 사건 후 7일 ETH 변화율이다.
          0% 위로 올라갈수록 사건일 또는 사건 이후 반응이 평소보다 강했다는 뜻이고, 아래로 내려가면 평소보다 약했다는 뜻이다.
        </p>
      </div>
    </SectionCard>
  )
}
