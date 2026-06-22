import { useEffect, useRef } from 'react'
import {
  X, FileText, Brain, Building2, AlertTriangle,
  Sparkles, FolderOpen, ExternalLink, BookOpen,
} from 'lucide-react'

const EVIDENCE_ICON = {
  policy:      { icon: FileText,     cls: 'text-blue-500 dark:text-blue-400',     bg: 'bg-blue-50 dark:bg-blue-900/30'    },
  report:      { icon: FolderOpen,   cls: 'text-violet-500 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/30'},
  screenshot:  { icon: ExternalLink, cls: 'text-[#8b98aa]',                       bg: 'bg-paper dark:bg-surface'          },
  certificate: { icon: BookOpen,     cls: 'text-brass',                            bg: 'bg-brass-soft dark:bg-brass/10'   },
  log:         { icon: FileText,     cls: 'text-[#8b98aa]',                       bg: 'bg-paper dark:bg-surface'          },
  minutes:     { icon: FileText,     cls: 'text-green-600 dark:text-green-400',   bg: 'bg-green-50 dark:bg-green-900/30' },
  contract:    { icon: FileText,     cls: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/30'},
  approval:    { icon: BookOpen,     cls: 'text-brass',                            bg: 'bg-brass-soft dark:bg-brass/10'   },
  template:    { icon: FileText,     cls: 'text-blue-500 dark:text-blue-400',     bg: 'bg-blue-50 dark:bg-blue-900/30'   },
  disclosure:  { icon: ExternalLink, cls: 'text-red-500 dark:text-red-400',       bg: 'bg-red-50 dark:bg-red-900/30'     },
}

const CONF_COLOR = (s) => {
  if (s >= 0.9)  return { bar: 'bg-success', text: 'text-success-700 dark:text-green-400',   label: 'Very High' }
  if (s >= 0.75) return { bar: 'bg-warning', text: 'text-warning-700 dark:text-amber-400',   label: 'High'      }
  if (s >= 0.6)  return { bar: 'bg-brass',   text: 'text-brass-deep dark:text-brass',        label: 'Medium'    }
  return                 { bar: 'bg-danger',  text: 'text-danger-700 dark:text-red-400',      label: 'Low'       }
}

function Section({ icon: Icon, title, children, accent = false }) {
  return (
    <div className={`rounded-lg border p-4 ${
      accent
        ? 'border-primary-200 dark:border-primary-800/60 bg-primary-50/40 dark:bg-primary-900/20'
        : 'border-line bg-paper/30 dark:bg-surface/60'
    }`}>
      <div className="mb-2.5 flex items-center gap-2">
        <Icon size={13} className={accent ? 'text-primary-500 dark:text-primary-400' : 'text-brass'} />
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#8b98aa]">
          {title}
        </p>
      </div>
      {children}
    </div>
  )
}

export default function TraceabilityDrawer({ map, circular, onClose }) {
  const overlayRef = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  if (!map) return null

  const conf    = map.confidence_score ?? 0
  const confCfg = CONF_COLOR(conf)

  return (
    <>
      {/* Backdrop */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-50 bg-black/30 dark:bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <aside className="fixed right-0 top-0 z-50 flex h-full w-[480px] max-w-[95vw] flex-col bg-white dark:bg-surface shadow-2xl animate-slideIn overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4 flex-shrink-0 bg-white dark:bg-card">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Brain size={14} className="text-violet-500 flex-shrink-0" />
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#8b98aa]">
                AI Traceability
              </p>
            </div>
            <h3 className="font-serif text-base font-semibold leading-snug text-ink dark:text-[#e8edf5]">
              Why was this MAP generated?
            </h3>
            {map.source_clause && (
              <p className="mt-1 font-mono text-[10px] text-brass">
                {map.source_clause}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="mt-0.5 flex-shrink-0 rounded-md p-1.5 text-[#8b98aa] hover:bg-line/40 dark:hover:bg-card transition-colors"
            aria-label="Close traceability drawer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* 1. Original Clause */}
          {map.clause_text && (
            <Section icon={BookOpen} title="Original Regulatory Clause" accent>
              <blockquote className="border-l-2 border-primary-300 dark:border-primary-700 pl-3">
                <p className="text-[12.5px] leading-relaxed text-gray-700 dark:text-[#e8edf5]/80 italic">
                  "{map.clause_text}"
                </p>
              </blockquote>
              {circular && (
                <div className="mt-2 flex items-center gap-1.5">
                  <Building2 size={10} className="text-[#8b98aa]" />
                  <span className="font-mono text-[10px] text-[#8b98aa]">
                    {circular.source} — {circular.title}
                  </span>
                </div>
              )}
            </Section>
          )}

          {/* 2. AI Reasoning */}
          {map.reasoning && (
            <Section icon={Brain} title="AI Extraction Reasoning">
              <p className="text-[12.5px] leading-relaxed text-gray-700 dark:text-[#e8edf5]/80">
                {map.reasoning}
              </p>
            </Section>
          )}

          {/* 3. Department Selection */}
          {map.dept_reason && (
            <Section icon={Building2} title="Why this Department?">
              <p className="text-[12.5px] leading-relaxed text-gray-700 dark:text-[#e8edf5]/80">
                {map.dept_reason}
              </p>
            </Section>
          )}

          {/* 4. Priority Justification */}
          {map.priority_reason && (
            <Section icon={AlertTriangle} title="Priority Justification">
              <p className="text-[12.5px] leading-relaxed text-gray-700 dark:text-[#e8edf5]/80">
                {map.priority_reason}
              </p>
            </Section>
          )}

          {/* 5. Confidence Score */}
          <Section icon={Sparkles} title="AI Confidence Score">
            <div className="flex items-baseline gap-3 mb-2">
              <span className={`font-mono text-2xl font-bold tabular-nums ${confCfg.text}`}>
                {Math.round(conf * 100)}%
              </span>
              <span className={`font-mono text-[10px] font-semibold uppercase tracking-wide ${confCfg.text}`}>
                {confCfg.label} Confidence
              </span>
            </div>
            <div className="h-2 rounded-full bg-line dark:bg-card overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${confCfg.bar}`}
                style={{ width: `${Math.round(conf * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-[#8b98aa]">
              Reflects clause ambiguity, keyword precision, and cross-reference strength in the source document.
            </p>
          </Section>

          {/* 6. Evidence Documents */}
          {map.evidence_docs?.length > 0 && (
            <Section icon={FolderOpen} title="Suggested Evidence Documents">
              <div className="space-y-2">
                {map.evidence_docs.map((doc, i) => {
                  const cfg = EVIDENCE_ICON[doc.type] || EVIDENCE_ICON.report
                  const Icon = cfg.icon
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-md border border-line px-3 py-2"
                    >
                      <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded ${cfg.bg}`}>
                        <Icon size={12} className={cfg.cls} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-medium text-ink dark:text-[#e8edf5]">
                          {doc.name}
                        </p>
                        <p className="font-mono text-[9px] uppercase tracking-wide text-[#8b98aa]">
                          {doc.type}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Section>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-line px-6 py-3 flex-shrink-0 bg-white dark:bg-card">
          <p className="font-mono text-[10px] text-[#8b98aa]">
            Generated by Claude claude-sonnet-4-6 · PRAGMA AI Engine · {map.created_at?.slice(0, 10)}
          </p>
        </div>
      </aside>
    </>
  )
}
