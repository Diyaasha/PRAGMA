/**
 * PRAGMA — MAPs View (#16)
 * Owner: Ashwin — M3
 * Full MAP table with status / department / priority filters.
 * Filtering is client-side so it works on mock and live data alike.
 */

import { useMemo, useState } from 'react'
import { useMaps } from '../hooks/useMaps'
import StatusBadge from '../components/shared/StatusBadge'
import PriorityBadge from '../components/shared/PriorityBadge'
import FilterBar from '../components/shared/FilterBar'
import { formatDate } from '../utils/formatters'
import { DEPARTMENTS } from '../utils/constants'
import Spinner from '../components/shared/Spinner'
const STATUS_OPTIONS = ['Pending', 'Approved', 'Rejected', 'In Progress', 'Completed']
const PRIORITY_OPTIONS = ['Critical', 'High', 'Medium', 'Low']

const eq = (a, b) => (a || '').toString().trim().toLowerCase() === (b || '').toString().trim().toLowerCase()
const statusLabel = (s) =>
  (s || '').toString().trim().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

export default function MAPsView() {
  const { maps, loading, usingMock } = useMaps()
  const [status, setStatus] = useState('')
  const [department, setDepartment] = useState('')
  const [priority, setPriority] = useState('')

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

  if (loading) return <Spinner label="Loading MAPs…" />

  return (
    <div className="space-y-5">
      {usingMock && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
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

      <p className="text-sm text-gray-500">
        {filtered.length} of {maps.length} MAPs
      </p>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Department</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Deadline</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                  No MAPs match these filters.
                </td>
              </tr>
            ) : (
              filtered.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="max-w-md px-4 py-3 text-gray-900">{m.action}</td>
                  <td className="px-4 py-3 text-gray-600">{m.department}</td>
                  <td className="px-4 py-3"><PriorityBadge priority={m.priority} /></td>
                  <td className="px-4 py-3"><StatusBadge status={m.status} /></td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(m.deadline)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
