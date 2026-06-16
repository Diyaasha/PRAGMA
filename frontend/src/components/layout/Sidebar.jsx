/**
 * PRAGMA — Sidebar (institutional masthead rail)
 * Owner: Ashwin — M4 register pass
 */

import { NavLink } from 'react-router-dom'
import { LayoutDashboard, FileText, CheckSquare, ScrollText, Upload } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/',          label: 'Dashboard',       icon: LayoutDashboard, end: true },
  { to: '/maps',      label: 'Action Points',   icon: FileText },
  { to: '/approvals', label: 'Approvals',       icon: CheckSquare },
  { to: '/events',    label: 'Audit Log',       icon: ScrollText },
  { to: '/upload',    label: 'New Circular',    icon: Upload },
]

export default function Sidebar() {
  return (
    <aside className="flex w-64 flex-col bg-ink text-slate-300">
      <div className="px-7 pb-6 pt-7">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-brass">Regulatory Register</p>
        <h1 className="mt-2 font-serif text-[28px] font-semibold leading-none tracking-tight text-white">PRAGMA</h1>
        <div className="mt-3 h-px w-full bg-gradient-to-r from-brass/80 to-transparent" />
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                'group relative flex items-center gap-3 rounded-md px-4 py-2.5 text-sm transition-colors',
                isActive ? 'bg-white/[0.07] text-white' : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-100',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <span className={['absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r bg-brass transition-opacity', isActive ? 'opacity-100' : 'opacity-0'].join(' ')} />
                <Icon size={17} strokeWidth={1.75} />
                <span className="font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-7 pb-6 pt-4">
        <div className="h-px w-full bg-white/10" />
        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">SuRaksha Cyber 2.0</p>
      </div>
    </aside>
  )
}
