import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from '../src/App'

const events = Array.from({ length: 21 }, (_, index) => ({
  id: index === 0 ? 'ftx_collapse' : `event_${index + 1}`,
  nameKo: index === 0 ? 'FTX 파산' : `이벤트 ${index + 1}`,
  nameEn: index === 0 ? 'FTX Collapse' : `Event ${index + 1}`,
  eventDate: `2022-11-${String((index % 28) + 1).padStart(2, '0')}`,
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

const windowPayload = {
  event: events[0],
  window: Array.from({ length: 15 }, (_, index) => ({
    dayOffset: index - 7,
    date: `2022-11-${String(index + 1).padStart(2, '0')}`,
    whaleVolumeUsd: '100',
    cexInflowUsd: '50',
    cexOutflowUsd: '25',
    ethPriceUsd: '1200',
    btcPriceUsd: '18000',
    fearGreedValue: 20
  }))
}

const newsPayload = [
  {
    id: '1',
    source: 'coindesk',
    url: 'https://example.com/news',
    title: 'FTX 뉴스',
    summary: '요약',
    publishedAt: null,
    language: 'en'
  }
]

beforeEach(() => {
  window.history.replaceState({}, '', '/?tab=timeline&event=ftx_collapse')
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    const payload = url.includes('/api/events/event_2/window')
      ? {
          event: events[1],
          window: windowPayload.window
        }
      : url.includes('/api/events/ftx_collapse/window')
        ? windowPayload
        : url.includes('/api/events/event_2/news')
          ? [{ ...newsPayload[0], id: '2', title: '이벤트 2 뉴스' }]
          : url.includes('/api/events/ftx_collapse/news')
            ? newsPayload
            : url.includes('/api/whale-flows')
              ? whaleFlows
              : events
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }))
})

afterEach(() => {
  cleanup()
})

describe('App', () => {
  it('renders hero copy and timeline/detail content', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <App />
      </QueryClientProvider>
    )

    expect(screen.getByText('시장이 흔들릴 때, 큰 지갑은 무엇을 했을까?')).toBeInTheDocument()
    await screen.findByText('그때 나온 헤드라인', {}, { timeout: 5000 })
    expect(screen.getByText('FTX 뉴스')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /보기$/ }).length).toBe(21)
  })

  it('shows only six korean events in korea view', async () => {
    window.history.replaceState({}, '', '/?tab=korea&event=ftx_collapse')
    render(
      <QueryClientProvider client={new QueryClient()}>
        <App />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '한국 섹터' })).toBeInTheDocument()
      expect(screen.getAllByText(/^🇰🇷/).length).toBe(6)
    })
  })

  it('updates detail panel immediately when a different event button is clicked', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <App />
      </QueryClientProvider>
    )

    await screen.findByText('그때 나온 헤드라인', {}, { timeout: 5000 })
    fireEvent.click(screen.getByRole('link', { name: '이벤트 2 보기' }))

    await waitFor(() => {
      expect(window.location.search).toContain('event=event_2')
      expect(screen.getByRole('heading', { name: '이벤트 2' })).toBeInTheDocument()
      expect(screen.getByText('이벤트 2 뉴스')).toBeInTheDocument()
    })
  })
})
