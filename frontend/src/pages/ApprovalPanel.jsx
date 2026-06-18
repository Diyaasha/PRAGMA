/**
 * PRAGMA — Approval Panel (#17) — register pass, async states + confirmation
 * Owner: Ashwin — M4
 * Loading state on action, then a clear in-card success confirmation before clearing.
 */

import { useState } from 'react'
import { useMaps } from '../hooks/useMaps'
import { createApproval } from '../api/approvals'
import { useAppContext } from '../contexts/AppContext'
import PriorityBadge from '../components/shared/PriorityBadge'
import Spinner from '../components/shared/Spinner'
import { Check, X } from 'lucide-react'

const key = (s) => (s || '').toString().trim().toUpperCase().replace(/\s+/g, '_')
const REVIEWER = 'Compliance Officer'

function ApprovalCard({ map, onResolved }) {
  const { setNotification } = useAppContext()
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(null)   // 'APPROVED' | 'REJECTED' | null
  const [done, setDone] = useState(null)    // 'APPROVED' | 'REJECTED' | null — confirmation overlay

  const act = async (decision) => {
    setBusy(decision)
    try {
      await createApproval({ map_id: map.id, decision, reviewer: REVIEWER, comments: note })
      setNotification({
        type: decision === 'APPROVED' ? 'success' : 'error',
        message: `MAP ${decision === 'APPROVED' ? 'approved' : 'rejected'}`,
      })
      setDone(decision)                       // show the confirmation overlay
      setTimeout(() => onResolved(map.id), 950) // then clear the card
    } catch {
      setNotification({ type: 'error', message: 'Could not save — please retry' })
      setBusy(null)
    }
  }

  const disabled = busy !== null

  // ---- confirmation overlay state ----
  if (done) {
    const approved = done === 'APPROVED'
    return (
      <div className={`flex items-center justify-center rounded-xl border p-6 transition-all duration-300 ${
        approved ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'
      }`} style={{ minHeight: 200 }}>
        <div className="flex flex-col items-center gap-3 text-center">
          <span className={`flex h-14 w-14 items-center justify-center rounded-full ${
            approved ? 'bg-emerald-600' : 'bg-red-600'
          }`}>
            {approved ? <Check size={28} className="text-white" strokeWidth={3} />
                      : <X size={28} className="text-white" strokeWidth={3} />}
          </span>
          <p className={`font-serif text-lg font-semibold ${approved ? 'text-emerald-800' : 'text-red-800'}`}>
            {approved ? 'Approved' : 'Rejected'}
          </p>
          <p className="font-mono text-[11px] uppercase tracking-wide text-gray-500">
            recorded in audit log
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-line bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <p className="text-[15px] leading-snug text-ink">{map.action}</p>
        <PriorityBadge priority={map.priority} />
      </div>
      <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-gray-400">{map.department}</p>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        disabled={disabled}
        placeholder="Optional review note…"
        className="mt-4 h-20 w-full resize-none rounded-lg border border-line bg-paper/40 px-3 py-2 text-sm text-ink placeholder:text-gray-400 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400 disabled:opacity-60"
      />

      <div className="mt-4 flex gap-3">
        <button
          onClick={() => act('APPROVED')}
          disabled={disabled}
          className="inline-flex min-w-[110px] items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy === 'APPROVED' ? (
            <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Approving…</>
          ) : 'Approve'}
        </button>
        <button
          onClick={() => act('REJECTED')}
          disabled={disabled}
          className="inline-flex min-w-[100px] items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy === 'REJECTED' ? (
            <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Rejecting…</>
          ) : 'Reject'}
        </button>
      </div>
    </div>
  )
}

export default function ApprovalPanel() {
  const { maps, loading, refresh } = useMaps()
  const [resolved, setResolved] = useState([])

  if (loading) return <Spinner label="Loading approvals…" />

  const pending = maps.filter((m) => key(m.status) === 'PENDING' && !resolved.includes(m.id))

  const onResolved = (id) => {
    setResolved((r) => [...r, id])
    refresh()
  }

  return (
    <div className="space-y-5">
      {pending.length === 0 ? (
        <div className="rounded-xl border border-line bg-white p-10 text-center">
          <p className="font-serif text-lg text-ink">No items awaiting review</p>
          <p className="mt-1 text-sm text-gray-500">All extracted MAPs have been actioned.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {pending.map((m) => (
            <ApprovalCard key={m.id} map={m} onResolved={onResolved} />
          ))}
        </div>
      )}
    </div>
  )
}
