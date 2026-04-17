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
          <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
          <XAxis dataKey="dayOffset" tick={{ fill: '#cbd5e1' }} />
          <YAxis yAxisId="usd" tick={{ fill: '#cbd5e1' }} tickFormatter={(value) => formatCompactNumber(Number(value))} />
          <YAxis yAxisId="fg" orientation="right" tick={{ fill: '#94a3b8' }} domain={[0, 100]} />
          <Tooltip
            formatter={(value) =>
              value == null ? '데이터 없음' : `$${formatCompactNumber(Number(value))}`
            }
          />
          <Legend />
          <Area yAxisId="usd" type="monotone" dataKey="whaleVolumeUsdNumber" fill="#0ea5e9" stroke="#38bdf8" name="고래 송금" />
          <Bar yAxisId="usd" dataKey="cexInflowUsdNumber" fill="#ef4444" name="거래소 입금" />
          <Bar yAxisId="usd" dataKey="cexOutflowUsdNumber" fill="#22c55e" name="거래소 출금" />
          <Line yAxisId="fg" type="monotone" dataKey="fearGreedValueNumber" stroke="#facc15" dot={false} name="공포·탐욕 지수" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
