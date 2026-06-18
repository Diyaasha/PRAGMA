/**
 * PRAGMA — Department Workload
 * Owner: Ashwin — M4
 * Per-department load: total MAPs, open count, and a priority-weighted load bar.
 */

const key = (s) => (s || '').toString().trim().toUpperCase().replace(/\s+/g, '_')
const prio = (p) => (p || '').toString().trim().toLowerCase()
const RESOLVED = ['APPROVED', 'IN_PROGRESS', 'COMPLETED']
const PW = { critical: 4, high: 3, medium: 2, low: 1 }
const DEPTS = ['IT', 'Compliance', 'Risk', 'Treasury', 'Legal']

export default function DepartmentWorkload({ maps }) {
  const rows = DEPTS.map((d) => {
    const items = maps.filter((m) => (m.department || '') === d)
    const open = items.filter((m) => !RESOLVED.includes(key(m.status)))
    const load = open.reduce((a, m) => a + (PW[prio(m.priority)] || 1), 0)
    const critical = open.filter((m) => prio(m.priority) === 'critical').length
    return { dept: d, total: items.length, open: open.length, load, critical }
  })
  const maxLoad = Math.max(1, ...rows.map((r) => r.load))

  return (
    <section className="rounded-xl border border-line bg-white p-6">
      <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.18em] text-brass-deep">Department Workload</p>
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.dept} className="flex items-center gap-4">
            <span className="w-24 flex-shrink-0 text-sm font-medium text-ink">{r.dept}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-line/60">
              <div className="h-full rounded-full" style={{ width: `${(r.load / maxLoad) * 100}%`, background: r.critical ? '#9C2A2A' : '#143049' }} />
            </div>
            <span className="w-28 flex-shrink-0 text-right font-mono text-[11px] tabular-nums text-gray-500">
              {r.open} open / {r.total}
            </span>
            {r.critical > 0 && (
              <span className="flex-shrink-0 rounded border border-red-200 bg-red-50 px-1.5 py-0.5 font-mono text-[10px] uppercase text-red-700">
                {r.critical} crit
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
