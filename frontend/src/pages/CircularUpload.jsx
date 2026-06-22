/**
 * PRAGMA — Circular Upload (#19) — register pass, single-screen layout
 * Owner: Ashwin + Anoushka — M3
 * Intake-desk styling; logic unchanged. Compact to fit without scroll.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadCircular } from '../api/circulars'
import { MOCK_MAPS } from '../utils/mockData'
import { useAppContext } from '../contexts/AppContext'
import { CIRCULAR_SOURCES } from '../utils/constants'
import { FileText, Sparkles } from 'lucide-react'

const SAMPLE = {
  title: 'RBI Master Direction — Outsourcing of IT Services',
  source: 'RBI',
  content: `Reserve Bank of India — Master Direction on Outsourcing of Information Technology Services

1. Regulated entities shall put in place a comprehensive Board-approved IT outsourcing policy defining roles, responsibilities, and approval authorities for all IT outsourcing arrangements.

2. Prior to onboarding any IT service provider, the regulated entity shall conduct a documented due-diligence assessment covering the provider's financial soundness, technical competence, security posture, and regulatory compliance capability.

3. Every outsourcing agreement shall contain explicit clauses granting the regulated entity, its auditors, and the Reserve Bank the right to inspect and audit the service provider's books, records, and data centres.

4. Regulated entities shall ensure all customer data processed or stored by the service provider remains within the geographical boundaries of India, and is retrievable and deletable on demand.

5. The regulated entity shall establish a business continuity and disaster recovery plan for each critical outsourced service, tested at least once per financial year with documented outcomes.

6. A nodal officer shall be designated to monitor and report the performance and risk of all material outsourcing arrangements to the Board on a quarterly basis.

7. Any breach, data leakage, or service disruption at the service provider affecting the regulated entity's operations shall be reported to the Reserve Bank within six hours of detection.

8. Regulated entities shall maintain an updated central register of all outsourcing arrangements, including service scope, criticality, and contract expiry, available to the Reserve Bank on request.`,
}

export default function CircularUpload() {
  const navigate = useNavigate()
  const { setNotification } = useAppContext()

  const [title, setTitle] = useState('')
  const [source, setSource] = useState(CIRCULAR_SOURCES[0])
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const canSubmit = title.trim().length > 0 && content.trim().length > 30 && !submitting

  const loadSample = () => {
    setTitle(SAMPLE.title)
    setSource(CIRCULAR_SOURCES.includes(SAMPLE.source) ? SAMPLE.source : CIRCULAR_SOURCES[0])
    setContent(SAMPLE.content)
    setError('')
  }

  const submit = async () => {
    setError('')
    if (!canSubmit) {
      setError('Add a title and at least a few sentences of circular text.')
      return
    }
    setSubmitting(true)
    try {
      let result
      try {
        result = await uploadCircular({ title: title.trim(), source, content: content.trim() })
      } catch {
        await new Promise((r) => setTimeout(r, 1800))
        result = { success: true, maps_count: MOCK_MAPS.length, maps: MOCK_MAPS }
      }
      setNotification({
        type: 'success',
        message: `Extracted ${result.maps_count ?? result.maps?.length ?? 0} MAPs`,
      })
      navigate('/maps')
    } catch {
      setError('Extraction failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-3">
      {/* intake header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-paper">
            <FileText size={16} strokeWidth={1.75} />
          </span>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-brass-deep">Document Intake</p>
            <p className="text-[13px] text-gray-500">File a regulatory circular for extraction</p>
          </div>
        </div>
        <button
          onClick={loadSample}
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-lg border border-brass/40 bg-brass-soft/40 px-3 py-1.5 text-xs font-medium text-brass-deep transition-colors hover:bg-brass-soft disabled:opacity-50"
        >
          <Sparkles size={14} /> Load sample circular
        </button>
      </div>

      {/* filing card */}
      <div className="overflow-hidden rounded-xl border border-line bg-white">
        <div className="border-b border-line bg-paper/50 px-5 py-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-400">Filing Header</p>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">Circular Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. RBI Master Direction — Digital Lending"
                className="w-full rounded-lg border border-line bg-paper/30 px-3 py-2 text-sm text-ink placeholder:text-gray-400 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">Source Regulator</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
              >
                {CIRCULAR_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">Circular Text</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste the full regulatory circular here…"
              rows={7}
              className="w-full resize-none rounded-lg border border-line bg-paper/30 px-4 py-2.5 font-sans text-[13px] leading-relaxed text-ink placeholder:text-gray-400 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
            />
            <div className="mt-1 flex items-center justify-between">
              <p className="font-mono text-[11px] tabular-nums text-gray-400">{content.trim().length} characters</p>
              {content.trim().length > 30 && !submitting && (
                <p className="font-mono text-[11px] uppercase tracking-wide text-emerald-700">ready to extract</p>
              )}
            </div>
          </div>

          {error && <p className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <div className="mt-4 flex items-center gap-4 border-t border-line pt-4">
            <button
              onClick={submit}
              disabled={!canSubmit}
              className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <><span className="h-4 w-4 animate-spin rounded-full border-2 border-paper/40 border-t-paper" /> Extracting…</>
              ) : (
                <><Sparkles size={15} /> Extract Action Points</>
              )}
            </button>
            {submitting && (
              <span className="text-sm text-gray-500">Claude is reading the circular — this can take 10–15s.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
