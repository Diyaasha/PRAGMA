/**
 * PRAGMA — Audit Activity (dashboard inline feed)
 * Owner: Ashwin — M4
 * Most recent register events, so the audit trail is visible at a glance.
 */

import { useEvents } from '../../hooks/useEvents'
import { formatDateTime } from '../../utils/formatters'

const DOT = (t = '') => {
  const u = t.toUpperCase()
  if (u.includes('APPROV')) return 'bg-blue-500'
  if (u.includes('REJECT')) return 'bg-red-500'
  if (u.includes('COMPLET')) return 'bg-emerald-500'
  if (u.includes('EXTRACT')) return 'bg-violet-500'
  if (u.includes('UPLOAD')) return 'bg-primary-500'
  return 'bg-gray-400'
}
const label = (t = '') => t.toString().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

export default function AuditActivity() {
  const { events } = useEvents()
  const recent = events.slice(0, 6)

  return (
    <section className="rounded-xl border border-line bg-white p-6">
      <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.18em] text-brass-deep">Recent Audit Activity</p>
      {recent.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-400">No activity yet.</p>
      ) : (
        <ul className="space-y-3">
          {recent.map((e) => (
            <li key={e.id} className="flex items-start gap-3">
              <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${DOT(e.event_type)}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-medium text-ink">{label(e.event_type)}</span>
                  <time className="flex-shrink-0 font-mono text-[10px] tabular-nums text-gray-400">{formatDateTime(e.created_at)}</time>
                </div>
                <p className="truncate text-xs text-gray-500">{e.description}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
