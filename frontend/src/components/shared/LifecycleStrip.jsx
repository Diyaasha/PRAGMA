const statusKey = (s) => (s || '').toString().trim().toUpperCase().replace(/\s+/g, '_')

const STAGES = [
  { key: 'TOTAL',       label: 'Extracted',      hint: 'from circular' },
  { key: 'PENDING',     label: 'Pending Review', hint: 'awaiting officer' },
  { key: 'APPROVED',    label: 'Approved',       hint: 'cleared' },
  { key: 'IN_PROGRESS', label: 'In Progress',    hint: 'being actioned' },
  { key: 'COMPLETED',   label: 'Completed',      hint: 'on record' },
]

export default function LifecycleStrip({ maps }) {
  const count = (k) =>
    k === 'TOTAL' ? maps.length : maps.filter((m) => statusKey(m.status) === k).length

  return (
    <section className="overflow-hidden rounded-xl border border-line bg-white dark:bg-card">
      <div className="flex items-center justify-between border-b border-line bg-paper/40 dark:bg-surface/40 px-6 py-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-brass-deep dark:text-brass">Regulation Lifecycle</p>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8b98aa]">Circular → Compliance</p>
      </div>

      <div className="relative px-6 py-7">
        <div className="absolute left-0 right-0 top-[3.05rem] mx-12 h-px bg-gradient-to-r from-brass/30 via-brass/50 to-brass/30" />

        <div className="relative grid grid-cols-5 gap-2">
          {STAGES.map((s) => {
            const n = count(s.key)
            const active = n > 0
            return (
              <div key={s.key} className="flex flex-col items-center text-center">
                <div
                  className={[
                    'flex h-11 w-11 items-center justify-center rounded-full border-2 bg-white dark:bg-card font-serif text-lg font-semibold tabular-nums transition-colors',
                    active ? 'border-brass text-ink dark:text-[#e8edf5]' : 'border-line text-[#8b98aa]/40',
                  ].join(' ')}
                >
                  {n}
                </div>
                <p className="mt-3 text-xs font-semibold text-ink dark:text-[#e8edf5]">{s.label}</p>
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wide text-[#8b98aa]">{s.hint}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
