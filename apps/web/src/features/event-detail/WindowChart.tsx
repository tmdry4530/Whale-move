import { Area, Bar, CartesianGrid, ComposedChart, Line, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { z } from 'zod'

import type { eventWindowSchema } from '../../api/schemas'
import { formatCompactNumber } from '../../lib/format'

type EventWindow = z.infer<typeof eventWindowSchema>

export function WindowChart({ rows }: { rows: EventWindow[] }) {
  const data = rows.map((row) => ({
    ...row,
    whaleVolumeUsdNumber: row.whaleVolumeUsd ? Number(row.whaleVolumeUsd) : null,
    cexInflowUsdNumber: row.cexInflowUsd ? Number(row.cexInflowUsd) : null,
    cexOutflowUsdNumber: row.cexOutflowUsd ? Number(row.cexOutflowUsd) : null,
    fearGreedValueNumber: row.fearGreedValue,
    newsVolumeNumber: row.newsVolume
  }))

  const hasWhaleData = data.some((row) => row.whaleVolumeUsdNumber !== null)
  const hasInflowData = data.some((row) => row.cexInflowUsdNumber !== null)
  const hasOutflowData = data.some((row) => row.cexOutflowUsdNumber !== null)
  const hasFearGreedData = data.some((row) => row.fearGreedValueNumber !== null)
  const hasNewsVolumeData = data.some((row) => row.newsVolumeNumber > 0)
  const missingSeriesCount = [hasInflowData, hasOutflowData, hasFearGreedData].filter((value) => !value).length

  return (
    <div className="h-[360px] w-full border border-brand-border bg-[#111319] p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-sm font-body">
        {hasWhaleData ? (
          <span className="inline-flex items-center gap-2 border border-sky-300/40 bg-sky-300/10 px-3 py-1 text-sky-100">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-300" />
            고래 송금
          </span>
        ) : null}
        {hasInflowData ? (
          <span className="inline-flex items-center gap-2 border border-amber-300/40 bg-amber-300/10 px-3 py-1 text-amber-100">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
            거래소 입금
          </span>
        ) : null}
        {hasOutflowData ? (
          <span className="inline-flex items-center gap-2 border border-emerald-300/40 bg-emerald-300/10 px-3 py-1 text-emerald-100">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
            거래소 출금
          </span>
        ) : null}
        {hasFearGreedData ? (
          <span className="inline-flex items-center gap-2 border border-fuchsia-300/40 bg-fuchsia-300/10 px-3 py-1 text-fuchsia-100">
            <span className="h-2.5 w-2.5 rounded-full bg-fuchsia-300" />
            공포·탐욕 지수
          </span>
        ) : null}
        {hasNewsVolumeData ? (
          <span className="inline-flex items-center gap-2 border border-slate-300/30 bg-slate-300/10 px-3 py-1 text-slate-100">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            뉴스 볼륨
          </span>
        ) : null}
      </div>
      <div className="mb-3 flex flex-wrap gap-2 text-xs font-body text-brand-muted">
        <span className="border border-brand-border bg-brand-surface px-3 py-1">왼쪽 회색 음영 = 사건 전 7일 평균 비교 구간</span>
        <span className="border border-brand-border bg-brand-surface px-3 py-1">오른쪽 회색 음영 = 사건 후 7일 반응 구간</span>
        {missingSeriesCount > 0 ? (
          <span className="border border-yellow-300/40 bg-yellow-300/10 px-3 py-1 text-yellow-100">
            일부 지표는 해당 시기 원천 데이터가 없어 그래프에서 숨겨졌다
          </span>
        ) : null}
      </div>
      <div className="overflow-x-auto">
        <div className="h-[260px] min-w-[640px] w-full">
          <ResponsiveContainer>
            <ComposedChart data={data}>
          <CartesianGrid stroke="rgba(255, 255, 255, 0.14)" strokeDasharray="3 3" />
          <ReferenceArea x1={-7} x2={-1} yAxisId="usd" fill="rgba(255,255,255,0.04)" fillOpacity={1} />
          <ReferenceArea x1={1} x2={7} yAxisId="usd" fill="rgba(255,255,255,0.02)" fillOpacity={1} />
          <ReferenceLine x={0} yAxisId="usd" stroke="rgba(250, 204, 21, 0.9)" strokeWidth={2} label={{ value: '이벤트일', position: 'insideTopRight', fill: '#fde68a', fontSize: 11, fontFamily: 'var(--font-body)' }} />
          <XAxis
            dataKey="dayOffset"
            tick={{ fill: 'rgba(255, 255, 255, 0.88)', fontFamily: 'var(--font-body)' }}
            stroke="rgba(255, 255, 255, 0.28)"
          />
          <YAxis
            yAxisId="usd"
            tick={{ fill: 'rgba(255, 255, 255, 0.88)', fontFamily: 'var(--font-body)' }}
            tickFormatter={(value) => formatCompactNumber(Number(value))}
            stroke="rgba(255, 255, 255, 0.28)"
          />
          {hasFearGreedData ? (
            <YAxis
              yAxisId="fg"
              orientation="right"
              tick={{ fill: 'rgba(255, 255, 255, 0.88)', fontFamily: 'var(--font-body)' }}
              domain={[0, 100]}
              stroke="rgba(255, 255, 255, 0.28)"
            />
          ) : null}
          {hasNewsVolumeData ? (
            <YAxis
              yAxisId="news"
              orientation="right"
              hide
              allowDecimals={false}
            />
          ) : null}
          <Tooltip
            contentStyle={{ backgroundColor: '#0b0d12', border: '1px solid rgba(255, 255, 255, 0.24)', borderRadius: 0, fontFamily: 'var(--font-body)', color: '#fff' }}
            formatter={(value, name) =>
              value == null
                ? '데이터 없음'
                : name === '공포·탐욕 지수'
                  ? `${value}`
                  : name === '뉴스 볼륨'
                    ? `${value}건`
                  : `$${formatCompactNumber(Number(value))}`
            }
          />
          {hasNewsVolumeData ? <Bar yAxisId="news" dataKey="newsVolumeNumber" fill="rgba(226, 232, 240, 0.32)" name="뉴스 볼륨" barSize={16} /> : null}
          {hasWhaleData ? <Area yAxisId="usd" type="monotone" dataKey="whaleVolumeUsdNumber" fill="rgba(56, 189, 248, 0.16)" stroke="#38bdf8" strokeWidth={2.6} name="고래 송금" /> : null}
          {hasInflowData ? <Bar yAxisId="usd" dataKey="cexInflowUsdNumber" fill="#f59e0b" name="거래소 입금" /> : null}
          {hasOutflowData ? <Bar yAxisId="usd" dataKey="cexOutflowUsdNumber" fill="#10b981" name="거래소 출금" /> : null}
          {hasFearGreedData ? <Line yAxisId="fg" type="monotone" dataKey="fearGreedValueNumber" stroke="#e879f9" strokeWidth={2.4} dot={{ r: 2 }} name="공포·탐욕 지수" /> : null}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
