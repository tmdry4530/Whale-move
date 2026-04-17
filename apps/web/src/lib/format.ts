export function formatCompactNumber(value: number | null): string {
  if (value === null || Number.isNaN(value)) return '데이터 없음'
  return new Intl.NumberFormat('ko-KR', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value)
}

export function formatUsdString(value: string | null): string {
  if (value === null) return '데이터 없음'
  const numberValue = Number(value)
  if (Number.isNaN(numberValue)) return value
  return `$${formatCompactNumber(numberValue)}`
}

export function categoryColor(category: string): string {
  switch (category) {
    case 'crash':
    case 'crisis':
      return '#ef4444'
    case 'rally':
      return '#22c55e'
    case 'mania':
      return '#facc15'
    case 'regulation':
      return '#38bdf8'
    default:
      return '#94a3b8'
  }
}
