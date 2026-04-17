import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, fireEvent } from '@testing-library/react'
import { JSDOM } from 'jsdom'
import App from './src/App'

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/?tab=timeline&event=ftx_collapse' })
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  navigator: dom.window.navigator,
  HTMLElement: dom.window.HTMLElement,
  Response: dom.window.Response
})
class ResizeObserverMock { observe(){} unobserve(){} disconnect(){} }
// @ts-expect-error test shim
globalThis.ResizeObserver = ResizeObserverMock

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

// @ts-expect-error test shim
globalThis.fetch = async (input: RequestInfo | URL) => {
  const url = String(input)
  const payload = url.includes('/api/events/event_2/window')
    ? { event: events[1], window: Array.from({length:15}, (_,i)=>({dayOffset:i-7,date:`2022-11-${String(i+1).padStart(2,'0')}`, whaleVolumeUsd:'100',cexInflowUsd:'50',cexOutflowUsd:'25',ethPriceUsd:'1200',btcPriceUsd:'18000',fearGreedValue:20})) }
    : url.includes('/api/events/ftx_collapse/window')
      ? { event: events[0], window: Array.from({length:15}, (_,i)=>({dayOffset:i-7,date:`2022-11-${String(i+1).padStart(2,'0')}`, whaleVolumeUsd:'100',cexInflowUsd:'50',cexOutflowUsd:'25',ethPriceUsd:'1200',btcPriceUsd:'18000',fearGreedValue:20})) }
      : url.includes('/api/events/event_2/news')
        ? [{id:'2',source:'coindesk',url:'https://example.com/news2',title:'이벤트 2 뉴스',summary:'요약2',publishedAt:null,language:'en'}]
        : url.includes('/api/events/ftx_collapse/news')
          ? [{id:'1',source:'coindesk',url:'https://example.com/news',title:'FTX 뉴스',summary:'요약',publishedAt:null,language:'en'}]
          : url.includes('/api/whale-flows')
            ? [{weekStart:'2022-11-07',asset:'ETH',transferCount:'10',totalVolumeNative:'100',totalVolumeUsd:'1000000'}]
            : events
  return new Response(JSON.stringify(payload), { status: 200, headers: { 'Content-Type': 'application/json' } })
}

render(
  <QueryClientProvider client={new QueryClient()}>
    <App />
  </QueryClientProvider>
)

await screen.findByText('그때 나온 헤드라인', {}, { timeout: 5000 })
console.log('before', window.location.search)
fireEvent.click(screen.getByRole('button', { name: '이벤트 2 보기' }))
console.log('after', window.location.search)
await new Promise((resolve)=>setTimeout(resolve, 1500))
console.log('heading', !!screen.queryByRole('heading', { name: '이벤트 2' }))
console.log('news', !!screen.queryByText('이벤트 2 뉴스'))
console.log(document.body.innerHTML.includes('이벤트 2 뉴스'))
