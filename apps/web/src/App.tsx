import { useEffect, useMemo, useState } from 'react'

import { useEvents, useWhaleFlows } from './api/endpoints'
import { CategoryCompareView } from './features/compare/CategoryCompareView'
import { EventDetailPanel } from './features/event-detail/EventDetailPanel'
import { KoreaSectorView } from './features/korea/KoreaSectorView'
import { MainTimeline } from './features/timeline/MainTimeline'

const tabs = [
  { id: 'timeline', label: '메인 화면' },
  { id: 'compare', label: '이벤트 비교' },
  { id: 'korea', label: '한국 섹터' }
] as const

function useUiState() {
  const readState = (search: string) => {
    const params = new URLSearchParams(search)
    return {
      activeTab: (params.get('tab') ?? 'timeline') as 'timeline' | 'compare' | 'korea',
      selectedEventId: params.get('event')
    }
  }

  const [locationSearch, setLocationSearch] = useState(window.location.search)

  useEffect(() => {
    const handle = () => setLocationSearch(window.location.search)
    window.addEventListener('popstate', handle)
    return () => window.removeEventListener('popstate', handle)
  }, [])

  const state = readState(locationSearch)

  const setState = (next: { tab?: string; event?: string | null }) => {
    const updated = new URLSearchParams(locationSearch)
    updated.set('tab', next.tab ?? state.activeTab)
    if (next.tab !== undefined) {
      updated.set('tab', next.tab as 'timeline' | 'compare' | 'korea')
    }
    if (next.event !== undefined) {
      if (next.event === null) {
        updated.delete('event')
      } else {
        updated.set('event', next.event)
      }
    }
    const nextSearch = `?${updated.toString()}`
    window.history.replaceState({}, '', `${window.location.pathname}${nextSearch}`)
    setLocationSearch(nextSearch)
  }

  return { activeTab: state.activeTab, selectedEventId: state.selectedEventId, setState }
}

function buildQueryHref(next: { tab?: string; event?: string | null }, current: { tab: string; event: string | null }): string {
  const params = new URLSearchParams()
  params.set('tab', next.tab ?? current.tab)
  const eventId = next.event === undefined ? current.event : next.event
  if (eventId !== null) {
    params.set('event', eventId)
  }
  return `?${params.toString()}`
}

export default function App() {
  const { activeTab, selectedEventId, setState } = useUiState()
  const eventsQuery = useEvents()
  const whaleFlowsQuery = useWhaleFlows()

  const body = useMemo(() => {
    if (eventsQuery.isLoading || whaleFlowsQuery.isLoading) {
      return <p className="text-slate-300">대시보드를 준비하는 중...</p>
    }
    if (eventsQuery.isError || whaleFlowsQuery.isError || !eventsQuery.data || !whaleFlowsQuery.data) {
      return <p className="text-rose-300">데이터를 불러오지 못했다. API 상태를 확인해 주세요.</p>
    }

    if (activeTab === 'compare') {
      return <CategoryCompareView events={eventsQuery.data} />
    }
    if (activeTab === 'korea') {
      return (
        <KoreaSectorView
          events={eventsQuery.data}
          buildHref={(eventId) =>
            buildQueryHref({ tab: 'timeline', event: eventId }, { tab: activeTab, event: selectedEventId })
          }
          onSelectEvent={(eventId) => setState({ tab: 'timeline', event: eventId })}
        />
      )
    }

    return (
      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <MainTimeline
          events={eventsQuery.data}
          whaleFlows={whaleFlowsQuery.data}
          selectedEventId={selectedEventId}
          buildHref={(eventId) => buildQueryHref({ tab: 'timeline', event: eventId }, { tab: activeTab, event: selectedEventId })}
          onSelectEvent={(eventId) => setState({ tab: 'timeline', event: eventId })}
        />
        <EventDetailPanel key={selectedEventId ?? 'none'} eventId={selectedEventId} />
      </div>
    )
  }, [activeTab, eventsQuery.data, eventsQuery.isError, eventsQuery.isLoading, selectedEventId, setState, whaleFlowsQuery.data, whaleFlowsQuery.isError, whaleFlowsQuery.isLoading])

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-sky-950 p-6 shadow-2xl shadow-slate-950/40">
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">When Whales Move</div>
          <h1 className="mt-3 text-3xl font-bold text-white md:text-5xl">시장이 흔들릴 때, 큰 지갑은 무엇을 했을까?</h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300 md:text-base">
            복잡한 블록체인 용어 대신, 큰 지갑(고래)의 송금과 거래소 입출금 흐름을 역사적 사건 위에 얹어 보여준다.
            사건 하나를 고르면 그 전후 7일의 자금 이동과 헤드라인을 한눈에 볼 수 있다.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <a
                key={tab.id}
                href={buildQueryHref({ tab: tab.id, event: selectedEventId }, { tab: activeTab, event: selectedEventId })}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${activeTab === tab.id ? 'bg-sky-400 text-slate-950' : 'bg-slate-900 text-slate-200 hover:bg-slate-800'}`}
                onClick={(event) => {
                  event.preventDefault()
                  setState({ tab: tab.id, event: selectedEventId })
                }}
              >
                {tab.label}
              </a>
            ))}
          </div>
        </header>
        {body}
      </div>
    </main>
  )
}
