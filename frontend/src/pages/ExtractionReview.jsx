import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useCirculars } from '../hooks/useCirculars'
import { useMaps } from '../hooks/useMaps'
import PriorityBadge from '../components/shared/PriorityBadge'
import StatusBadge from '../components/shared/StatusBadge'
import { SkeletonTableRows } from '../components/shared/Skeleton'
import { Brain, ChevronDown, BookOpen, Layers, AlertTriangle, Sparkles } from 'lucide-react'

const CONF_CLS = (s) => {
  if (!s) return 'text-[#8b98aa]'
  if (s >= 0.85) return 'text-success-700 dark:text-green-400'
  if (s >= 0.65) return 'text-warning-700 dark:text-amber-400'
  return 'text-danger-700 dark:text-red-400'
}

const RISK_BADGE = {
  Critical: 'bg-danger-50 dark:bg-red-900/30 border-danger-200 dark:border-red-800/60 text-danger-700 dark:text-red-400',
  High:     'bg-warning-50 dark:bg-amber-900/30 border-warning-200 dark:border-amber-800/60 text-warning-700 dark:text-amber-400',
  Medium:   'bg-brass-soft dark:bg-brass/10 border-brass/40 dark:border-brass/30 text-brass-deep dark:text-brass',
  Low:      'bg-success-50 dark:bg-green-900/30 border-success-200 dark:border-green-800/60 text-success-700 dark:text-green-400',
}

function parseCircularSections(content = '') {
  if (!content) return []
  const sections = []
  let preamble = []
  let inSection = false
  let current = null

  const lines = content.split('\n')
  for (const line of lines) {
    const clauseMatch = line.match(/^(§\s*[\d.]+\s*—\s*.+)/)
    if (clauseMatch) {
      if (current) sections.push(current)
      else if (preamble.length) sections.push({ heading: null, clauseRef: null, text: preamble.join('\n').trim() })
      current = { heading: line.trim(), clauseRef: line.trim(), text: '' }
      preamble = []
      inSection = true
    } else if (!inSection) {
      preamble.push(line)
    } else if (current) {
      current.text = (current.text ? current.text + '\n' : '') + line
    }
  }
  if (current) sections.push(current)
  return sections
}

