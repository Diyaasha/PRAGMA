import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FileText, CheckSquare, ScrollText,
  Upload, Shield, Layers, PlayCircle, Zap, GitBranch,
} from 'lucide-react'
import { useAppContext } from '../../contexts/AppContext'

const NAV_ITEMS = [
  { to: '/',          label: 'Dashboard',     sub: 'Overview',        icon: LayoutDashboard, end: true },
  { to: '/maps',      label: 'Action Points', sub: 'MAP Register',    icon: FileText },
  { to: '/simulate',  label: 'Impact Simulator', sub: 'Predictive AI',  icon: Zap },
  { to: '/trace',     label: 'Trace Graph',      sub: 'Provenance',     icon: GitBranch },
  { to: '/review',    label: 'AI Review',     sub: 'Extraction',      icon: Layers },
  { to: '/approvals', label: 'Approvals',     sub: 'Review Queue',    icon: CheckSquare },
  { to: '/events',    label: 'Audit Log',     sub: 'Event Ledger',    icon: ScrollText },
  { to: '/upload',    label: 'New Circular',  sub: 'Intake',          icon: Upload },
]

const DEMO_SCENARIOS = [
  { id: 'rbi-cyber',       label: 'RBI Cybersecurity 2026',    sub: '8 MAPs · IT, Risk, Compliance' },
  { id: 'sebi-cscrf',      label: 'SEBI CSCRF Framework',      sub: '6 MAPs · Legal, Treasury' },
  { id: 'digital-lending', label: 'RBI Digital Lending Norms', sub: 'Demo scenario' },
]

export default function Sidebar() {
  const { demoScenario, setDemoScenario } = useAppContext()
  const navigate = useNavigate()

  const handleScenario = (id) => {
    setDemoScenario(id)
    navigate('/')
  }

  return (
    <aside className="flex w-64 flex-col bg-ink dark:bg-[#040C14] text-slate-300 flex-shrink-0">
      {/* Masthead */}
      <div className="px-7 pb-5 pt-7">
        <div className="flex items-center gap-2 mb-3">
          <Shield size={14} className="text-brass flex-shrink-0" strokeWidth={2} />
          <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-brass">
            Air-Gapped Intelligence
          </p>
        </div>
        <h1 className="font-serif text-[28px] font-semibold leading-none tracking-tight text-white">
          PRAGMA
        </h1>
        <p className="mt-1 font-mono text-[10px] text-slate-500 tracking-wide">
          Canara Bank · Compliance Platform
        </p>
        <div className="mt-4 h-px w-full bg-gradient-to-r from-brass/60 to-transparent" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {NAV_ITEMS.map(({ to, label, sub, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                'group relative flex items-center gap-3 rounded-md px-4 py-2.5 transition-colors',
                isActive
                  ? 'bg-white/[0.09] text-white'
                  : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-100',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={[
                    'absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r bg-brass transition-all duration-150',
                    isActive ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0',
                  ].join(' ')}
                />
                <Icon
                  size={16}
                  strokeWidth={isActive ? 2 : 1.75}
                  className={isActive ? 'text-brass' : ''}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-none">{label}</p>
                  <p className={`mt-0.5 font-mono text-[9px] tracking-wide ${
                    isActive ? 'text-brass/70' : 'text-slate-600'
                  }`}>{sub}</p>
                </div>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Demo Scenarios */}
      <div className="px-4 pb-4">
        <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-3">
          <div className="mb-2 flex items-center gap-1.5">
            <PlayCircle size={11} className="text-brass flex-shrink-0" />
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-brass">
              Demo Scenarios
            </p>
          </div>
          <div className="space-y-1">
            {DEMO_SCENARIOS.map((s) => (
              <button
                key={s.id}
                onClick={() => handleScenario(s.id)}
                className={[
                  'w-full rounded-md px-2.5 py-1.5 text-left transition-colors',
                  demoScenario === s.id
                    ? 'bg-brass/20 text-brass'
                    : 'text-slate-500 hover:bg-white/[0.05] hover:text-slate-300',
                ].join(' ')}
              >
                <p className="truncate text-[11px] font-medium leading-none">{s.label}</p>
                <p className="mt-0.5 truncate font-mono text-[9px] text-slate-600">{s.sub}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-7 pb-6 pt-2">
        <div className="h-px w-full bg-white/10" />
        <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.18em] text-slate-600">
          Suraksha Cyber Hackathon 2026
        </p>
        <p className="mt-1 font-mono text-[9px] text-slate-700">
          Local AI Engine · FastAPI · SQLite
        </p>
      </div>
    </aside>
  )
}
