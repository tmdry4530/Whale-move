import { Area, Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
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
    fearGreedValueNumber: row.fearGreedValue
  }))

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer>
        <ComposedChart data={data}>
          <CartesianGrid stroke="rgba(255, 255, 255, 0.12)" strokeDasharray="3 3" />
          <XAxis
            dataKey="dayOffset"
            tick={{ fill: 'rgba(255, 255, 255, 0.82)', fontFamily: 'var(--font-body)' }}
            stroke="rgba(255, 255, 255, 0.2)"
          />
          <YAxis
            yAxisId="usd"
            tick={{ fill: 'rgba(255, 255, 255, 0.82)', fontFamily: 'var(--font-body)' }}
            tickFormatter={(value) => formatCompactNumber(Number(value))}
            stroke="rgba(255, 255, 255, 0.2)"
          />
          <YAxis
            yAxisId="fg"
            orientation="right"
            tick={{ fill: 'rgba(255, 255, 255, 0.82)', fontFamily: 'var(--font-body)' }}
            domain={[0, 100]}
            stroke="rgba(255, 255, 255, 0.2)"
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#111319', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: 0, fontFamily: 'var(--font-body)', color: '#fff' }}
            formatter={(value) =>
              value == null ? '데이터 없음' : `$${formatCompactNumber(Number(value))}`
            }
          />
          <Legend wrapperStyle={{ fontFamily: 'var(--font-body)', color: '#fff', paddingTop: 12 }} />
          <Area yAxisId="usd" type="monotone" dataKey="whaleVolumeUsdNumber" fill="rgba(255, 255, 255, 0.16)" stroke="#ffffff" strokeWidth={2.2} name="고래 송금" />
          <Bar yAxisId="usd" dataKey="cexInflowUsdNumber" fill="#9ca3af" name="거래소 입금" />
          <Bar yAxisId="usd" dataKey="cexOutflowUsdNumber" fill="#4b5563" name="거래소 출금" />
          <Line yAxisId="fg" type="monotone" dataKey="fearGreedValueNumber" stroke="#f8fafc" strokeWidth={2} dot={false} name="공포·탐욕 지수" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
