import { truncate } from '../../utils/formatters'

const key = (s) => (s || '').toString().trim().toUpperCase().replace(/\s+/g, '_')
const RESOLVED = ['APPROVED', 'IN_PROGRESS', 'COMPLETED']

const daysUntil = (d) => Math.ceil((new Date(d) - new Date()) / 86400000)
const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

const tone = (days) =>
  days < 0
    ? { label: 'OVERDUE', cls: 'text-danger dark:text-red-400 bg-danger-50 dark:bg-red-900/20 border-danger-200 dark:border-red-800/60' }
    : days <= 30
    ? { label: `${days}d`, cls: 'text-warning-700 dark:text-amber-400 bg-warning-50 dark:bg-amber-900/20 border-warning-200 dark:border-amber-800/60' }
    : { label: `${days}d`, cls: 'text-[#8b98aa] bg-paper dark:bg-surface border-line' }

export default function UpcomingDeadlines({ maps }) {
  const items = maps
    .filter((m) => m.deadline && !RESOLVED.includes(key(m.status)))
    .map((m) => ({ ...m, days: daysUntil(m.deadline) }))
    .sort((a, b) => a.days - b.days)
    .slice(0, 6)

  return (
    <section className="rounded-xl border border-line bg-white dark:bg-card p-5">
      <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.18em] text-brass-deep dark:text-brass">Upcoming Obligations</p>
      {items.length === 0 ? (
        <p className="py-4 text-center text-sm text-[#8b98aa]">No dated obligations pending.</p>
      ) : (
        <ul className="divide-y divide-line">
          {items.map((m) => {
            const t = tone(m.days)
            return (
              <li key={m.id} className="flex items-center gap-3 py-2.5">
                <span className={`flex-shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] tabular-nums ${t.cls}`}>
                  {t.label}
                </span>
                <p className="min-w-0 flex-1 truncate text-[13px] text-ink dark:text-[#e8edf5]">
                  {truncate(m.action, 60)}
                </p>
                <span className="flex-shrink-0 font-mono text-[11px] text-[#8b98aa]">{fmt(m.deadline)}</span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
