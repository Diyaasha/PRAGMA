import { useState } from 'react'
import { useMaps } from '../hooks/useMaps'
import { useCirculars } from '../hooks/useCirculars'
import { createApproval } from '../api/approvals'
import { useAppContext } from '../contexts/AppContext'
import PriorityBadge from '../components/shared/PriorityBadge'
import { SkeletonCard } from '../components/shared/Skeleton'
import { formatDateTime, formatDate } from '../utils/formatters'
import {
  Check, X, Sparkles, Clock, Building2, FileText,
  AlertTriangle, Shield, ExternalLink, ChevronDown, ChevronUp,
} from 'lucide-react'

const key = (s) => (s || '').toString().trim().toUpperCase().replace(/\s+/g, '_')
const REVIEWER = 'Compliance Officer'

function ConfidenceBadge({ score }) {
  if (score == null) return null
  const pct = Math.round(score * 100)
  const cls = score >= 0.85
    ? 'bg-success-50 text-success-700 border-success-200'
    : score >= 0.65
    ? 'bg-warning-50 text-warning-700 border-warning-200'
    : 'bg-danger-50  text-danger-700  border-danger-200'
  return (
    <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold ${cls}`}>
      <Sparkles size={9} />
      AI Confidence: {pct}%
    </span>
  )
}

function ConfirmModal({ decision, mapAction, onConfirm, onCancel, busy }) {
  const isApprove = decision === 'APPROVED'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="mx-4 w-full max-w-md rounded-2xl border border-line bg-white dark:bg-card p-6 shadow-xl">
        <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
          isApprove ? 'bg-success/10' : 'bg-danger/10'
        }`}>
          {isApprove
            ? <Check size={26} className="text-success" strokeWidth={2.5} />
            : <AlertTriangle size={26} className="text-danger" />
          }
        </div>

        <h2 className={`text-center font-serif text-lg font-semibold ${
          isApprove ? 'text-success-700' : 'text-danger-700'
        }`}>
          Confirm {isApprove ? 'Approval' : 'Rejection'}
        </h2>

        <p className="mt-2 text-center text-[13px] leading-relaxed text-gray-600 dark:text-[#e8edf5]/80">
          Are you sure you want to{' '}
          <strong className={isApprove ? 'text-success-700' : 'text-danger-700'}>
            {isApprove ? 'approve' : 'reject'}
          </strong>{' '}
          this action point? This decision will be permanently recorded in the compliance audit ledger.
        </p>

        <div className="mt-4 rounded-lg border border-line bg-paper/60 dark:bg-surface/60 px-3 py-2">
          <p className="line-clamp-2 text-[12px] italic text-gray-600 dark:text-[#e8edf5]/70">"{mapAction}"</p>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#8b98aa]">
          <Shield size={10} />
          <span>Reviewed by {REVIEWER} · Logged to audit trail</span>
        </div>

        <div className="mt-5 flex gap-3">
          <button
            onClick={onCancel}
            disabled={busy}
            className="flex-1 rounded-lg border border-line bg-white dark:bg-surface py-2.5 text-sm font-medium text-gray-600 dark:text-[#e8edf5] transition-colors hover:bg-paper dark:hover:bg-card disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-60 ${
              isApprove
                ? 'bg-success hover:bg-success-700'
                : 'bg-danger  hover:bg-danger-700'
            }`}
          >
            {busy ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                {isApprove ? 'Approving…' : 'Rejecting…'}
              </>
            ) : (
              <>{isApprove ? <Check size={15} strokeWidth={2.5} /> : <X size={15} strokeWidth={2.5} />}
                Confirm {isApprove ? 'Approval' : 'Rejection'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function CircularInfo({ circular }) {
  const [open, setOpen] = useState(false)
  if (!circular) return null
  return (
    <div className="rounded-lg border border-brass/20 bg-brass-soft/40 dark:bg-brass/5">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-3 py-2 text-[12px] text-brass-deep dark:text-brass hover:bg-brass-soft/60 dark:hover:bg-brass/10"
      >
        <div className="flex items-center gap-1.5">
          <ExternalLink size={11} className="text-brass" />
          <span className="font-semibold">View Source Circular</span>
          <span className="ml-1 font-mono text-[10px] text-brass/70">{circular.source}</span>
        </div>
        {open
          ? <ChevronUp size={12} className="text-brass/60" />
          : <ChevronDown size={12} className="text-brass/60" />
        }
      </button>
      {open && (
        <div className="border-t border-brass/20 px-3 py-2.5 animate-fadeIn">
          <p className="font-semibold text-[13px] text-ink dark:text-[#e8edf5]">{circular.title}</p>
          <div className="mt-1.5 flex flex-wrap gap-3 text-[11px] text-[#8b98aa]">
            <span className="flex items-center gap-1">
              <Building2 size={10} /> {circular.source}
            </span>
            {circular.date && (
              <span className="flex items-center gap-1">
                <Clock size={10} /> {formatDate(circular.date)}
              </span>
            )}
          </div>
          {circular.reference_number && (
            <p className="mt-1 font-mono text-[10px] text-[#8b98aa]">
              Ref: {circular.reference_number}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function ApprovalCard({ map, circular, onResolved }) {
  const { setNotification } = useAppContext()
  const [note, setNote]               = useState('')
  const [busy, setBusy]               = useState(null)
  const [done, setDone]               = useState(null)
  const [pendingDecision, setPending] = useState(null)

  const requestDecision = (decision) => setPending(decision)
  const cancelDecision  = () => setPending(null)

  const confirmDecision = async () => {
    const decision = pendingDecision
    setBusy(decision)
    setPending(null)
    try {
      await createApproval({ map_id: map.id, decision, reviewer: REVIEWER, comments: note })
      setNotification({
        type:    decision === 'APPROVED' ? 'success' : 'error',
        message: `MAP ${decision === 'APPROVED' ? 'approved' : 'rejected'} — recorded in audit ledger`,
      })
      setDone(decision)
      setTimeout(() => onResolved(map.id), 950)
    } catch {
      setNotification({ type: 'error', message: 'Could not save — please retry' })
      setBusy(null)
    }
  }

  if (done) {
    const approved = done === 'APPROVED'
    return (
      <div
        className={`flex items-center justify-center rounded-xl border p-8 animate-fadeIn ${
          approved ? 'border-success-200 dark:border-green-800/60 bg-success-50 dark:bg-green-900/20' : 'border-danger-200 dark:border-red-800/60 bg-danger-50 dark:bg-red-900/20'
        }`}
        style={{ minHeight: 220 }}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <span className={`flex h-14 w-14 items-center justify-center rounded-full ${
            approved ? 'bg-success' : 'bg-danger'
          }`}>
            {approved
              ? <Check size={28} className="text-white" strokeWidth={3} />
              : <X     size={28} className="text-white" strokeWidth={3} />}
          </span>
          <p className={`font-serif text-lg font-semibold ${
            approved ? 'text-success-700 dark:text-green-400' : 'text-danger-700 dark:text-red-400'
          }`}>
            {approved ? 'Approved' : 'Rejected'}
          </p>
          <p className="font-mono text-[11px] uppercase tracking-wide text-[#8b98aa]">
            Recorded in audit ledger
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      {pendingDecision && (
        <ConfirmModal
          decision={pendingDecision}
          mapAction={map.action}
          onConfirm={confirmDecision}
          onCancel={cancelDecision}
          busy={busy !== null}
        />
      )}

      <div className="rounded-xl border border-line bg-white dark:bg-card p-6 flex flex-col gap-4">
        {/* Header row: priority + confidence */}
        <div className="flex items-start justify-between gap-3">
          <PriorityBadge priority={map.priority} />
          <ConfidenceBadge score={map.confidence_score} />
        </div>

        {/* Action text */}
        <div>
          <p className="text-[14px] leading-relaxed text-ink dark:text-[#e8edf5]">{map.action}</p>
          {map.source_clause && (
            <p className="mt-1.5 font-mono text-[11px] text-[#8b98aa]">
              § {map.source_clause}
            </p>
          )}
        </div>

        {/* View circular */}
        <CircularInfo circular={circular} />

        {/* Metadata chips */}
        <div className="flex flex-wrap gap-3 border-t border-line pt-3">
          <div className="flex items-center gap-1.5 text-[12px] text-[#8b98aa]">
            <Building2 size={12} className="text-[#8b98aa]" />
            <span>{map.department || 'Unassigned'}</span>
          </div>
          {map.deadline && (
            <div className="flex items-center gap-1.5 text-[12px] text-[#8b98aa]">
              <Clock size={12} className="text-[#8b98aa]" />
              <span>Due {formatDate(map.deadline)}</span>
            </div>
          )}
          {map.created_at && (
            <div className="flex items-center gap-1.5 text-[12px] text-[#8b98aa]">
              <FileText size={12} className="text-[#8b98aa]" />
              <span>Created {formatDateTime(map.created_at)}</span>
            </div>
          )}
          <div className="flex items-center gap-1 rounded border border-violet-200 dark:border-violet-800/60 bg-violet-50 dark:bg-violet-900/20 px-1.5 py-0.5">
            <Sparkles size={10} className="text-violet-500 dark:text-violet-400" />
            <span className="font-mono text-[9px] font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-400">
              Generated by Claude AI
            </span>
          </div>
        </div>

        {/* Review note */}
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={busy !== null}
          placeholder="Optional review note for the audit record…"
          rows={3}
          className="resize-none rounded-lg border border-line bg-paper/40 dark:bg-surface/60 px-3 py-2 text-sm text-ink dark:text-[#e8edf5] placeholder:text-[#8b98aa] focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400 disabled:opacity-60"
        />

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => requestDecision('APPROVED')}
            disabled={busy !== null}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-success py-2.5 text-sm font-semibold text-white transition-colors hover:bg-success-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy === 'APPROVED' ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Approving…
              </>
            ) : (
              <><Check size={15} strokeWidth={2.5} /> Approve</>
            )}
          </button>
          <button
            onClick={() => requestDecision('REJECTED')}
            disabled={busy !== null}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-danger py-2.5 text-sm font-semibold text-white transition-colors hover:bg-danger-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy === 'REJECTED' ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Rejecting…
              </>
            ) : (
              <><X size={15} strokeWidth={2.5} /> Reject</>
            )}
          </button>
        </div>
      </div>
    </>
  )
}

export default function ApprovalPanel() {
  const { maps, loading, refresh } = useMaps()
  const { byId: circularById }    = useCirculars()
  const [resolved, setResolved]   = useState([])

  const pending = maps.filter((m) => key(m.status) === 'PENDING' && !resolved.includes(m.id))

  const onResolved = (id) => {
    setResolved((r) => [...r, id])
    refresh()
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} lines={4} />)}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {pending.length === 0 ? (
        <div className="rounded-xl border border-line bg-white dark:bg-card p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-success-200 dark:border-green-800/60 bg-success-50 dark:bg-green-900/20">
            <Check size={24} className="text-success" strokeWidth={2.5} />
          </div>
          <p className="font-serif text-xl font-semibold text-ink dark:text-[#e8edf5]">Review queue is clear</p>
          <p className="mt-1 text-sm text-[#8b98aa]">
            All extracted MAPs have been reviewed. Upload a new circular to generate more.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="font-mono text-[11px] uppercase tracking-wider text-[#8b98aa]">
              {pending.length} MAP{pending.length !== 1 ? 's' : ''} awaiting compliance review
            </p>
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#8b98aa]">
              <Shield size={11} />
              <span>All decisions are audit-logged</span>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {pending.map((m) => (
              <ApprovalCard
                key={m.id}
                map={m}
                circular={circularById[m.circular_id]}
                onResolved={onResolved}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
