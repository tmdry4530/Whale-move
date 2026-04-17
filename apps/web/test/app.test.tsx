import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PropsWithChildren } from 'react'
import { eventWeekLabel, startOfWeek } from '../src/lib/timeline'

function createMockComponent(label: string) {
  return function MockComponent({ children }: PropsWithChildren) {
    return <div data-testid={label}>{children}</div>
  }
}

const eventYears = [
  '2017', '2017', '2019', '2020', '2020', '2021',
  '2021', '2021', '2021', '2022', '2022', '2022',
  '2022', '2022', '2023', '2024', '2024', '2024',
  '2025', '2025', '2025'
]

const events = Array.from({ length: 21 }, (_, index) => ({
  id: index === 0 ? 'ftx_collapse' : `event_${index + 1}`,
  nameKo: index === 0 ? 'FTX 파산' : `이벤트 ${index + 1}`,
  nameEn: index === 0 ? 'FTX Collapse' : `Event ${index + 1}`,
  eventDate: `${eventYears[index]}-11-${String((index % 28) + 1).padStart(2, '0')}`,
  category: index % 4 === 0 ? 'crisis' : index % 4 === 1 ? 'rally' : index % 4 === 2 ? 'mania' : 'regulation',
  region: index < 6 ? 'kr' : 'global',
  description: index === 0 ? '세계 2위 거래소 FTX가 유동성 위기로 파산 신청.' : `설명 ${index + 1}`,
  sourceUrl: `https://example.com/${index + 1}`
}))

const whaleFlows = [
  {
    weekStart: '2022-11-07',
    asset: 'ETH',
    transferCount: '10',
    totalVolumeNative: '100',
    totalVolumeUsd: '1000000'
  }
]

const baseWindow = Array.from({ length: 15 }, (_, index) => ({
  dayOffset: index - 7,
  date: `2022-11-${String(index + 1).padStart(2, '0')}`,
  whaleVolumeUsd: '100',
  cexInflowUsd: '50',
  cexOutflowUsd: '25',
  ethPriceUsd: '1200',
  btcPriceUsd: '18000',
  fearGreedValue: 20
}))

vi.mock('../src/api/endpoints', () => ({
  useEvents: () => ({ isLoading: false, isError: false, data: events }),
  useWhaleFlows: () => ({ isLoading: false, isError: false, data: whaleFlows }),
  useEventWindow: (eventId: string | null) => ({
    isLoading: false,
    isError: false,
    data:
      eventId === null
        ? undefined
        : {
            event: events.find((event) => event.id === eventId) ?? events[0],
            window: baseWindow
          }
  }),
  useEventNews: (eventId: string | null) => ({
    isLoading: false,
    isError: false,
    data:
      eventId === 'event_2'
        ? [{ id: '2', source: 'coindesk', url: 'https://example.com/news2', title: '이벤트 2 뉴스', summary: '요약2', publishedAt: null, language: 'en' }]
        : [{ id: '1', source: 'coindesk', url: 'https://example.com/news', title: 'FTX 뉴스', summary: '요약', publishedAt: null, language: 'en' }]
  }),
  useFearGreed: () => ({ isLoading: false, isError: false, data: [] }),
  useCategoryWindows: () => []
}))

vi.mock('recharts', () => ({
  ResponsiveContainer: createMockComponent('responsive-container'),
  LineChart: createMockComponent('line-chart'),
  Line: createMockComponent('line'),
  ReferenceArea: createMockComponent('reference-area'),
  ReferenceLine: createMockComponent('reference-line'),
  Tooltip: createMockComponent('tooltip'),
  XAxis: createMockComponent('x-axis'),
  YAxis: createMockComponent('y-axis'),
  Area: createMockComponent('area'),
  Bar: createMockComponent('bar'),
  CartesianGrid: createMockComponent('cartesian-grid'),
  ComposedChart: createMockComponent('composed-chart'),
  Legend: createMockComponent('legend'),
  BarChart: createMockComponent('bar-chart')
}))

import App from '../src/App'

beforeEach(() => {
  window.history.replaceState({}, '', '/?tab=timeline&event=ftx_collapse')
})

afterEach(() => {
  cleanup()
})

describe('App', () => {
  it('renders the timeline and detail view with all events by default', () => {
    render(<App />)

    expect(screen.getByText('시장이 흔들릴 때, 큰 지갑은 무엇을 했을까?')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'FTX 파산' })).toBeInTheDocument()
    expect(screen.getByText('그때 나온 헤드라인')).toBeInTheDocument()
    expect(screen.getByText('FTX 뉴스')).toBeInTheDocument()
    expect(screen.getByText('전체 21개 사건')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /보기$/ }).length).toBe(21)
  })

  it('filters events by year and restores the full list', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: '2024' }))
    expect(screen.getByText('2024년 사건 3개')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /보기$/ }).length).toBe(3)

    fireEvent.click(screen.getByRole('button', { name: '전체' }))
    expect(screen.getByText('전체 21개 사건')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /보기$/ }).length).toBe(21)
  })

  it('shows the six korean events in the korea tab', () => {
    window.history.replaceState({}, '', '/?tab=korea&event=ftx_collapse')
    render(<App />)

    expect(screen.getByRole('heading', { name: '한국 섹터' })).toBeInTheDocument()
    expect(screen.getAllByText(/^🇰🇷/).length).toBe(6)
  })

  it('updates the detail panel immediately when another event is selected', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('link', { name: '이벤트 2 보기' }))
    expect(window.location.search).toContain('event=event_2')
    expect(screen.getByRole('heading', { name: '이벤트 2' })).toBeInTheDocument()
    expect(screen.getByText('이벤트 2 뉴스')).toBeInTheDocument()
  })

  it('maps event dates into weekly chart buckets', () => {
    expect(startOfWeek('2022-05-09')).toBe('2022-05-09')
    expect(startOfWeek('2022-11-11')).toBe('2022-11-07')
    expect(eventWeekLabel('2022-11-11')).toBe('2022-11-07 ~ 2022-11-13')
  })
})
