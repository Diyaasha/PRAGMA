import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, X, Shield } from 'lucide-react'

const sk = (s) => (s || '').toString().trim().toUpperCase().replace(/\s+/g, '_')

export default function AlertBanner({ maps = [], circulars = [] }) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  const criticalPending = maps.filter(
    (m) => sk(m.status) === 'PENDING' && (m.priority || '').toLowerCase() === 'critical',
  )
  const highPending = maps.filter(
    (m) =>
      sk(m.status) === 'PENDING' &&
      ['critical', 'high'].includes((m.priority || '').toLowerCase()),
  )

  if (highPending.length === 0) return null

  // Get the most recently uploaded circular for context
  const latestCircular = [...circulars].sort(
    (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
  )[0]
  const circularTitle = latestCircular?.title || 'Regulatory Circular'
  const regSource     = latestCircular?.source || 'RBI'
  const isCritical    = criticalPending.length > 0

  return (
    <div
      className={`relative flex items-start gap-4 overflow-hidden rounded-xl border px-5 py-4 ${
        isCritical
          ? 'border-danger-200 dark:border-red-800 bg-danger-50 dark:bg-red-900/20'
          : 'border-warning-200 dark:border-amber-800 bg-warning-50 dark:bg-amber-900/20'
      }`}
    >
      {/* Left severity stripe */}
      <div
        className={`absolute left-0 top-0 h-full w-1 ${
          isCritical ? 'bg-danger' : 'bg-warning'
        }`}
      />

      {/* Icon */}
      <div
        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${
          isCritical ? 'bg-danger/10' : 'bg-warning/10'
        }`}
      >
        <AlertTriangle
          size={18}
          className={isCritical ? 'text-danger' : 'text-warning'}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span
            className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-white ${
              isCritical ? 'border-danger bg-danger' : 'border-warning bg-warning'
            }`}
          >
            <Shield size={8} />
            {isCritical ? 'SEVERITY: HIGH' : 'ATTENTION REQUIRED'}
          </span>
          <span className="font-mono text-[10px] text-[#8b98aa]">
            {regSource} Advisory · {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
        <p
          className={`text-sm font-semibold truncate ${
            isCritical ? 'text-danger-700' : 'text-warning-700'
          }`}
        >
          {circularTitle}
        </p>
        <p className="mt-0.5 text-[13px] text-gray-600 dark:text-[#e8edf5]/80">
          {criticalPending.length > 0 && (
            <strong className="text-danger-700 font-semibold">
              {criticalPending.length} Critical{' '}
            </strong>
          )}
          {criticalPending.length > 0 && highPending.length > criticalPending.length && 'and '}
          {highPending.length > criticalPending.length && (
            <span>
              {highPending.length - criticalPending.length} High Priority{' '}
            </span>
          )}
          MAP{highPending.length !== 1 ? 's' : ''} pending compliance officer approval.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-shrink-0 items-center gap-3">
        <Link
          to="/approvals"
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors ${
            isCritical
              ? 'bg-danger hover:bg-danger-700'
              : 'bg-warning hover:bg-warning-700'
          }`}
        >
          Review Now <ArrowRight size={11} />
        </Link>
        <button
          onClick={() => setDismissed(true)}
          className="rounded p-1 text-gray-400 hover:bg-black/[0.05] hover:text-gray-600"
          aria-label="Dismiss alert"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
