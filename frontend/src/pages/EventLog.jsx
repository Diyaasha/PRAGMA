import { useMemo, useState } from 'react'
import { useEvents } from '../hooks/useEvents'
import { formatDateTime } from '../utils/formatters'
import { SkeletonTableRows } from '../components/shared/Skeleton'
import { Filter, Calendar, User, X } from 'lucide-react'

const EVENT_META = (type = '') => {
  const t = type.toUpperCase()
  if (t.includes('APPROVED'))       return { label: 'Approved',    cls: 'bg-primary-50  text-primary-700 border-primary-200',  dot: 'bg-ink'        }
  if (t.includes('REJECTED'))       return { label: 'Rejected',    cls: 'bg-danger-50   text-danger-700  border-danger-200',   dot: 'bg-danger'     }
  if (t.includes('COMPLETED'))      return { label: 'Completed',   cls: 'bg-success-50  text-success-700 border-success-200',  dot: 'bg-success'    }
  if (t.includes('IN_PROGRESS'))    return { label: 'In Progress', cls: 'bg-violet-50   text-violet-700  border-violet-200',   dot: 'bg-violet-500' }
  if (t.includes('EXTRACT'))        return { label: 'AI Extract',  cls: 'bg-violet-50   text-violet-700  border-violet-200',   dot: 'bg-violet-500' }
  if (t.includes('UPLOAD'))         return { label: 'Upload',      cls: 'bg-brass-soft  text-brass-deep  border-brass/30',     dot: 'bg-brass'      }
  if (t.includes('ASSIGN'))         return { label: 'Assignment',  cls: 'bg-brass-soft  text-brass-deep  border-brass/30',     dot: 'bg-brass'      }
  if (t.includes('RESET'))          return { label: 'Demo Reset',  cls: 'bg-gray-100    text-gray-600    border-gray-200',     dot: 'bg-gray-400'   }
  return { label: type.replace(/_/g, ' '), cls: 'bg-gray-50 text-gray-600 border-gray-200', dot: 'bg-gray-400' }
}

const EVENT_FAMILIES = ['All', 'Upload', 'AI Extract', 'Approved', 'Rejected', 'Completed', 'In Progress']

const matchFamily = (type = '', family) => {
  if (family === 'All') return true
  const t = type.toUpperCase()
  if (family === 'Upload')      return t.includes('UPLOAD')
  if (family === 'AI Extract')  return t.includes('EXTRACT')
  if (family === 'Approved')    return t.includes('APPROVED')
  if (family === 'Rejected')    return t.includes('REJECTED')
  if (family === 'Completed')   return t.includes('COMPLETED')
  if (family === 'In Progress') return t.includes('IN_PROGRESS')
  return true
}

const DATE_RANGES = ['All Time', 'Today', 'Last 7 Days']

const startOfDay = () => {
  const d = new Date(); d.setHours(0, 0, 0, 0); return d
}

const matchDate = (created_at, range) => {
  if (range === 'All Time' || !created_at) return true
  const ts = new Date(created_at)
  if (range === 'Today') return ts >= startOfDay()
  if (range === 'Last 7 Days') {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7); cutoff.setHours(0,0,0,0)
    return ts >= cutoff
  }
  return true
}

