import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { useMaps } from '../hooks/useMaps'
import { useEvents } from '../hooks/useEvents'
import { useCirculars } from '../hooks/useCirculars'
import LifecycleStrip from '../components/shared/LifecycleStrip'
import AIExtractionPanel from '../components/shared/AIExtractionPanel'
import AuditActivity from '../components/shared/AuditActivity'
import DepartmentWorkload from '../components/shared/DepartmentWorkload'
import ResolutionFunnel from '../components/shared/ResolutionFunnel'
import UpcomingDeadlines from '../components/shared/UpcomingDeadlines'
import AlertBanner from '../components/shared/AlertBanner'
import { SkeletonMetricCard } from '../components/shared/Skeleton'
import { formatDate } from '../utils/formatters'
import { AlertTriangle, Clock, TrendingUp, ShieldCheck, Layers } from 'lucide-react'

const sk = (s) => (s || '').toString().trim().toUpperCase().replace(/\s+/g, '_')

const STATUS_PALETTE = [
  { name: 'Pending',     key: 'PENDING',     color: '#B54708' },
  { name: 'Approved',    key: 'APPROVED',    color: '#041E42' },
  { name: 'In Progress', key: 'IN_PROGRESS', color: '#7C3AED' },
  { name: 'Completed',   key: 'COMPLETED',   color: '#067647' },
  { name: 'Rejected',    key: 'REJECTED',    color: '#B42318' },
]

const DEPT_COLORS = {
  IT: '#2B4A8F', Compliance: '#c69b4f', Risk: '#7C3AED',
  Legal: '#0891B2', Treasury: '#065F46',
}

function Trend({ dir, label }) {
  const cfg = {
    up:   { glyph: '↑', cls: 'text-success-700 dark:text-green-400' },
    down: { glyph: '↓', cls: 'text-danger-700 dark:text-red-400'  },
    warn: { glyph: '●', cls: 'text-warning-700 dark:text-amber-400' },
    ok:   { glyph: '✓', cls: 'text-success-700 dark:text-green-400' },
  }[dir] || { glyph: '—', cls: 'text-[#8b98aa]' }

  return (
    <div className={`mt-1 flex items-center gap-1 font-mono text-[10px] font-medium ${cfg.cls}`}>
      <span>{cfg.glyph}</span>
      <span>{label}</span>
    </div>
  )
}

