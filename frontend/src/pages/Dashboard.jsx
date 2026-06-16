/**
 * PRAGMA — Dashboard (#15)
 * Owner: Ashwin — M3
 * Stat cards + priority distribution chart + recent MAPs. Polls every 5s.
 */

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useMaps } from '../hooks/useMaps'
import StatusBadge from '../components/shared/StatusBadge'
import PriorityBadge from '../components/shared/PriorityBadge'
import { truncate } from '../utils/formatters'
import Spinner from '../components/shared/Spinner'
const PRIORITY_ORDER = ['Critical', 'High', 'Medium', 'Low']
const PRIORITY_FILL = { Critical: '#dc2626', High: '#ea580c', Medium: '#ca8a04', Low: '#9ca3af' }

const statusKey = (s) => (s || '').toString().trim().toUpperCase().replace(/\s+/g, '_')

function StatCard({ label, value, accent }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${accent || 'text-gray-900'}`}>{value}</p>
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
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
          Backend not reachable — showing sample data. Switches to live data automatically once the API is up.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total MAPs" value={maps.length} accent="text-primary-700" />
        <StatCard label="Pending" value={count('PENDING')} accent="text-yellow-600" />
        <StatCard label="In Progress" value={count('IN_PROGRESS')} accent="text-purple-600" />
        <StatCard label="Completed" value={count('COMPLETED')} accent="text-green-600" />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">MAPs by Priority</h3>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={priorityData}>
              <XAxis dataKey="priority" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
              <Tooltip cursor={{ fill: '#f3f4f6' }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {priorityData.map((d) => (
                  <Cell key={d.priority} fill={PRIORITY_FILL[d.priority]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">Recent MAPs</h3>
        {recent.length === 0 ? (
          <p className="text-sm text-gray-400">No MAPs yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {recent.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm text-gray-900">{truncate(m.action, 90)}</p>
                  <p className="mt-0.5 text-xs text-gray-400">{m.department}</p>
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
