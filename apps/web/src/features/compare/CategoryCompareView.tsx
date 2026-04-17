import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { z } from 'zod'

import { SectionCard } from '../../components/SectionCard'
import { useCategoryWindows } from '../../api/endpoints'
import type { eventSchema } from '../../api/schemas'
import { formatCompactNumber } from '../../lib/format'

type EventRecord = z.infer<typeof eventSchema>

export function CategoryCompareView({ events }: { events: EventRecord[] }) {
  const crashEvents = events.filter((event) => ['crash', 'crisis'].includes(event.category)).map((event) => event.id)
  const rallyEvents = events.filter((event) => event.category === 'rally').map((event) => event.id)
  const maniaEvents = events.filter((event) => event.category === 'mania').map((event) => event.id)
  const regulationEvents = events.filter((event) => event.category === 'regulation').map((event) => event.id)
  const queries = useCategoryWindows([...crashEvents, ...rallyEvents, ...maniaEvents, ...regulationEvents])

  const grouped = new Map<string, number[]>()
  queries.forEach((query) => {
    if (!query.data) return
    const category = query.data.event.category
    const average = query.data.window.reduce((sum, row) => sum + Number(row.whaleVolumeUsd ?? '0'), 0) / query.data.window.length
    const bucket = grouped.get(category) ?? []
    bucket.push(average)
    grouped.set(category, bucket)
  })

  const chartData = Array.from(grouped.entries()).map(([category, values]) => ({
    category,
    avgWhaleVolumeUsd: values.reduce((sum, value) => sum + value, 0) / values.length
  }))

  return (
    <SectionCard title="이벤트 유형별 평균 반응" eyebrow="Compare view">
      <p className="mb-4 text-sm text-slate-300">
        폭락, 호재, 규제, 과열 이벤트를 평균내 보면 어떤 종류의 사건에서 큰 지갑이 더 크게 움직였는지 비교할 수 있다.
      </p>
      <div className="h-[280px] w-full">
        <ResponsiveContainer>
          <BarChart data={chartData}>
            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
            <XAxis dataKey="category" tick={{ fill: '#cbd5e1' }} />
            <YAxis tick={{ fill: '#cbd5e1' }} tickFormatter={(value) => formatCompactNumber(Number(value))} />
            <Tooltip formatter={(value: number) => `$${formatCompactNumber(value)}`} />
            <Bar dataKey="avgWhaleVolumeUsd" fill="#a855f7" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  )
}
