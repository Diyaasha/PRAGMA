/**
 * PRAGMA — Top Bar
 * Owner: Ashwin — M3/M4
 * Page title + a backend status dot that reflects real reachability.
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

  const dot = !checked ? 'bg-gray-300' : online ? 'bg-green-500' : 'bg-amber-500'
  const label = !checked
    ? 'Checking backend…'
    : online
    ? 'Backend: live'
    : 'Backend: offline (sample data)'

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className={`inline-block h-2 w-2 rounded-full ${dot}`} />
        {label}
      </div>
    </header>
  )
}
