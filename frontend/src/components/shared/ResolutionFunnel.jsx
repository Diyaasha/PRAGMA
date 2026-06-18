/**
 * PRAGMA — Resolution Funnel
 * Owner: Ashwin — M4
 * Throughput view: how the register converts from extracted to completed.
 * Shows where items pile up (e.g. stuck at review).
 */

const key = (s) => (s || '').toString().trim().toUpperCase().replace(/\s+/g, '_')

export default function ResolutionFunnel({ maps }) {
  const total = maps.length
  const reviewed = maps.filter((m) => ['APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED'].includes(key(m.status))).length
  const approved = maps.filter((m) => ['APPROVED', 'IN_PROGRESS', 'COMPLETED'].includes(key(m.status))).length
  const completed = maps.filter((m) => key(m.status) === 'COMPLETED').length

  const stages = [
    { label: 'Extracted',  value: total,     hint: 'from circulars' },
    { label: 'Reviewed',   value: reviewed,  hint: 'passed the desk' },
    { label: 'Approved',   value: approved,  hint: 'cleared to act' },
    { label: 'Completed',  value: completed, hint: 'on record' },
  ]
  const pct = (v) => (total === 0 ? 0 : Math.round((v / total) * 100))

  return (
    <section className="rounded-xl border border-line bg-white p-6">
      <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.18em] text-brass-deep">Resolution Funnel</p>
      <div className="space-y-3.5">
        {stages.map((s, i) => (
          <div key={s.label}>
            <div className="mb-1 flex items-baseline justify-between">
              <span className="text-sm font-medium text-ink">{s.label}</span>
              <span className="font-mono text-[11px] text-gray-400">{s.hint}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-7 flex-1 overflow-hidden rounded-md bg-line/50">
                <div className="flex h-full items-center justify-end rounded-md px-2 transition-all"
                  style={{ width: `${Math.max(pct(s.value), 8)}%`, background: `rgba(20,48,73,${0.9 - i * 0.16})` }}>
                  <span className="font-serif text-sm font-semibold text-white tabular-nums">{s.value}</span>
                </div>
              </div>
              <span className="w-10 flex-shrink-0 text-right font-mono text-[11px] tabular-nums text-gray-500">{pct(s.value)}%</span>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 border-t border-line pt-3 text-xs text-gray-500">
        {total - reviewed > 0
          ? `${total - reviewed} item${total - reviewed > 1 ? 's' : ''} still awaiting first review.`
          : 'All extracted items have entered review.'}
      </p>
    </section>
  )
}