function CircularText({ content, selectedClauseRef, sectionRefs }) {
  const sections = useMemo(() => parseCircularSections(content), [content])

  if (!sections.length) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-[#8b98aa]">No content available for this circular.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 text-[13px] leading-relaxed font-sans">
      {sections.map((s, i) => {
        const isHighlighted = s.clauseRef && selectedClauseRef && (
          s.clauseRef === selectedClauseRef ||
          s.clauseRef.includes(selectedClauseRef) ||
          selectedClauseRef.includes(s.clauseRef)
        )
        return (
          <div
            key={i}
            ref={(el) => { if (s.clauseRef) sectionRefs.current[s.clauseRef] = el }}
            className={`rounded-lg transition-all duration-300 ${
              s.heading
                ? `border p-4 ${isHighlighted
                    ? 'border-brass bg-brass-soft dark:bg-brass/10 shadow-sm'
                    : 'border-line bg-paper/20 dark:bg-surface/40'
                  }`
                : 'text-[#8b98aa]'
            }`}
          >
            {s.heading && (
              <div className="mb-2 flex items-start gap-2">
                {isHighlighted && (
                  <span className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-brass animate-pulse" />
                )}
                <p className={`font-mono text-[11px] font-bold uppercase tracking-wide ${
                  isHighlighted ? 'text-brass-deep dark:text-brass' : 'text-[#8b98aa]'
                }`}>
                  {s.heading}
                </p>
              </div>
            )}
            {s.text && (
              <p className={`whitespace-pre-line ${
                s.heading
                  ? isHighlighted
                    ? 'text-ink dark:text-[#e8edf5]'
                    : 'text-gray-600 dark:text-[#e8edf5]/70'
                  : ''
              }`}>
                {s.text.trim()}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function ExtractionReview() {
  const { circulars, byId, loading: circsLoading } = useCirculars()
  const { maps, loading: mapsLoading } = useMaps()

  const [selectedCircularId, setSelectedCircularId] = useState(() => circulars[0]?.id ?? '')
  const [selectedMapId, setSelectedMapId]           = useState(null)

  const sectionRefs = useRef({})

  useEffect(() => {
    if (!selectedCircularId && circulars.length) {
      setSelectedCircularId(circulars[0].id)
    }
  }, [circulars, selectedCircularId])

  const circular  = byId[selectedCircularId]
  const circlMaps = useMemo(
    () => maps.filter((m) => m.circular_id === selectedCircularId),
    [maps, selectedCircularId],
  )
  const selectedMap = useMemo(
    () => circlMaps.find((m) => m.id === selectedMapId) ?? null,
    [circlMaps, selectedMapId],
  )

  const handleMapClick = useCallback((m) => {
    setSelectedMapId((prev) => (prev === m.id ? null : m.id))
    if (m.source_clause) {
      const el = sectionRefs.current[m.source_clause]
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [])

  const loading = circsLoading || mapsLoading

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-9rem)]">
      {/* ── Header row ── */}
      <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-brass" />
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#8b98aa]">
            AI Extraction Review
          </p>
        </div>
        <div className="h-4 w-px bg-line" />
        {/* Circular selector */}
        <div className="relative">
          <select
            value={selectedCircularId}
            onChange={(e) => { setSelectedCircularId(e.target.value); setSelectedMapId(null) }}
            className="appearance-none rounded-lg border border-line bg-white dark:bg-surface py-1.5 pl-3 pr-8 text-sm font-medium text-ink dark:text-[#e8edf5] focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400 min-w-[280px]"
          >
            {circulars.map((c) => (
              <option key={c.id} value={c.id}>{c.source} — {c.title}</option>
            ))}
          </select>
          <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8b98aa]" />
        </div>

        {circular && (
          <span className="font-mono text-[10px] text-[#8b98aa]">
            {circlMaps.length} MAP{circlMaps.length !== 1 ? 's' : ''} extracted
          </span>
        )}

        {selectedMap && (
          <div className="ml-auto flex items-center gap-2 rounded-lg border border-brass/30 dark:border-brass/20 bg-brass-soft dark:bg-brass/10 px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-brass animate-pulse" />
            <span className="font-mono text-[10px] font-semibold text-brass-deep dark:text-brass">
              Clause highlighted
            </span>
          </div>
        )}
      </div>

      {/* ── Split view ── */}
      <div className="flex gap-5 min-h-0 flex-1">
        {/* LEFT: Circular text */}
        <div className="flex-1 min-w-0 flex flex-col rounded-xl border border-line bg-white dark:bg-card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-line bg-paper/40 dark:bg-surface/40 px-5 py-3 flex-shrink-0">
            <BookOpen size={13} className="text-brass" />
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#8b98aa]">
              Source Circular Document
            </p>
            {selectedMap && (
              <span className="ml-auto font-mono text-[9px] text-brass">
                Scroll to: {selectedMap.source_clause}
              </span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="skeleton h-4 rounded" style={{ width: `${70 + (i % 3) * 10}%` }} />
                ))}
              </div>
            ) : (
              <CircularText
                content={circular?.content ?? ''}
                selectedClauseRef={selectedMap?.source_clause ?? null}
                sectionRefs={sectionRefs}
              />
            )}
          </div>
        </div>

        {/* RIGHT: MAPs panel */}
        <div className="w-96 flex-shrink-0 flex flex-col rounded-xl border border-line bg-white dark:bg-card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-line bg-paper/40 dark:bg-surface/40 px-5 py-3 flex-shrink-0">
            <Brain size={13} className="text-violet-500" />
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#8b98aa]">
              Extracted MAPs
            </p>
            <span className="ml-auto rounded-full bg-ink/10 dark:bg-surface px-2 py-0.5 font-mono text-[9px] text-[#8b98aa]">
              {circlMaps.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-line">
            {loading ? (
              <div className="p-4">
                <SkeletonTableRows rows={4} cols={1} />
              </div>
            ) : circlMaps.length === 0 ? (
              <div className="flex flex-col items-center gap-2 p-8 text-center">
                <Layers size={24} className="text-gray-200 dark:text-[#203247]" />
                <p className="text-sm text-[#8b98aa]">
                  No MAPs extracted from this circular yet.
                </p>
              </div>
            ) : (
              circlMaps.map((m) => {
                const isSelected = selectedMapId === m.id
                return (
                  <button
                    key={m.id}
                    onClick={() => handleMapClick(m)}
                    className={`w-full text-left px-5 py-4 transition-colors ${
                      isSelected
                        ? 'bg-brass-soft dark:bg-brass/10 border-l-2 border-l-brass'
                        : 'hover:bg-paper/60 dark:hover:bg-surface/60 border-l-2 border-l-transparent'
                    }`}
                  >
                    {m.source_clause && (
                      <p className={`mb-1.5 font-mono text-[9px] font-semibold uppercase tracking-wide ${
                        isSelected ? 'text-brass-deep dark:text-brass' : 'text-[#8b98aa]'
                      }`}>
                        {m.source_clause}
                      </p>
                    )}

                    <p className={`text-[12px] leading-snug line-clamp-3 ${
                      isSelected ? 'text-ink dark:text-[#e8edf5] font-medium' : 'text-gray-700 dark:text-[#e8edf5]/80'
                    }`}>
                      {m.action}
                    </p>

                    <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                      <PriorityBadge priority={m.priority} />
                      <StatusBadge status={m.status} />
                      <span className="font-mono text-[10px] text-[#8b98aa]">
                        {m.department}
                      </span>
                      {m.confidence_score != null && (
                        <span className={`ml-auto font-mono text-[10px] tabular-nums ${CONF_CLS(m.confidence_score)}`}>
                          <Sparkles size={9} className="inline mr-0.5" />
                          {Math.round(m.confidence_score * 100)}%
                        </span>
                      )}
                    </div>

                    {m.risk?.level && (
                      <div className="mt-2">
                        <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${RISK_BADGE[m.risk.level] || ''}`}>
                          <AlertTriangle size={8} />
                          {m.risk.level} Risk · {m.risk.score}/100
                        </span>
                      </div>
                    )}

                    {isSelected && m.reasoning && (
                      <div className="mt-3 rounded-md border border-violet-200 dark:border-violet-800/60 bg-violet-50/50 dark:bg-violet-900/20 px-3 py-2">
                        <p className="font-mono text-[9px] uppercase tracking-wide text-violet-500 dark:text-violet-400 mb-1">AI Reasoning</p>
                        <p className="text-[11px] leading-relaxed text-violet-700 dark:text-violet-300 line-clamp-3">
                          {m.reasoning}
                        </p>
                      </div>
                    )}
                  </button>
                )
              })
            )}
          </div>

          <div className="border-t border-line px-5 py-2.5 flex-shrink-0">
            <p className="font-mono text-[10px] text-[#8b98aa]">
              Click a MAP to highlight its source clause · AI extraction by Claude
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
