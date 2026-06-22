import React, { useMemo } from 'react'
import { useEvents } from '../../hooks/useEvents'
import { Sparkles } from 'lucide-react'

const prio = (p) => (p || '').toString().trim().toLowerCase()
const DEPTS = ['IT', 'Compliance', 'Risk', 'Treasury', 'Legal']
const PRIORITY_ORDER = ['Critical', 'High', 'Medium', 'Low']
const PRIORITY_FILL = { Critical: '#B42318', High: '#B54708', Medium: '#c69b4f', Low: '#9CA3AF' }

function AIExtractionPanel({ maps }) {
  const { events } = useEvents()

  const stats = useMemo(() => {
    const uploadEvts = events.filter((e) => (e.event_type || '').toUpperCase().includes('UPLOAD'))
    const routed     = maps.filter((m) => DEPTS.includes(m.department)).length
    const routedPct  = maps.length === 0 ? 0 : Math.round((routed / maps.length) * 100)
    const scores     = maps.filter((m) => m.confidence_score != null).map((m) => m.confidence_score)
    const avgConf    = scores.length === 0 ? null
      : Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100)
    const mix = PRIORITY_ORDER.map((p) => ({
      p,
      n: maps.filter((m) => prio(m.priority) === p.toLowerCase()).length,
    }))
    const maxMix = Math.max(1, ...mix.map((m) => m.n))
    return { circulars: uploadEvts.length, routedPct, avgConf, mix, maxMix }
  }, [maps, events])

  return (
    <section className="rounded-xl border border-line bg-white dark:bg-card p-5">
      <div className="mb-5 flex items-center gap-2">
        <Sparkles size={13} className="text-violet-500" />
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-brass-deep dark:text-brass">
          AI Extraction Engine
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <p className="font-serif text-3xl font-semibold tabular-nums text-ink dark:text-[#e8edf5]">{maps.length}</p>
          <p className="mt-0.5 text-[11px] text-[#8b98aa]">MAPs extracted</p>
        </div>
        <div>
          <p className="font-serif text-3xl font-semibold tabular-nums text-ink dark:text-[#e8edf5]">
            {stats.circulars || '—'}
          </p>
          <p className="mt-0.5 text-[11px] text-[#8b98aa]">circulars processed</p>
        </div>
        <div>
          <p className="font-serif text-3xl font-semibold tabular-nums text-brass-deep dark:text-brass">
            {stats.routedPct}%
          </p>
          <p className="mt-0.5 text-[11px] text-[#8b98aa]">auto-routed</p>
        </div>
        <div>
          <p className={`font-serif text-3xl font-semibold tabular-nums ${
            stats.avgConf == null ? 'text-[#8b98aa]'
            : stats.avgConf >= 85 ? 'text-success-700 dark:text-green-400'
            : 'text-warning-700 dark:text-amber-400'
          }`}>
            {stats.avgConf != null ? `${stats.avgConf}%` : '—'}
          </p>
          <p className="mt-0.5 text-[11px] text-[#8b98aa]">avg confidence</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-1.5 rounded border border-violet-200 dark:border-violet-800/60 bg-violet-50 dark:bg-violet-900/20 px-2.5 py-1.5">
        <Sparkles size={11} className="text-violet-500 dark:text-violet-400 flex-shrink-0" />
        <span className="font-mono text-[10px] text-violet-700 dark:text-violet-400">
          Powered by Claude AI (claude-sonnet-4-6) · Anthropic
        </span>
      </div>

      <div className="mt-5 border-t border-line pt-4">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-wide text-[#8b98aa]">
          Priority distribution detected
        </p>
        <div className="space-y-1.5">
          {stats.mix.map((m) => (
            <div key={m.p} className="flex items-center gap-3">
              <span className="w-14 flex-shrink-0 text-[11px] text-[#8b98aa]">{m.p}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line dark:bg-surface">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(m.n / stats.maxMix) * 100}%`,
                    background: PRIORITY_FILL[m.p],
                  }}
                />
              </div>
              <span className="w-5 flex-shrink-0 text-right font-mono text-[11px] tabular-nums text-[#8b98aa]">
                {m.n}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default React.memo(AIExtractionPanel)
