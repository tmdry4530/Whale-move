import { SectionCard } from '../../components/SectionCard'
import { formatUsdString } from '../../lib/format'
import { useEventNews, useEventWindow } from '../../api/endpoints'
import { NewsList } from './NewsList'
import { WindowChart } from './WindowChart'

export function EventDetailPanel({ eventId }: { eventId: string | null }) {
  const windowQuery = useEventWindow(eventId)
  const newsQuery = useEventNews(eventId)

  if (eventId === null) {
    return (
      <SectionCard title="이벤트 디테일" eyebrow="Detail panel">
        <p className="text-sm text-slate-300">타임라인에서 사건을 선택하면 당시의 송금 흐름과 뉴스 헤드라인을 볼 수 있다.</p>
      </SectionCard>
    )
  }

  if (windowQuery.isLoading || newsQuery.isLoading) {
    return <SectionCard title="이벤트 디테일" eyebrow="Detail panel"><p className="text-sm text-slate-300">불러오는 중...</p></SectionCard>
  }

  if (windowQuery.isError || newsQuery.isError || !windowQuery.data) {
    return <SectionCard title="이벤트 디테일" eyebrow="Detail panel"><p className="text-sm text-rose-300">이벤트 데이터를 가져오지 못했다.</p></SectionCard>
  }

  const event = windowQuery.data.event
  const peakInflow = [...windowQuery.data.window]
    .map((row) => Number(row.cexInflowUsd ?? '0'))
    .sort((a, b) => b - a)[0] ?? 0

  return (
    <SectionCard title={event.nameKo} eyebrow="Detail panel">
      <p className="text-sm text-slate-300">{event.description}</p>
      <p className="mt-3 rounded-2xl bg-slate-950/60 p-3 text-sm text-sky-100">
        {event.nameKo} 전후 7일 동안 거래소로 들어간 자금의 최대치는 {formatUsdString(String(peakInflow.toFixed(2)))}였다.
      </p>
      <div className="mt-4">
        <WindowChart rows={windowQuery.data.window} />
      </div>
      <div className="mt-4">
        <h3 className="mb-3 text-lg font-semibold text-white">그때 나온 헤드라인</h3>
        <NewsList items={newsQuery.data ?? []} />
      </div>
    </SectionCard>
  )
}
