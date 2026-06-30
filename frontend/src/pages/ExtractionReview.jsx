import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useCirculars } from '../hooks/useCirculars'
import { useMaps } from '../hooks/useMaps'
import { getCircularById } from '../api/circulars'
import { recomputeProvenance } from '../api/insights'
import PriorityBadge from '../components/shared/PriorityBadge'
import StatusBadge from '../components/shared/StatusBadge'
import { SkeletonTableRows } from '../components/shared/Skeleton'
import {
  Brain, ChevronDown, BookOpen, Layers, AlertTriangle,
  Sparkles, Quote, RefreshCw, CheckCircle2, Microscope,
} from 'lucide-react'

// ── Helpers ───────────────────────────────────────────────────────────────────

const CONF_CLS = (s) => {
  if (!s) return 'text-[#8b98aa]'
  if (s >= 0.85) return 'text-success-700 dark:text-green-400'
  if (s >= 0.65) return 'text-warning-700 dark:text-amber-400'
  return 'text-danger-700 dark:text-red-400'
}

const PRIORITY_HIGHLIGHT = {
  Critical: { border: 'border-red-400',    bg: 'bg-red-50/80 dark:bg-red-900/20',    text: 'text-red-700 dark:text-red-300',    mark: '#FEE2E2' },
  High:     { border: 'border-orange-400', bg: 'bg-orange-50/80 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-300', mark: '#FFEDD5' },
  Medium:   { border: 'border-blue-400',   bg: 'bg-blue-50/80 dark:bg-blue-900/20',   text: 'text-blue-700 dark:text-blue-300',   mark: '#DBEAFE' },
  Low:      { border: 'border-slate-300',  bg: 'bg-slate-50/80 dark:bg-slate-800/20', text: 'text-slate-600 dark:text-slate-400', mark: '#F1F5F9' },
}

const PROVENANCE_METHOD_LABEL = {
  clause_anchored: 'Clause-Anchored',
  keyword_match:   'Keyword Match',
  sentence_jaccard: 'Semantic Match',
}

const RISK_BADGE = {
  Critical: 'bg-danger-50 dark:bg-red-900/30 border-danger-200 dark:border-red-800/60 text-danger-700 dark:text-red-400',
  High:     'bg-warning-50 dark:bg-amber-900/30 border-warning-200 dark:border-amber-800/60 text-warning-700 dark:text-amber-400',
  Medium:   'bg-brass-soft dark:bg-brass/10 border-brass/40 dark:border-brass/30 text-brass-deep dark:text-brass',
  Low:      'bg-success-50 dark:bg-green-900/30 border-success-200 dark:border-green-800/60 text-success-700 dark:text-green-400',
}

// ── Document viewer with char-offset highlighting ─────────────────────────────

