/**
 * PRAGMA — Top Bar
 * Owner: Ashwin — M3/M4
 * Page title + backend status dot reflecting real reachability.
 */

import { useLocation } from 'react-router-dom'
import { useBackendStatus } from '../../hooks/useBackendStatus'

const PAGE_TITLES = {
  '/':          'Dashboard',
  '/maps':      'Measurable Action Points',
  '/approvals': 'Approval Panel',
  '/events':    'Event Log',
  '/upload':    'Upload Circular',
}

export default function TopBar() {
  const { pathname } = useLocation()
  const title = PAGE_TITLES[pathname] || 'PRAGMA'
  const { online, checked } = useBackendStatus()

  const dot = !checked ? 'bg-slate-300' : online ? 'bg-emerald-500' : 'bg-accent'
  const label = !checked ? 'Checking backend' : online ? 'Backend live' : 'Sample data'

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-8">
      <h2 className="text-[15px] font-semibold tracking-tight text-ink">{title}</h2>
      <div className="flex items-center gap-2.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1">
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${dot}`} />
        <span className="font-mono text-xs text-gray-500">{label}</span>
      </div>
    </header>
  )
}
