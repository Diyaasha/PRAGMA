/**
 * PRAGMA — Document Header
 * Owner: Ashwin — M4 register pass
 * Serif page title + mono reference line, with a live backend seal.
 */

import { useLocation } from 'react-router-dom'
import { useBackendStatus } from '../../hooks/useBackendStatus'

const PAGES = {
  '/':          { title: 'Dashboard',                 ref: 'OVERVIEW' },
  '/maps':      { title: 'Measurable Action Points',  ref: 'REGISTER' },
  '/approvals': { title: 'Approval Panel',            ref: 'REVIEW' },
  '/events':    { title: 'Audit Log',                 ref: 'LEDGER' },
  '/upload':    { title: 'New Circular',              ref: 'INTAKE' },
}

export default function TopBar() {
  const { pathname } = useLocation()
  const page = PAGES[pathname] || { title: 'PRAGMA', ref: '—' }
  const { online, checked } = useBackendStatus()

  const dot = !checked ? 'bg-slate-300' : online ? 'bg-emerald-600' : 'bg-brass'
  const label = !checked ? 'Connecting' : online ? 'System of record · live' : 'Sample data'

  return (
    <header className="border-b border-line bg-paper/80 px-8 py-4 backdrop-blur">
      <div className="flex items-end justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-brass-deep">{page.ref}</p>
          <h2 className="mt-1 font-serif text-2xl font-semibold leading-none tracking-tight text-ink">{page.title}</h2>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1">
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${dot}`} />
          <span className="font-mono text-[11px] text-gray-500">{label}</span>
        </div>
      </div>
    </header>
  )
}
