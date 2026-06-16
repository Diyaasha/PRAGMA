/**
 * PRAGMA — Sidebar (navy command rail)
 * Owner: Ashwin — M4 premium pass
 */

import { NavLink } from 'react-router-dom'
import { LayoutDashboard, FileText, CheckSquare, ScrollText, Upload } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/',          label: 'Dashboard',       icon: LayoutDashboard, end: true },
  { to: '/maps',      label: 'MAPs',            icon: FileText },
  { to: '/approvals', label: 'Approvals',       icon: CheckSquare },
  { to: '/events',    label: 'Event Log',       icon: ScrollText },
  { to: '/upload',    label: 'Upload Circular', icon: Upload },
]

export default function Sidebar() {
  return (
    <aside className="flex w-64 flex-col bg-ink text-slate-300">
      <div className="px-6 py-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">PRAGMA</h1>
        <div className="mt-2 h-px w-10 bg-accent" />
        <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
          Regulatory Compliance Agent
        </p>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                'group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-100',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={[
                    'absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-accent transition-opacity',
                    isActive ? 'opacity-100' : 'opacity-0',
                  ].join(' ')}
                />
                <Icon size={18} strokeWidth={2} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-6 py-5">
        <div className="h-px w-full bg-white/10" />
        <p className="mt-4 text-[11px] uppercase tracking-[0.12em] text-slate-500">
          SuRaksha Cyber Hackathon 2.0
        </p>
      </div>
    </aside>
  )
}