function HighlightedText({ content, highlights, onHighlightClick }) {
  if (!content) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-[#8b98aa]">No content available for this circular.</p>
      </div>
    )
  }

  // Sort highlights by start offset
  const sorted = [...highlights]
    .filter((h) => h.start != null && h.end != null && h.start < h.end)
    .sort((a, b) => a.start - b.start)

  if (!sorted.length) {
    // No character-offset highlights — render plain paragraphs
    return (
      <div className="text-[13px] leading-relaxed text-gray-700 dark:text-[#e8edf5]/80 whitespace-pre-line font-sans">
        {content}
      </div>
    )
  }

  // Build array of plain + highlighted segments
  const segments = []
  let cursor = 0

  for (const h of sorted) {
    const start = Math.max(h.start, cursor)
    const end   = Math.min(h.end, content.length)
    if (start > cursor) {
      segments.push({ type: 'plain', text: content.slice(cursor, start) })
    }
    if (start < end) {
      segments.push({ type: 'highlight', text: content.slice(start, end), meta: h })
      cursor = end
    }
  }
  if (cursor < content.length) {
    segments.push({ type: 'plain', text: content.slice(cursor) })
  }

  return (
    <div className="text-[13px] leading-relaxed font-sans whitespace-pre-wrap">
      {segments.map((seg, i) => {
        if (seg.type === 'plain') {
          return (
            <span key={i} className="text-gray-700 dark:text-[#e8edf5]/75">
              {seg.text}
            </span>
          )
        }
        const { meta } = seg
        const cfg      = PRIORITY_HIGHLIGHT[meta.priority] || PRIORITY_HIGHLIGHT.Low
        const isActive = meta.isActive

        return (
          <button
            key={i}
            onClick={() => onHighlightClick && onHighlightClick(meta.mapId)}
            title={`${meta.priority} · ${meta.department} · Click to select MAP`}
            className={`
              inline rounded px-0.5 cursor-pointer transition-all duration-150
              ${isActive
                ? `${cfg.bg} ring-2 ring-offset-0 ${cfg.border.replace('border-', 'ring-')} shadow-sm`
                : `${cfg.bg} hover:ring-1 hover:ring-offset-0 ${cfg.border.replace('border-', 'ring-')}`
              }
              ${cfg.text}
            `}
            style={{ boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone' }}
          >
            {seg.text}
          </button>
        )
      })}
    </div>
  )
}

// Fallback: clause-section based highlighting (existing behaviour)
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

function CircularTextFallback({ content, selectedClauseRef, sectionRefs }) {
  const sections = useMemo(() => parseCircularSections(content), [content])

  if (!sections.length) {
    return (
      <div className="text-[13px] leading-relaxed text-gray-700 dark:text-[#e8edf5]/80 whitespace-pre-line font-sans">
        {content}
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

// ── Evidence badge on MAP cards ───────────────────────────────────────────────

function EvidenceBadge({ map, isSelected }) {
  if (!map.evidence_quote) return null

  const method  = PROVENANCE_METHOD_LABEL[map.provenance_method] || 'Auto-detected'
  const sim     = map.evidence_similarity != null ? Math.round(map.evidence_similarity * 100) : null

  if (!isSelected) {
    return (
      <div className="mt-2 flex items-center gap-1.5">
        <Quote size={9} className="text-violet-500 dark:text-violet-400 flex-shrink-0" />
        <p className="font-mono text-[9px] text-violet-600 dark:text-violet-400 line-clamp-1">
          Evidence located · {method}
        </p>
        {sim != null && (
          <span className="ml-auto font-mono text-[9px] text-[#8b98aa]">{sim}%</span>
        )}
      </div>
    )
  }

  return (
    <div className="mt-3 rounded-md border border-violet-200 dark:border-violet-800/60 bg-violet-50/50 dark:bg-violet-900/20 px-3 py-2.5">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Quote size={10} className="text-violet-500 flex-shrink-0" />
        <p className="font-mono text-[9px] uppercase tracking-wide text-violet-600 dark:text-violet-400">
          Clause Evidence · {method}
          {sim != null && <span className="ml-2 text-[#8b98aa]">({sim}% match)</span>}
        </p>
      </div>
      <blockquote className="border-l-2 border-violet-300 dark:border-violet-700 pl-2">
        <p className="text-[11px] leading-relaxed text-violet-800 dark:text-violet-200 line-clamp-3 italic">
          "{map.evidence_quote}"
        </p>
      </blockquote>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ExtractionReview() {
  const { circulars, byId, loading: circsLoading } = useCirculars()
  const { maps, loading: mapsLoading, refresh }    = useMaps()

  const [selectedCircularId, setSelectedCircularId] = useState(() => circulars[0]?.id ?? '')
  const [selectedMapId, setSelectedMapId]           = useState(null)
  const [recomputing, setRecomputing]               = useState(false)
  const [recomputeDone, setRecomputeDone]           = useState(false)

  const sectionRefs = useRef({})
  const highlightRef = useRef(null)

  useEffect(() => {
    if (!selectedCircularId && circulars.length) {
      setSelectedCircularId(circulars[0].id)
    }
  }, [circulars, selectedCircularId])

  const circular  = byId[selectedCircularId]

  // The /circulars list endpoint omits `content` (CircularSummaryOut) for
  // performance, so byId[...] never has the full text. Fetch the detail
  // record (CircularOut, which includes content) whenever the selection changes.
  const [fullContent, setFullContent]       = useState('')
  const [contentLoading, setContentLoading] = useState(false)

  useEffect(() => {
    if (!selectedCircularId) { setFullContent(''); return }
    let alive = true
    setContentLoading(true)
    setFullContent('')
    getCircularById(selectedCircularId)
      .then((c) => { if (alive) setFullContent(c?.content ?? '') })
      .catch(() => { if (alive) setFullContent('') })
      .finally(() => { if (alive) setContentLoading(false) })
    return () => { alive = false }
  }, [selectedCircularId])

  const circlMaps = useMemo(
    () => maps.filter((m) => m.circular_id === selectedCircularId),
    [maps, selectedCircularId],
  )
  const selectedMap = useMemo(
    () => circlMaps.find((m) => m.id === selectedMapId) ?? null,
    [circlMaps, selectedMapId],
  )

  // Check if any MAPs have evidence (char-offset mode)
  const hasEvidence = useMemo(
    () => circlMaps.some((m) => m.evidence_start_offset != null),
    [circlMaps],
  )

  // Build highlight descriptors for HighlightedText
  const highlights = useMemo(() => {
    if (!hasEvidence) return []
    return circlMaps
      .filter((m) => m.evidence_start_offset != null && m.evidence_end_offset != null)
      .map((m) => ({
        mapId:      m.id,
        start:      m.evidence_start_offset,
        end:        m.evidence_end_offset,
        priority:   m.priority,
        department: m.department,
        isActive:   m.id === selectedMapId,
      }))
  }, [circlMaps, selectedMapId, hasEvidence])

  const handleMapClick = useCallback((m) => {
    setSelectedMapId((prev) => (prev === m.id ? null : m.id))
    // Scroll to evidence highlight in document
    if (m.evidence_start_offset != null) {
      // Scroll the document pane to the highlighted element
      setTimeout(() => {
        const el = document.querySelector(`[data-evidence-map="${m.id}"]`)
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 50)
    } else if (m.source_clause) {
      const el = sectionRefs.current[m.source_clause]
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [])

  const handleHighlightClick = useCallback((mapId) => {
    setSelectedMapId((prev) => (prev === mapId ? null : mapId))
  }, [])

  const handleRecompute = useCallback(async () => {
    if (!selectedCircularId || recomputing) return
    setRecomputing(true)
    setRecomputeDone(false)
    try {
      await recomputeProvenance(selectedCircularId)
      await refresh()
      setRecomputeDone(true)
      setTimeout(() => setRecomputeDone(false), 3000)
    } catch { /* non-fatal */ }
    finally { setRecomputing(false) }
  }, [selectedCircularId, recomputing, refresh])

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
            onChange={(e) => {
              setSelectedCircularId(e.target.value)
              setSelectedMapId(null)
              setRecomputeDone(false)
            }}
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
            {circlMaps.length} MAP{circlMaps.length !== 1 ? 's' : ''}
          </span>
        )}

        {/* Evidence mode indicator */}
        {hasEvidence && (
          <div className="flex items-center gap-1.5 rounded-md border border-violet-200 dark:border-violet-800/60 bg-violet-50 dark:bg-violet-900/20 px-2.5 py-1">
            <Microscope size={10} className="text-violet-500" />
            <span className="font-mono text-[9px] text-violet-600 dark:text-violet-400">
              Clause Provenance Active
            </span>
          </div>
        )}

        {/* Recompute button */}
        {selectedCircularId && (
          <button
            onClick={handleRecompute}
            disabled={recomputing}
            className="flex items-center gap-1.5 rounded-md border border-line bg-white dark:bg-card px-2.5 py-1 text-[10px] text-[#8b98aa] hover:text-ink dark:hover:text-[#e8edf5] hover:border-line/60 transition-colors disabled:opacity-50"
          >
            {recomputeDone
              ? <><CheckCircle2 size={11} className="text-emerald-500" /> Evidence refreshed</>
              : recomputing
              ? <><RefreshCw size={11} className="animate-spin" /> Computing…</>
              : <><RefreshCw size={11} /> Recompute Evidence</>
            }
          </button>
        )}

        {selectedMap && (
          <div className="ml-auto flex items-center gap-2 rounded-lg border border-brass/30 dark:border-brass/20 bg-brass-soft dark:bg-brass/10 px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-brass animate-pulse" />
            <span className="font-mono text-[10px] font-semibold text-brass-deep dark:text-brass">
              {hasEvidence ? 'Evidence highlighted' : 'Clause highlighted'}
            </span>
          </div>
        )}
      </div>

      {/* ── Split view ── */}
      <div className="flex gap-5 min-h-0 flex-1">
        {/* LEFT: Circular text with highlights */}
        <div className="flex-1 min-w-0 flex flex-col rounded-xl border border-line bg-white dark:bg-card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-line bg-paper/40 dark:bg-surface/40 px-5 py-3 flex-shrink-0">
            <BookOpen size={13} className="text-brass" />
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#8b98aa]">
              Source Circular Document
            </p>
            {hasEvidence && (
              <span className="ml-auto font-mono text-[9px] text-violet-500 dark:text-violet-400">
                Click highlighted text to select MAP
              </span>
            )}
            {!hasEvidence && selectedMap && (
              <span className="ml-auto font-mono text-[9px] text-brass">
                Scroll to: {selectedMap.source_clause}
              </span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-5" ref={highlightRef}>
            {loading || contentLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="skeleton h-4 rounded" style={{ width: `${65 + (i % 4) * 8}%` }} />
                ))}
              </div>
            ) : hasEvidence ? (
              <HighlightedText
                content={fullContent}
                highlights={highlights}
                onHighlightClick={handleHighlightClick}
              />
            ) : (
              <CircularTextFallback
                content={fullContent}
                selectedClauseRef={selectedMap?.source_clause ?? null}
                sectionRefs={sectionRefs}
              />
            )}
          </div>

          {/* Legend */}
          {hasEvidence && (
            <div className="border-t border-line px-5 py-2 flex-shrink-0 flex items-center gap-4">
              {Object.entries(PRIORITY_HIGHLIGHT).map(([p, cfg]) => (
                <div key={p} className="flex items-center gap-1.5">
                  <span className={`inline-block h-3 w-6 rounded ${cfg.bg} border ${cfg.border}`} />
                  <span className="font-mono text-[9px] text-[#8b98aa]">{p}</span>
                </div>
              ))}
            </div>
          )}
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
                const cfg        = PRIORITY_HIGHLIGHT[m.priority] || PRIORITY_HIGHLIGHT.Low

                return (
                  <button
                    key={m.id}
                    data-evidence-map={m.id}
                    onClick={() => handleMapClick(m)}
                    className={`w-full text-left px-5 py-4 transition-colors ${
                      isSelected
                        ? `${cfg.bg} border-l-2 ${cfg.border}`
                        : 'hover:bg-paper/60 dark:hover:bg-surface/60 border-l-2 border-l-transparent'
                    }`}
                  >
                    {m.source_clause && (
                      <p className={`mb-1.5 font-mono text-[9px] font-semibold uppercase tracking-wide ${
                        isSelected ? cfg.text : 'text-[#8b98aa]'
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

                    {/* Evidence section */}
                    <EvidenceBadge map={m} isSelected={isSelected} />

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
              {hasEvidence
                ? 'Click a MAP to see its exact source clause · highlighted in document'
                : 'Click a MAP to highlight its source clause · AI extraction by Local AI Engine'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
