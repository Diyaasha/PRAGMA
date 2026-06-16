/**
 * PRAGMA — PriorityBadge
 * Owner: Ashwin — M3
 */

import { MAP_PRIORITY_COLORS } from '../../utils/constants'

const canonical = (p) => {
  if (!p) return 'Low'
  const t = p.toString().trim()
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()
}

export default function PriorityBadge({ priority }) {
  const label = canonical(priority)
  const cls = MAP_PRIORITY_COLORS[label] || 'bg-gray-100 text-gray-700 border border-gray-200'
  return (
    <span className={`inline-block rounded-md px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide ${cls}`}>
      {label}
    </span>
  )
}
