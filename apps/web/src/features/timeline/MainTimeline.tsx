import { Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import type { z } from 'zod'
import { SectionCard } from '../../components/SectionCard'
import { categoryColor, formatCompactNumber } from '../../lib/format'
import type { eventSchema, whaleFlowSchema } from '../../api/schemas'

type EventRecord = z.infer<typeof eventSchema>
type WhaleFlow = z.infer<typeof whaleFlowSchema>

export function MainTimeline({
  events,
  whaleFlows,
  selectedEventId,
  buildHref,
  onSelectEvent
}: {
  events: EventRecord[]
  whaleFlows: WhaleFlow[]
  selectedEventId: string | null
  buildHref: (eventId: string) => string
  onSelectEvent: (eventId: string) => void
}) {
  const chartData = whaleFlows.map((row) => ({
    weekStart: row.weekStart,
    totalVolumeUsd: Number(row.totalVolumeUsd)
  }))

  const eventLabel = (event: EventRecord) => `${event.region === 'kr' ? '🇰🇷 ' : ''}${event.nameKo}`

  return (
    <SectionCard
      title="큰 지갑 활동 타임라인"
      eyebrow="Main timeline"
    >
      <p className="mb-4 text-sm text-slate-300">
        암호화폐 시장이 흔들릴 때, 큰 지갑(고래)들은 무엇을 했을까? 아래 선 위에 표시된 사건을 눌러
        그 주의 움직임과 뉴스 반응을 함께 볼 수 있다.
      </p>
      <div className="h-[380px] w-full">
        <ResponsiveContainer>
          <LineChart data={chartData} margin={{ top: 16, right: 24, bottom: 16, left: 0 }}>
            <XAxis dataKey="weekStart" minTickGap={36} tick={{ fill: '#cbd5e1', fontSize: 12 }} />
            <YAxis
              tickFormatter={(value) => formatCompactNumber(Number(value))}
              tick={{ fill: '#cbd5e1', fontSize: 12 }}
            />
            <Tooltip formatter={(value: number) => [`$${formatCompactNumber(value)}`, '주간 고래 송금']} />
            <Line type="monotone" dataKey="totalVolumeUsd" stroke="#38bdf8" strokeWidth={2} dot={false} />
            {events.map((event) => (
              <ReferenceLine
                key={event.id}
                x={event.eventDate}
                stroke={categoryColor(event.category)}
                strokeDasharray={event.region === 'kr' ? '3 3' : '6 4'}
                label={{
                  value: event.id === selectedEventId ? eventLabel(event) : '',
                  position: 'top',
                  fill: '#f8fafc',
                  fontSize: 10
                }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 grid gap-2 md:grid-cols-3 xl:grid-cols-4">
        {events.map((event) => (
          <a
            key={event.id}
            href={buildHref(event.id)}
            aria-label={`${event.nameKo} 보기`}
            onClick={(clickEvent) => {
              clickEvent.preventDefault()
              onSelectEvent(event.id)
            }}
            className={`rounded-2xl border px-3 py-2 text-left transition ${
              selectedEventId === event.id
                ? 'border-sky-400 bg-sky-500/10'
                : 'border-slate-700 bg-slate-950/40 hover:border-slate-500'
            }`}
          >
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{event.eventDate}</div>
            <div className="mt-1 text-sm font-semibold text-slate-100">{eventLabel(event)}</div>
          </a>
        ))}
      </div>
    </SectionCard>
  )
}
