/**
 * PRAGMA — StatusBadge
 * Owner: Ashwin — M3
 * Normalises any status casing (PENDING / "in progress") to the canonical
 * label, then colours it from constants.js. Reused across all pages.
 */

import { MAP_STATUSES, MAP_STATUS_COLORS } from '../../utils/constants'

const canonical = (s) => {
  if (!s) return 'Pending'
  const key = s.toString().trim().toUpperCase().replace(/\s+/g, '_')
  return MAP_STATUSES[key] || s
}

export default function StatusBadge({ status }) {
  const label = canonical(status)
  const cls = MAP_STATUS_COLORS[label] || 'bg-gray-100 text-gray-700 border border-gray-200'
  return (
    <span className={`inline-block rounded-md px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide ${cls}`}>
      {label}
    </span>
  )
}
