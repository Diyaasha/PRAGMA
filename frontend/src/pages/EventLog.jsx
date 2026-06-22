/**
 * PRAGMA — Event Log (#18)
 * Owner: Ashwin — M3
 * Read-only lifecycle timeline, newest first. Polls every 5s.
 */

import { useEvents } from '../hooks/useEvents'
import { formatDateTime } from '../utils/formatters'
import Spinner from '../components/shared/Spinner'
// Dot colour per event family — keeps the timeline scannable
const DOT = (type = '') => {
  const t = type.toUpperCase()
  if (t.includes('APPROVED')) return 'bg-blue-500'
  if (t.includes('REJECTED')) return 'bg-red-500'
  if (t.includes('COMPLETED')) return 'bg-green-500'
  if (t.includes('EXTRACT')) return 'bg-purple-500'
  if (t.includes('UPLOAD')) return 'bg-primary-500'
  return 'bg-gray-400'
}

const label = (type = '') =>
  type.toString().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

export default function EventLog() {
  const { events, loading, usingMock } = useEvents()

  if (loading) return <Spinner label="Loading events…" />

  return (
    <div className="space-y-5">
      {usingMock && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
          Backend not reachable — showing sample data.
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        {events.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">No events yet.</p>
        ) : (
          <ol className="relative ml-3 border-l border-gray-200">
            {events.map((e) => (
              <li key={e.id} className="mb-6 ml-6 last:mb-0">
                <span className={`absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full ring-4 ring-white ${DOT(e.event_type)}`} />
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-medium text-gray-900">{label(e.event_type)}</p>
                  <time className="flex-shrink-0 font-mono text-[11px] tabular-nums text-gray-400">{formatDateTime(e.created_at)}</time>
                </div>
                <p className="mt-0.5 text-sm text-gray-500">{e.description}</p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}