export default function EventLog() {
  const { events, loading, usingMock } = useEvents()
  const [family,    setFamily]    = useState('All')
  const [dateRange, setDateRange] = useState('All Time')
  const [actor,     setActor]     = useState('')

  // Build unique actor list from events
  const actors = useMemo(() => {
    const set = new Set(events.map((e) => e.actor).filter(Boolean))
    return Array.from(set).sort()
  }, [events])

  const filtered = useMemo(
    () => events.filter((e) =>
      matchFamily(e.event_type, family) &&
      matchDate(e.created_at, dateRange) &&
      (!actor || e.actor === actor),
    ),
    [events, family, dateRange, actor],
  )

  const hasFilters = family !== 'All' || dateRange !== 'All Time' || actor
  const clearAll = () => { setFamily('All'); setDateRange('All Time'); setActor('') }

  return (
    <div className="space-y-4">
      {usingMock && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          Backend not reachable — showing sample audit data.
        </div>
      )}

      {/* ── Filter row ── */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Event type pills */}
        <div className="flex items-center gap-1.5">
          <Filter size={12} className="text-gray-400 flex-shrink-0" />
          <div className="flex flex-wrap gap-1">
            {EVENT_FAMILIES.map((f) => (
              <button
                key={f}
                onClick={() => setFamily(f)}
                className={`rounded-full border px-2.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wide transition-colors ${
                  family === f
                    ? 'border-ink bg-ink text-white dark:border-[#c69b4f] dark:bg-[#c69b4f]/20 dark:text-[#c69b4f]'
                    : 'border-line bg-white dark:bg-surface text-[#8b98aa] hover:border-line/80 hover:text-ink dark:hover:text-[#e8edf5]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="h-4 w-px bg-line flex-shrink-0" />

        {/* Date range */}
        <div className="flex items-center gap-1.5">
          <Calendar size={12} className="text-gray-400 flex-shrink-0" />
          <div className="flex gap-1">
            {DATE_RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`rounded-full border px-2.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wide transition-colors ${
                  dateRange === r
                    ? 'border-brass bg-brass text-white'
                    : 'border-line bg-white dark:bg-surface text-[#8b98aa] hover:border-brass/40 hover:text-ink dark:hover:text-[#e8edf5]'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Actor filter */}
        {actors.length > 0 && (
          <>
            <div className="h-4 w-px bg-line flex-shrink-0" />
            <div className="flex items-center gap-1.5">
              <User size={12} className="text-gray-400 flex-shrink-0" />
              <select
                value={actor}
                onChange={(e) => setActor(e.target.value)}
                className="rounded-lg border border-line bg-white dark:bg-surface py-1 pl-2 pr-6 text-[11px] text-ink dark:text-[#e8edf5] focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
              >
                <option value="">All actors</option>
                {actors.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </>
        )}

        {hasFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 rounded-lg border border-line bg-white dark:bg-card px-2.5 py-1 text-[11px] text-gray-500 hover:bg-gray-50"
          >
            <X size={11} /> Clear
          </button>
        )}

        <span className="ml-auto font-mono text-[11px] text-gray-400">
          {filtered.length} of {events.length} event{events.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── SIEM-style log table ── */}
      <div className="overflow-hidden rounded-xl border border-line bg-white dark:bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-paper/60">
              <tr>
                <th className="px-5 py-3 font-mono text-[10px] uppercase tracking-wider text-gray-500 w-4">
                  &nbsp;
                </th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-gray-500">
                  Event Type
                </th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-gray-500 min-w-[300px]">
                  Description
                </th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-gray-500 whitespace-nowrap">
                  Actor
                </th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-gray-500 whitespace-nowrap text-right">
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading ? (
                <SkeletonTableRows rows={8} cols={5} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-sm text-gray-400">No events match these filters.</p>
                      {hasFilters && (
                        <button onClick={clearAll} className="font-mono text-[11px] text-primary-600 hover:underline">
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((e) => {
                  const meta = EVENT_META(e.event_type)
                  return (
                    <tr key={e.id} className="hover:bg-paper/40 transition-colors">
                      <td className="pl-5 pr-2 py-3">
                        <span className={`mt-0.5 inline-block h-2 w-2 rounded-full ${meta.dot}`} />
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded border px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wide whitespace-nowrap ${meta.cls}`}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-gray-700 max-w-md">
                        {e.description || '—'}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-gray-500 whitespace-nowrap">
                        {e.actor || 'System'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[11px] tabular-nums text-gray-400 whitespace-nowrap">
                        {formatDateTime(e.created_at)}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length > 0 && (
          <div className="border-t border-line px-5 py-2.5">
            <p className="font-mono text-[10px] text-gray-400">
              {filtered.length} event{filtered.length !== 1 ? 's' : ''} · Ordered newest first · Auto-refreshes every 30s
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
