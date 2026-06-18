/**
 * PRAGMA — Upcoming Deadlines
 * Owner: Ashwin — M4
 * Open MAPs with deadlines, soonest first; flags overdue and due-soon.
 */

import { truncate } from '../../utils/formatters'

const key = (s) => (s || '').toString().trim().toUpperCase().replace(/\s+/g, '_')
const RESOLVED = ['APPROVED', 'IN_PROGRESS', 'COMPLETED']

const daysUntil = (d) => Math.ceil((new Date(d) - new Date()) / 86400000)
const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

export default function UpcomingDeadlines({ maps }) {
  const items = maps
    .filter((m) => m.deadline && !RESOLVED.includes(key(m.status)))
    .map((m) => ({ ...m, days: daysUntil(m.deadline) }))
    .sort((a, b) => a.days - b.days)
    .slice(0, 6)

  const tone = (days) =>
    days < 0 ? { label: 'OVERDUE', cls: 'text-red-700 bg-red-50 border-red-200' }
    : days <= 30 ? { label: `${days}d`, cls: 'text-amber-700 bg-amber-50 border-amber-200' }
    : { label: `${days}d`, cls: 'text-gray-500 bg-gray-50 border-gray-200' }

  return (
    <section className="rounded-xl border border-line bg-white p-6">
      <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.18em] text-brass-deep">Upcoming Obligations</p>
      {items.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-400">No dated obligations pending.</p>
      ) : (
        <ul className="divide-y divide-line">
          {items.map((m) => {
            const t = tone(m.days)
            return (
              <li key={m.id} className="flex items-center gap-3 py-2.5">
                <span className={`flex-shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] tabular-nums ${t.cls}`}>{t.label}</span>
                <p className="min-w-0 flex-1 truncate text-[13px] text-gray-800">{truncate(m.action, 60)}</p>
                <span className="flex-shrink-0 font-mono text-[11px] text-gray-400">{fmt(m.deadline)}</span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
