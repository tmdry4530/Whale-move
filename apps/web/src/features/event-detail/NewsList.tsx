import type { z } from 'zod'

import type { newsArticleSchema } from '../../api/schemas'

type NewsArticle = z.infer<typeof newsArticleSchema>

export function NewsList({ items }: { items: NewsArticle[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className="rounded-none border border-brand-border bg-brand-surface p-[24px]">
          <div className="font-display text-[12px] uppercase tracking-[1px] text-brand-muted">{item.source}</div>
          <a className="mt-4 block font-body text-[22px] text-brand-text transition-colors hover:text-brand-muted" href={item.url} target="_blank" rel="noreferrer">
            {item.title}
          </a>
          {item.summary ? <p className="mt-2 text-base text-brand-muted font-body leading-relaxed">{item.summary}</p> : null}
        </li>
      ))}
    </ul>
  )
}
