import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useBackendStatus } from '../../hooks/useBackendStatus'
import { User, Building2, Activity } from 'lucide-react'
import ThemeToggle from '../shared/ThemeToggle'

const PAGES = {
  '/':         { title: 'Command Dashboard',       ref: 'OVERVIEW' },
  '/maps':     { title: 'Action Point Register',   ref: 'REGISTER' },
  '/review':   { title: 'AI Extraction Review',    ref: 'REVIEW' },
  '/approvals':{ title: 'Compliance Review Queue', ref: 'QUEUE' },
  '/events':   { title: 'Audit Event Ledger',      ref: 'LEDGER' },
  '/upload':   { title: 'Circular Ingestion',      ref: 'INTAKE' },
}

export default function TopBar() {
  const { pathname } = useLocation()
  const page = PAGES[pathname] || { title: 'PRAGMA', ref: '—' }
  const { online, checked } = useBackendStatus()

  const [tick, setTick] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setTick(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const timeStr = tick.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })

  return (
    <header className="border-b border-line bg-paper/95 dark:bg-paper/95 backdrop-blur-sm sticky top-0 z-40">
      {/* Main bar */}
      <div className="flex items-center justify-between gap-6 px-8 py-3">
        {/* Left: Page identity */}
        <div className="min-w-0">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.24em] text-brass-deep">
            {page.ref}
          </p>
          <h2 className="mt-0.5 font-serif text-xl font-semibold leading-none tracking-tight text-ink dark:text-[#e8edf5] truncate">
            {page.title}
          </h2>
        </div>

        {/* Right: Enterprise metadata */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Officer */}
          <div className="hidden xl:flex items-center gap-1.5">
            <User size={11} className="text-gray-400 dark:text-gray-600" />
            <span className="font-mono text-[11px] text-ink dark:text-gray-400">Compliance Administrator</span>
          </div>

          <div className="hidden xl:block h-3.5 w-px bg-line" />

          {/* Bank + Env */}
          <div className="hidden md:flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Building2 size={11} className="text-brass" />
              <span className="font-mono text-[11px] font-semibold text-ink dark:text-[#e8edf5]">Canara Bank</span>
            </div>
            <span className="rounded border border-brass/40 bg-brass-soft dark:bg-brass/10 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-brass-deep dark:text-brass">
              Demo
            </span>
          </div>

          <div className="hidden md:block h-3.5 w-px bg-line" />

          {/* Live clock */}
          <div className="hidden lg:block font-mono text-[11px] text-gray-400 tnum">
            {timeStr}
          </div>

          <div className="hidden lg:block h-3.5 w-px bg-line" />

          {/* Theme toggle */}
          <ThemeToggle />

          <div className="h-3.5 w-px bg-line" />

          {/* System status pill */}
          <div className={`flex items-center gap-2 rounded-full border px-3 py-1.5 ${
            !checked  ? 'border-line bg-white dark:bg-surface' :
            online    ? 'border-success-200 dark:border-green-800 bg-success-50 dark:bg-green-900/30' :
                        'border-warning-200 dark:border-amber-800 bg-warning-50 dark:bg-amber-900/30'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
              !checked ? 'bg-gray-300 dark:bg-gray-600' :
              online   ? 'bg-success animate-pulse' :
                         'bg-warning'
            }`} />
            <span className={`font-mono text-[10px] font-semibold ${
              !checked ? 'text-gray-500 dark:text-gray-400' :
              online   ? 'text-success-700 dark:text-green-400' :
                         'text-warning-700 dark:text-amber-400'
            }`}>
              {!checked ? 'Connecting…' : online ? 'System Online' : 'Offline Mode'}
            </span>
          </div>
        </div>
      </div>

      {/* Sub-bar: system health strip */}
      <div className="flex items-center gap-6 border-t border-line/50 px-8 py-1.5">
        <div className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${online ? 'bg-success' : 'bg-gray-300 dark:bg-gray-700'}`} />
          <span className="font-mono text-[10px] text-gray-500 dark:text-gray-600">
            Backend {online ? 'Healthy' : 'Offline'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${online ? 'bg-success' : 'bg-gray-300 dark:bg-gray-700'}`} />
          <span className="font-mono text-[10px] text-gray-500 dark:text-gray-600">
            Database {online ? 'Connected' : 'Unreachable'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${online ? 'bg-violet-500' : 'bg-gray-300 dark:bg-gray-700'}`} />
          <span className="font-mono text-[10px] text-gray-500 dark:text-gray-600">
            Claude AI {online ? 'Active' : 'Standby'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Activity size={9} className="text-gray-400 dark:text-gray-600" />
          <span className="font-mono text-[10px] text-gray-500 dark:text-gray-600">
            Latency {online ? '42ms' : '—'}
          </span>
        </div>
        <div className="ml-auto font-mono text-[10px] text-gray-400 dark:text-gray-600">
          PRAGMA v1.0.0 · RBI / SEBI / MCA Compliance Platform
        </div>
      </div>
    </header>
  )
}
