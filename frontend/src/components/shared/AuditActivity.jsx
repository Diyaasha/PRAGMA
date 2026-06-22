import React from 'react'
import { useEvents } from '../../hooks/useEvents'
import { formatDateTime } from '../../utils/formatters'

const EVENT_STYLE = (t = '') => {
  const u = t.toUpperCase()
  if (u.includes('APPROV'))  return { dot: 'bg-ink',        badge: 'bg-primary-50  text-primary-700 border-primary-200' }
  if (u.includes('REJECT'))  return { dot: 'bg-danger',     badge: 'bg-danger-50   text-danger-700  border-danger-200'  }
  if (u.includes('COMPLET')) return { dot: 'bg-success',    badge: 'bg-success-50  text-success-700 border-success-200' }
  if (u.includes('EXTRACT')) return { dot: 'bg-violet-500', badge: 'bg-violet-50   text-violet-700  border-violet-200'  }
  if (u.includes('UPLOAD'))  return { dot: 'bg-brass',      badge: 'bg-brass-soft  text-brass-deep  border-brass/30'    }
  return                             { dot: 'bg-gray-400',   badge: 'bg-gray-50     text-gray-600    border-gray-200'    }
}

const fmtLabel = (t = '') =>
  t.toString().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

// Phase 1 performance: accepts events as prop when called from Dashboard
// (avoids a second useEvents() polling interval on the same page).
// Falls back to internal useEvents() when used standalone.
function AuditActivity({ events: propEvents }) {
  const { events: hookEvents } = useEvents()
  const events = propEvents ?? hookEvents
  const recent = events.slice(0, 6)

  return (
    <section className="rounded-xl border border-line dark:border-gray-800 bg-white dark:bg-gray-950 p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-brass-deep dark:text-gray-500">
          Recent Audit Activity
        </p>
        <span className="font-mono text-[10px] text-gray-400 dark:text-gray-600">
          {events.length} total event{events.length !== 1 ? 's' : ''}
        </span>
      </div>

      {recent.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-line dark:border-gray-800 bg-paper dark:bg-gray-900">
            <span className="font-mono text-[16px] text-gray-300 dark:text-gray-700">○</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">No audit events yet.</p>
          <p className="font-mono text-[10px] text-gray-400 dark:text-gray-600">
            Events appear after circulars are uploaded.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {recent.map((e) => (
            <li key={e.id} className="flex items-start gap-3">
              <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${EVENT_STYLE(e.event_type).dot}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-medium text-ink dark:text-gray-200">{fmtLabel(e.event_type)}</span>
                  <time className="flex-shrink-0 font-mono text-[10px] tabular-nums text-gray-400 dark:text-gray-600">{formatDateTime(e.created_at)}</time>
                </div>
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">{e.description}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default React.memo(AuditActivity)
