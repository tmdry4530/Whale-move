import type { z } from 'zod'

import type { newsArticleSchema } from '../../api/schemas'

type NewsArticle = z.infer<typeof newsArticleSchema>

export function NewsList({ items }: { items: NewsArticle[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.source}</div>
          <a className="mt-1 block font-medium text-slate-100 hover:text-sky-300" href={item.url} target="_blank" rel="noreferrer">
            {item.title}
          </a>
          {item.summary ? <p className="mt-2 text-sm text-slate-300">{item.summary}</p> : null}
        </li>
      ))}
    </ul>
  )
}
