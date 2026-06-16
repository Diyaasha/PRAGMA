/**
 * PRAGMA — Approval Panel (#17)
 * Owner: Ashwin — M3
 * Shows Pending MAPs as cards. Compliance officer approves/rejects with an
 * optional note. Calls POST /approvals; optimistically drops the card.
 *
 * NOTE: backend #11 (status flip + event log) is pending on Diyasha's side.
 * Until then the card removal is local-optimistic so the demo flows.
 */

import { useEffect, useMemo, useState } from 'react'
import { useMaps } from '../hooks/useMaps'
import { createApproval } from '../api/approvals'
import { useAppContext } from '../contexts/AppContext'
import PriorityBadge from '../components/shared/PriorityBadge'
import Spinner from '../components/shared/Spinner'

const isPending = (m) => (m.status || '').toString().trim().toUpperCase() === 'PENDING'
const REVIEWER = 'Compliance Officer' // demo identity; wire to auth later

function ApprovalCard({ map, onDone }) {
  const { setNotification } = useAppContext()
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const act = async (decision) => {
    setBusy(true)
    try {
      await createApproval({
        map_id: map.id,
        decision,                 // "APPROVED" | "REJECTED"
        reviewer: REVIEWER,
        comments: note,
      })
    } catch {
      // Mock mode / backend down — proceed optimistically for the demo
    }
    setNotification({
      type: decision === 'APPROVED' ? 'success' : 'error',
      message: `MAP ${decision === 'APPROVED' ? 'approved' : 'rejected'}`,
    })
    onDone(map.id)
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-gray-900">{map.action}</p>
        <PriorityBadge priority={map.priority} />
      </div>
      <p className="mt-1 text-xs text-gray-400">{map.department}</p>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional review note…"
        rows={2}
        className="mt-3 w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      />

      <div className="mt-3 flex gap-2">
        <button
          disabled={busy}
          onClick={() => act('APPROVED')}
          className="rounded-lg bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          Approve
        </button>
        <button
          disabled={busy}
          onClick={() => act('REJECTED')}
          className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          Reject
        </button>
      </div>
    </div>
  )
}

export default function ApprovalPanel() {
  const { maps, loading, usingMock } = useMaps()
  const [actioned, setActioned] = useState([]) // ids removed this session

  // Reset the local-removed set if the underlying data changes identity
  useEffect(() => { setActioned([]) }, [usingMock])

  const pending = useMemo(
    () => maps.filter((m) => isPending(m) && !actioned.includes(m.id)),
    [maps, actioned],
  )

  const remove = (id) => setActioned((prev) => [...prev, id])

  if (loading) return <Spinner label="Loading approvals…" />

  return (
    <div className="space-y-5">
      {usingMock && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
          Backend not reachable — showing sample data. Approvals are simulated locally.
        </div>
      )}

      {pending.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-400">
          No MAPs awaiting approval. 🎉
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {pending.map((m) => (
            <ApprovalCard key={m.id} map={m} onDone={remove} />
          ))}
        </div>
      )}
    </div>
  )
}
