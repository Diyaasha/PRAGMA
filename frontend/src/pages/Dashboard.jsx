/**
 * PRAGMA — Dashboard (#15)
 * Owner: Ashwin — M3 / M4 premium pass
 * Stat cards + priority distribution + recent MAPs. Polls every 5s.
 */

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts'
import { useMaps } from '../hooks/useMaps'
import StatusBadge from '../components/shared/StatusBadge'
import PriorityBadge from '../components/shared/PriorityBadge'
import Spinner from '../components/shared/Spinner'
import { truncate } from '../utils/formatters'

const PRIORITY_ORDER = ['Critical', 'High', 'Medium', 'Low']
// Restrained, slightly desaturated fills — corporate, not candy
const PRIORITY_FILL = { Critical: '#B91C1C', High: '#C2620C', Medium: '#B08A1E', Low: '#94A3B8' }

const statusKey = (s) => (s || '').toString().trim().toUpperCase().replace(/\s+/g, '_')

function StatCard({ label, value, tick }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-5 py-4 transition-shadow hover:shadow-sm">
      <div className="flex items-center gap-2">
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${tick}`} />
        <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-gray-500">{label}</p>
      </div>
      <p className="mt-2 font-mono text-3xl font-semibold tabular-nums text-ink">{value}</p>
    </div>
  )
}

export default function Dashboard() {
  const { maps, loading, usingMock } = useMaps()

  const count = (status) => maps.filter((m) => statusKey(m.status) === status).length

  const priorityData = PRIORITY_ORDER.map((p) => ({
    priority: p,
    count: maps.filter((m) => (m.priority || '').toString().trim().toLowerCase() === p.toLowerCase()).length,
  }))

  const recent = [...maps].slice(-5).reverse()

  if (loading) return <Spinner label="Loading dashboard…" />

  return (
    <div className="space-y-6">
      {usingMock && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          Backend not reachable — showing sample data. Switches to live data automatically once the API is up.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total MAPs"  value={maps.length}        tick="bg-ink" />
        <StatCard label="Pending"     value={count('PENDING')}   tick="bg-amber-500" />
        <StatCard label="In Progress" value={count('IN_PROGRESS')} tick="bg-violet-500" />
        <StatCard label="Completed"   value={count('COMPLETED')} tick="bg-emerald-500" />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-5 text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-500">
          MAPs by Priority
        </h3>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={priorityData} barCategoryGap="38%">
              <CartesianGrid vertical={false} stroke="#EEF1F5" />
              <XAxis dataKey="priority" tickLine={false} axisLine={false}
                tick={{ fontSize: 12, fill: '#5B6472', fontFamily: 'IBM Plex Sans' }} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28}
                tick={{ fontSize: 12, fill: '#94A3B8', fontFamily: 'IBM Plex Mono' }} />
              <Tooltip cursor={{ fill: '#F5F7FA' }}
                contentStyle={{ borderRadius: 8, border: '1px solid #E6E9EF', fontSize: 13, fontFamily: 'IBM Plex Sans' }} />
              <Bar dataKey="count" radius={[3, 3, 0, 0]} maxBarSize={64}>
                {priorityData.map((d) => (
                  <Cell key={d.priority} fill={PRIORITY_FILL[d.priority]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-gray-500">
          Recent MAPs
        </h3>
        {recent.length === 0 ? (
          <p className="text-sm text-gray-400">No MAPs yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {recent.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm text-gray-900">{truncate(m.action, 90)}</p>
                  <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wide text-gray-400">{m.department}</p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  <PriorityBadge priority={m.priority} />
                  <StatusBadge status={m.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