function CriticalActionsWidget({ maps }) {
  const navigate = useNavigate()
  const today    = new Date()
  today.setHours(0, 0, 0, 0)

  const critical = useMemo(() => maps
    .filter((m) => {
      const prio    = (m.priority || '').toLowerCase()
      const status  = sk(m.status)
      const overdue = m.deadline && new Date(m.deadline) < today
      return (prio === 'critical' || overdue) && !['COMPLETED', 'REJECTED'].includes(status)
    })
    .sort((a, b) => (a.priority === 'Critical' ? 0 : 1) - (b.priority === 'Critical' ? 0 : 1))
    .slice(0, 4),
  [maps])

  if (!critical.length) return null

  return (
    <div className="rounded-xl border border-line bg-white dark:bg-card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-line bg-paper/40 dark:bg-surface/40 px-5 py-3">
        <AlertTriangle size={13} className="text-danger dark:text-red-400 flex-shrink-0" />
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-brass-deep dark:text-brass">
          Critical Actions Required
        </p>
        <span className="ml-auto rounded-full bg-danger/10 dark:bg-red-900/30 px-2 py-0.5 font-mono text-[9px] font-bold text-danger dark:text-red-400">
          {critical.length}
        </span>
      </div>
      <div className="divide-y divide-line">
        {critical.map((m) => {
          const overdue = m.deadline && new Date(m.deadline) < today
          return (
            <button
              key={m.id}
              onClick={() => navigate('/maps')}
              className="w-full text-left px-5 py-3.5 hover:bg-paper/40 dark:hover:bg-surface/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-medium text-ink dark:text-[#e8edf5] leading-snug">
                    {m.action}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[9px] uppercase tracking-wide text-[#8b98aa]">
                      {m.department}
                    </span>
                    {m.source_clause && (
                      <span className="font-mono text-[9px] text-brass">
                        {m.source_clause}
                      </span>
                    )}
                    {overdue && m.deadline && (
                      <span className="flex items-center gap-1 font-mono text-[9px] text-danger dark:text-red-400">
                        <Clock size={9} />
                        Overdue since {formatDate(m.deadline)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0 flex flex-col items-end gap-1">
                  <span className={`rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${
                    m.priority === 'Critical'
                      ? 'border-danger-200 dark:border-red-800/60 bg-danger-50 dark:bg-red-900/30 text-danger-700 dark:text-red-400'
                      : 'border-warning-200 dark:border-amber-800/60 bg-warning-50 dark:bg-amber-900/30 text-warning-700 dark:text-amber-400'
                  }`}>
                    {m.priority}
                  </span>
                  {m.risk?.score && (
                    <span className="font-mono text-[9px] text-[#8b98aa]">
                      Risk {m.risk.score}/100
                    </span>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>
      <div className="border-t border-line px-5 py-2">
        <button
          onClick={() => navigate('/maps')}
          className="font-mono text-[10px] text-primary-600 dark:text-primary-400 hover:underline"
        >
          View all MAPs in register →
        </button>
      </div>
    </div>
  )
}

function DeptRiskHeatmap({ maps }) {
  const data = useMemo(() => {
    const depts = ['IT', 'Compliance', 'Risk', 'Legal', 'Treasury']
    return depts.map((dept) => {
      const dMaps   = maps.filter((m) => m.department === dept)
      const pending  = dMaps.filter((m) => sk(m.status) === 'PENDING').length
      const critical = dMaps.filter((m) => (m.priority || '').toLowerCase() === 'critical').length
      const avgRisk  = dMaps.length
        ? Math.round(dMaps.reduce((s, m) => s + (m.risk?.score ?? 0), 0) / dMaps.length)
        : 0
      return { dept, total: dMaps.length, pending, critical, avgRisk }
    }).filter((d) => d.total > 0)
  }, [maps])

  if (!data.length) return null

  return (
    <div className="rounded-xl border border-line bg-white dark:bg-card p-5">
      <p className="mb-4 font-mono text-[9px] uppercase tracking-[0.18em] text-brass-deep dark:text-brass">
        Department Risk Heatmap
      </p>
      <div className="space-y-2.5">
        {data.map((d) => {
          const riskLevel = d.avgRisk >= 76 ? 'danger' : d.avgRisk >= 51 ? 'warning' : d.avgRisk >= 26 ? 'brass' : 'success'
          const barCls = { danger: 'bg-danger', warning: 'bg-warning', brass: 'bg-brass', success: 'bg-success' }[riskLevel]
          return (
            <div key={d.dept}>
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-semibold text-ink dark:text-[#e8edf5]">{d.dept}</span>
                  <span className="font-mono text-[10px] text-[#8b98aa]">{d.total} MAPs</span>
                  {d.critical > 0 && (
                    <span className="rounded bg-danger-50 dark:bg-red-900/30 px-1 py-0.5 font-mono text-[9px] font-bold text-danger dark:text-red-400">
                      {d.critical} critical
                    </span>
                  )}
                </div>
                <span className="font-mono text-[10px] tabular-nums text-[#8b98aa]">
                  Risk {d.avgRisk}
                </span>
              </div>
              <div className="h-2 rounded-full bg-line dark:bg-surface overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${barCls}`}
                  style={{ width: `${Math.max(d.avgRisk, 4)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
      <p className="mt-3 font-mono text-[10px] text-[#8b98aa]">
        Bar = avg. risk score across all MAPs in department
      </p>
    </div>
  )
}

export default function Dashboard() {
  const { maps, loading, usingMock } = useMaps()
  const { events }                   = useEvents()
  const { circulars }                = useCirculars()
  const today                        = new Date(); today.setHours(0, 0, 0, 0)

  const metrics = useMemo(() => {
    const count    = (key) => maps.filter((m) => sk(m.status) === key).length
    const pending  = count('PENDING')
    const approved = count('APPROVED')
    const inProg   = count('IN_PROGRESS')
    const completed = count('COMPLETED')
    const critical = maps.filter((m) => (m.priority || '').toLowerCase() === 'critical').length
    const overdue  = maps.filter((m) => {
      const status = sk(m.status)
      return m.deadline &&
        new Date(m.deadline) < today &&
        !['COMPLETED', 'REJECTED'].includes(status)
    }).length
    const depts = new Set(maps.map((m) => m.department).filter(Boolean)).size
    const score = maps.length === 0 ? 100 : Math.min(100,
      Math.round((completed + approved * 0.6 + inProg * 0.3) / maps.length * 100),
    )
    return { pending, approved, inProg, completed, critical, overdue, depts, score }
  }, [maps])

  const trends = useMemo(() => {
    const extractEvts  = events.filter((e) => e.event_type?.toUpperCase().includes('EXTRACT'))
    const approvalEvts = events.filter((e) => e.event_type?.toUpperCase().includes('APPROVED'))
    return { extracted: extractEvts.length, approved: approvalEvts.length, uploads: events.filter((e) => e.event_type?.toUpperCase().includes('UPLOAD')).length }
  }, [events])

  const statusData = useMemo(
    () => STATUS_PALETTE
      .map((s) => ({ ...s, value: maps.filter((m) => sk(m.status) === s.key).length }))
      .filter((s) => s.value > 0),
    [maps],
  )

  const CARDS = [
    {
      label: 'Compliance Score',
      value: `${metrics.score}%`,
      dot: metrics.score >= 70 ? 'bg-success' : 'bg-warning',
      sub: 'weighted MAP resolution',
      trend: { dir: metrics.score >= 70 ? 'up' : 'warn', label: metrics.score >= 70 ? 'On track' : 'Below 70% target' },
    },
    {
      label: 'Total MAPs',
      value: maps.length,
      dot: 'bg-ink dark:bg-primary-400',
      sub: `${circulars.length} circular${circulars.length !== 1 ? 's' : ''} processed`,
      trend: maps.length > 0 ? { dir: 'up', label: `${maps.length} auto-extracted` } : null,
    },
    {
      label: 'Overdue',
      value: metrics.overdue,
      dot: metrics.overdue > 0 ? 'bg-danger' : 'bg-success',
      sub: 'past deadline, unresolved',
      trend: metrics.overdue > 0
        ? { dir: 'down', label: `${metrics.overdue} need urgent action` }
        : { dir: 'ok', label: 'All MAPs on schedule' },
    },
    {
      label: 'Critical Actions',
      value: metrics.critical,
      dot: 'bg-red-500',
      sub: 'high-urgency regulatory flags',
      trend: metrics.critical > 0
        ? { dir: 'down', label: `${metrics.critical} require priority action` }
        : { dir: 'ok', label: 'None outstanding' },
    },
    {
      label: 'Depts Impacted',
      value: metrics.depts,
      dot: 'bg-violet-500',
      sub: 'departments in compliance scope',
      trend: trends.approved > 0
        ? { dir: 'up', label: `${trends.approved} MAPs reviewed` }
        : null,
    },
  ]

  return (
    <div className="space-y-5">
      {/* ── Alert banner ── */}
      <AlertBanner maps={maps} circulars={circulars} />

      {usingMock && (
        <div className="rounded-md border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 text-sm text-amber-800 dark:text-amber-300">
          Backend not reachable — showing representative demo data.
        </div>
      )}

      {/* ── KPI metric strip ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonMetricCard key={i} />)
          : CARDS.map((c) => (
              <div
                key={c.label}
                className="rounded-xl border border-line bg-white dark:bg-card px-5 py-4 animate-fadeIn"
              >
                <div className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${c.dot}`} />
                  <p className="truncate text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8b98aa]">
                    {c.label}
                  </p>
                </div>
                <p className="mt-1.5 font-serif text-3xl font-semibold tabular-nums leading-none text-ink dark:text-[#e8edf5]">
                  {c.value}
                </p>
                <p className="mt-1 text-[11px] text-[#8b98aa]">{c.sub}</p>
                {c.trend && <Trend dir={c.trend.dir} label={c.trend.label} />}
              </div>
            ))}
      </div>

      {/* ── Lifecycle pipeline ── */}
      <LifecycleStrip maps={maps} />

      {/* ── Critical Actions + Dept Risk Heatmap ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <CriticalActionsWidget maps={maps} />
        <DeptRiskHeatmap maps={maps} />
      </div>

      {/* ── Charts row: dept workload (3/5) + status donut (2/5) ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <DepartmentWorkload maps={maps} />
        </div>

        <div className="lg:col-span-2 rounded-xl border border-line bg-white dark:bg-card p-5">
          <p className="mb-4 font-mono text-[9px] uppercase tracking-[0.18em] text-brass-deep dark:text-brass">
            Status Distribution
          </p>
          {statusData.length === 0 ? (
            <div className="flex h-44 flex-col items-center justify-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-line bg-paper dark:bg-surface">
                <span className="font-mono text-[20px] text-[#8b98aa]/40">○</span>
              </div>
              <p className="text-sm text-[#8b98aa]">No MAPs recorded yet.</p>
              <p className="font-mono text-[10px] text-[#8b98aa]/60">Upload a circular to begin.</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={2}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: '1px solid rgb(var(--line))',
                      fontSize: 12,
                      fontFamily: 'IBM Plex Sans',
                      background: 'rgb(var(--card))',
                      color: 'inherit',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
                {statusData.map((d) => (
                  <div key={d.name} className="flex min-w-0 items-center gap-1.5">
                    <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: d.color }} />
                    <span className="truncate text-[11px] text-[#8b98aa]">
                      {d.name} ({d.value})
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Resolution funnel + AI extraction ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ResolutionFunnel maps={maps} />
        <AIExtractionPanel maps={maps} />
      </div>

      {/* ── Audit activity + deadlines ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <AuditActivity events={events} />
        <UpcomingDeadlines maps={maps} />
      </div>
    </div>
  )
}
