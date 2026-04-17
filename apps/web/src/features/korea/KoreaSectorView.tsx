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
    <SectionCard title="한국 섹터" eyebrow="국내 사건 보기">
      <p className="mb-6 text-base leading-relaxed text-brand-muted font-body">
        한국 이벤트 6개만 따로 모아 보면, 김치프리미엄이나 규제 발표처럼 국내 맥락에서 움직인 장면을 빠르게 읽을 수 있다.
      </p>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {koreaEvents.map((event) => (
          <a
            key={event.id}
            href={buildHref(event.id)}
            className="rounded-none border border-brand-border bg-brand-surface p-[24px] text-left transition-colors hover:border-brand-border-strong hover:bg-brand-surface-hover"
            onClick={(clickEvent) => {
              clickEvent.preventDefault()
              onSelectEvent(event.id)
            }}
          >
            <div className="font-display text-[12px] uppercase tracking-[1px] text-brand-muted">{event.eventDate}</div>
            <div className="mt-4 text-[22px] font-body text-brand-text">🇰🇷 {event.nameKo}</div>
            <p className="mt-2 text-base text-brand-muted font-body leading-relaxed">{event.description}</p>
          </a>
        ))}
      </div>
    </SectionCard>
  )
}
