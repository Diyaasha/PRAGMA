/**
 * PRAGMA — Dashboard (#15) — full briefing with all widgets
 * Owner: Ashwin — M4
 * Lifecycle → stats → chart + recent → department workload →
 * resolution funnel + AI extraction → deadlines + audit activity.
 */

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts'
import { useMaps } from '../hooks/useMaps'
import LifecycleStrip from '../components/shared/LifecycleStrip'
import StatusBadge from '../components/shared/StatusBadge'
import Spinner from '../components/shared/Spinner'
import { truncate } from '../utils/formatters'
import DepartmentWorkload from '../components/shared/DepartmentWorkload'
import ResolutionFunnel from '../components/shared/ResolutionFunnel'
import AIExtractionPanel from '../components/shared/AIExtractionPanel'
import UpcomingDeadlines from '../components/shared/UpcomingDeadlines'
import AuditActivity from '../components/shared/AuditActivity'

const PRIORITY_ORDER = ['Critical', 'High', 'Medium', 'Low']
const PRIORITY_FILL = { Critical: '#9C2A2A', High: '#B5701F', Medium: '#9A7B3F', Low: '#9CA3AF' }
const statusKey = (s) => (s || '').toString().trim().toUpperCase().replace(/\s+/g, '_')

function StatCard({ label, value, tick }) {
  return (
    <div className="rounded-lg border border-line bg-white px-4 py-3">
      <div className="flex items-center gap-2">
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${tick}`} />
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500">{label}</p>
      </div>
      <p className="mt-1 font-serif text-2xl font-semibold tabular-nums leading-none text-ink">{value}</p>
    </div>
  )
}

export default function Dashboard() {
  const { maps, loading, usingMock } = useMaps()
  const count = (s) => maps.filter((m) => statusKey(m.status) === s).length

  const priorityData = PRIORITY_ORDER.map((p) => ({
    priority: p,
    count: maps.filter((m) => (m.priority || '').toString().trim().toLowerCase() === p.toLowerCase()).length,
  }))
  const recent = [...maps].slice(-6).reverse()

  if (loading) return <Spinner label="Loading dashboard…" />

  return (
    <div className="space-y-4">
      {usingMock && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          Backend not reachable — showing sample data.
        </div>
      )}

      <LifecycleStrip maps={maps} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total MAPs"  value={maps.length}          tick="bg-ink" />
        <StatCard label="Pending"     value={count('PENDING')}     tick="bg-amber-500" />
        <StatCard label="In Progress" value={count('IN_PROGRESS')} tick="bg-violet-500" />
        <StatCard label="Completed"   value={count('COMPLETED')}   tick="bg-emerald-500" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Chart — left, wider */}
        <div className="rounded-xl border border-line bg-white p-5 lg:col-span-3">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-brass-deep">By Priority</p>
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer>
              <BarChart data={priorityData} barCategoryGap="40%">
                <CartesianGrid vertical={false} stroke="#EFEBE2" />
                <XAxis dataKey="priority" tickLine={false} axisLine={false}
                  tick={{ fontSize: 12, fill: '#5B6472', fontFamily: 'IBM Plex Sans' }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={24}
                  tick={{ fontSize: 11, fill: '#9CA3AF', fontFamily: 'IBM Plex Mono' }} />
                <Tooltip cursor={{ fill: '#FAF7F0' }}
                  contentStyle={{ borderRadius: 8, border: '1px solid #E8E3DA', fontSize: 13, fontFamily: 'IBM Plex Sans' }} />
                <Bar dataKey="count" radius={[3, 3, 0, 0]} maxBarSize={54}>
                  {priorityData.map((d) => <Cell key={d.priority} fill={PRIORITY_FILL[d.priority]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent — right, narrower */}
        <div className="rounded-xl border border-line bg-white p-5 lg:col-span-2">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-brass-deep">Recent Entries</p>
          {recent.length === 0 ? (
            <p className="text-sm text-gray-400">No MAPs yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {recent.map((m, i) => (
                <li key={m.id} className="flex items-center gap-3 py-2">
                  <span className="font-mono text-[10px] tabular-nums text-gray-400">
                    {String(maps.length - i).padStart(3, '0')}
                  </span>
                  <p className="min-w-0 flex-1 truncate text-[13px] text-gray-800">{truncate(m.action, 52)}</p>
                  <StatusBadge status={m.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Department workload — full width */}
      <DepartmentWorkload maps={maps} />

      {/* Resolution funnel + AI extraction */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ResolutionFunnel maps={maps} />
        <AIExtractionPanel maps={maps} />
      </div>

      {/* Deadlines + audit activity */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <UpcomingDeadlines maps={maps} />
        <AuditActivity />
      </div>
    </div>
  )
}
