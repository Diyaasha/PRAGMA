/**
 * PRAGMA — AI Extraction panel
 * Owner: Ashwin — M4
 * Surfaces the differentiator: Claude reads circulars and routes MAPs.
 */

import { useEvents } from '../../hooks/useEvents'

const prio = (p) => (p || '').toString().trim().toLowerCase()
const DEPTS = ['IT', 'Compliance', 'Risk', 'Treasury', 'Legal']
const PRIORITY_ORDER = ['Critical', 'High', 'Medium', 'Low']
const PRIORITY_FILL = { Critical: '#9C2A2A', High: '#B5701F', Medium: '#9A7B3F', Low: '#9CA3AF' }

export default function AIExtractionPanel({ maps }) {
  const { events } = useEvents()
  const circulars = events.filter((e) => (e.event_type || '').toUpperCase().includes('UPLOAD')).length
  const routed = maps.filter((m) => DEPTS.includes(m.department)).length
  const routedPct = maps.length === 0 ? 0 : Math.round((routed / maps.length) * 100)

  const mix = PRIORITY_ORDER.map((p) => ({
    p, n: maps.filter((m) => prio(m.priority) === p.toLowerCase()).length,
  }))
  const maxMix = Math.max(1, ...mix.map((m) => m.n))

  return (
    <section className="rounded-xl border border-line bg-white p-6">
      <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.18em] text-brass-deep">AI Extraction Engine</p>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="font-serif text-3xl font-semibold tabular-nums text-ink">{maps.length}</p>
          <p className="mt-0.5 text-[11px] text-gray-500">MAPs auto-extracted</p>
        </div>
        <div>
          <p className="font-serif text-3xl font-semibold tabular-nums text-ink">{circulars || '—'}</p>
          <p className="mt-0.5 text-[11px] text-gray-500">circulars processed</p>
        </div>
        <div>
          <p className="font-serif text-3xl font-semibold tabular-nums text-brass-deep">{routedPct}%</p>
          <p className="mt-0.5 text-[11px] text-gray-500">auto-routed to dept</p>
        </div>
      </div>

      <div className="mt-5 border-t border-line pt-4">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-wide text-gray-400">Priority mix detected</p>
        <div className="space-y-1.5">
          {mix.map((m) => (
            <div key={m.p} className="flex items-center gap-3">
              <span className="w-14 flex-shrink-0 text-[11px] text-gray-600">{m.p}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line/50">
                <div className="h-full rounded-full" style={{ width: `${(m.n / maxMix) * 100}%`, background: PRIORITY_FILL[m.p] }} />
              </div>
              <span className="w-5 flex-shrink-0 text-right font-mono text-[11px] tabular-nums text-gray-500">{m.n}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
