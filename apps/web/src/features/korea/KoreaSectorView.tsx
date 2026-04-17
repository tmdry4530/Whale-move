import type { z } from 'zod'

import { SectionCard } from '../../components/SectionCard'
import type { eventSchema } from '../../api/schemas'

type EventRecord = z.infer<typeof eventSchema>

export function KoreaSectorView({
  events,
  onSelectEvent,
  buildHref
}: {
  events: EventRecord[]
  onSelectEvent: (eventId: string) => void
  buildHref: (eventId: string) => string
}) {
  const koreaEvents = events.filter((event) => event.region === 'kr')

  return (
    <SectionCard title="한국 섹터" eyebrow="Korea view">
      <p className="mb-4 text-sm text-slate-300">
        한국 이벤트 6개만 따로 모아 보면, 김치프리미엄이나 규제 발표처럼 국내 맥락에서 움직인 장면을 빠르게 읽을 수 있다.
      </p>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {koreaEvents.map((event) => (
          <a
            key={event.id}
            href={buildHref(event.id)}
            className="rounded-2xl border border-slate-700 bg-slate-950/50 p-4 text-left hover:border-sky-400"
            onClick={(clickEvent) => {
              clickEvent.preventDefault()
              onSelectEvent(event.id)
            }}
          >
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{event.eventDate}</div>
            <div className="mt-2 text-lg font-semibold text-white">🇰🇷 {event.nameKo}</div>
            <p className="mt-2 text-sm text-slate-300">{event.description}</p>
          </a>
        ))}
      </div>
    </SectionCard>
  )
}
