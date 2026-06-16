/**
 * PRAGMA — MAPs View (#16)
 * Owner: Ashwin — M3 / M4
 * MAP table with filters + per-row status advance (Approved → In Progress → Completed).
 * Advancing calls PATCH /maps/{id}/status; the lifecycle is enforced one step at a time.
 */

import { useMemo, useState } from 'react'
import { useMaps } from '../hooks/useMaps'
import { updateMAPStatus } from '../api/maps'
import { useAppContext } from '../contexts/AppContext'
import StatusBadge from '../components/shared/StatusBadge'
import PriorityBadge from '../components/shared/PriorityBadge'
import FilterBar from '../components/shared/FilterBar'
import Spinner from '../components/shared/Spinner'
import { formatDate } from '../utils/formatters'
import { DEPARTMENTS } from '../utils/constants'

const STATUS_OPTIONS = ['Pending', 'Approved', 'Rejected', 'In Progress', 'Completed']
const PRIORITY_OPTIONS = ['Critical', 'High', 'Medium', 'Low']

const eq = (a, b) => (a || '').toString().trim().toLowerCase() === (b || '').toString().trim().toLowerCase()
const statusKey = (s) => (s || '').toString().trim().toUpperCase().replace(/\s+/g, '_')
const statusLabel = (s) =>
  (s || '').toString().trim().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

// The single permitted next step for each state. No skipping, no going back.
const NEXT_STEP = {
  APPROVED:    { to: 'IN_PROGRESS', label: 'Start work',    cls: 'border-violet-300 text-violet-700 hover:bg-violet-50' },
  IN_PROGRESS: { to: 'COMPLETED',   label: 'Mark complete', cls: 'border-emerald-300 text-emerald-700 hover:bg-emerald-50' },
}

export default function MAPsView() {
  const { maps, loading, usingMock, refresh } = useMaps()
  const { setNotification } = useAppContext()
  const [status, setStatus] = useState('')
  const [department, setDepartment] = useState('')
  const [priority, setPriority] = useState('')
  const [busyId, setBusyId] = useState(null)

  const filtered = useMemo(
    () =>
      maps.filter((m) =>
        (!status || eq(statusLabel(m.status), status)) &&
        (!department || eq(m.department, department)) &&
        (!priority || eq(m.priority, priority)),
      ),
    [maps, status, department, priority],
  )

  const hasFilters = status || department || priority
  const clear = () => { setStatus(''); setDepartment(''); setPriority('') }

  const advance = async (m, to, label) => {
    setBusyId(m.id)
    try {
      await updateMAPStatus(m.id, to)
      setNotification({ type: 'success', message: `MAP "${label.toLowerCase()}" — status updated` })
      await refresh()
    } catch {
      setNotification({ type: 'error', message: 'Could not update status — please retry' })
    } finally {
      setBusyId(null)
    }
  }

  if (loading) return <Spinner label="Loading MAPs…" />

  return (
    <div className="space-y-5">
      {usingMock && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          Backend not reachable — showing sample data.
        </div>
      )}

      <FilterBar
        showClear={hasFilters}
        onClear={clear}
        filters={[
          { label: 'Status', value: status, options: STATUS_OPTIONS, onChange: setStatus },
          { label: 'Department', value: department, options: DEPARTMENTS, onChange: setDepartment },
          { label: 'Priority', value: priority, options: PRIORITY_OPTIONS, onChange: setPriority },
        ]}
      />

      <p className="text-sm text-gray-500">{filtered.length} of {maps.length} MAPs</p>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Department</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Deadline</th>
              <th className="px-4 py-3 font-medium">Update</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                  No MAPs match these filters.
                </td>
              </tr>
            ) : (
              filtered.map((m) => {
                const step = NEXT_STEP[statusKey(m.status)]
                return (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="max-w-md px-4 py-3 text-gray-900">{m.action}</td>
                    <td className="px-4 py-3 text-gray-600">{m.department}</td>
                    <td className="px-4 py-3"><PriorityBadge priority={m.priority} /></td>
                    <td className="px-4 py-3"><StatusBadge status={m.status} /></td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(m.deadline)}</td>
                    <td className="px-4 py-3">
                      {step ? (
                        <button
                          disabled={busyId === m.id}
                          onClick={() => advance(m, step.to, step.label)}
                          className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${step.cls}`}
                        >
                          {busyId === m.id ? 'Saving…' : step.label}
                        </button>
                      ) : statusKey(m.status) === 'PENDING' ? (
                        <span className="font-mono text-[11px] uppercase tracking-wide text-gray-400">Awaiting approval</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
