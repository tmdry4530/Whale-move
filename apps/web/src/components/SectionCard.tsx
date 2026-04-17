import type { PropsWithChildren, ReactNode } from 'react'

export function SectionCard({ title, eyebrow, children }: PropsWithChildren<{ title: string; eyebrow?: ReactNode }>) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-slate-950/20">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          {eyebrow ? <div className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">{eyebrow}</div> : null}
          <h2 className="mt-1 text-xl font-semibold text-white">{title}</h2>
        </div>
      </div>
      {children}
    </section>
  )
}
