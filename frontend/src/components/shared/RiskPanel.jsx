import { ShieldAlert, AlertTriangle, Briefcase, ClipboardCheck } from 'lucide-react'

const LEVEL_CFG = {
  Critical: { cls: 'bg-danger-50 dark:bg-red-900/30 border-danger-200 dark:border-red-800/60 text-danger-700 dark:text-red-400', bar: 'bg-danger' },
  High:     { cls: 'bg-warning-50 dark:bg-amber-900/30 border-warning-200 dark:border-amber-800/60 text-warning-700 dark:text-amber-400', bar: 'bg-warning' },
  Medium:   { cls: 'bg-brass-soft dark:bg-brass/10 border-brass/40 dark:border-brass/30 text-brass-deep dark:text-brass', bar: 'bg-brass' },
  Low:      { cls: 'bg-success-50 dark:bg-green-900/30 border-success-200 dark:border-green-800/60 text-success-700 dark:text-green-400', bar: 'bg-success' },
}

const RISK_ITEMS = [
  { key: 'operational', label: 'Operational Risk',  icon: ShieldAlert   },
  { key: 'regulatory',  label: 'Regulatory Risk',   icon: AlertTriangle },
  { key: 'business',    label: 'Business Impact',   icon: Briefcase     },
  { key: 'inspection',  label: 'Inspection Risk',   icon: ClipboardCheck },
]

function ScoreGauge({ score }) {
  const radius = 36
  const circumference = Math.PI * radius
  const dashOffset = circumference - (score / 100) * circumference
  const arcColor = score >= 76 ? 'text-danger' : score >= 51 ? 'text-warning' : score >= 26 ? 'text-brass' : 'text-success'

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex-shrink-0">
        <svg width="88" height="50" viewBox="0 0 88 50">
          <path
            d="M 8 46 A 36 36 0 0 1 80 46"
            fill="none" strokeWidth="7" stroke="currentColor"
            className="text-line dark:text-card"
          />
          <path
            d="M 8 46 A 36 36 0 0 1 80 46"
            fill="none" strokeWidth="7" strokeLinecap="round"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={`${dashOffset}`}
            stroke="currentColor"
            className={arcColor}
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-end justify-center pb-0.5">
          <span className="font-mono text-sm font-bold tabular-nums text-ink dark:text-[#e8edf5]">
            {score}
          </span>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-mono text-[9px] uppercase tracking-wider text-[#8b98aa] mb-1.5">Composite Risk Score</p>
        <div className="h-1.5 rounded-full bg-line dark:bg-card overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${arcColor.replace('text-', 'bg-')}`}
            style={{ width: `${score}%` }}
          />
        </div>
        <p className="mt-1 font-mono text-[9px] text-[#8b98aa]">
          {score}/100 · {score >= 76 ? 'Critical' : score >= 51 ? 'High' : score >= 26 ? 'Medium' : 'Low'} exposure
        </p>
      </div>
    </div>
  )
}

export default function RiskPanel({ map }) {
  if (!map?.risk) return null
  const { risk } = map

  return (
    <div className="mt-4 rounded-lg border border-line overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-line bg-paper/40 dark:bg-surface/60 px-4 py-2.5">
        <ShieldAlert size={12} className="text-danger dark:text-red-400 flex-shrink-0" />
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#8b98aa]">
          Compliance Risk — Estimated Exposure if Ignored
        </p>
      </div>

      <div className="p-4 space-y-4 bg-white dark:bg-card">
        <ScoreGauge score={risk.score} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {RISK_ITEMS.map(({ key, label, icon: Icon }) => (
            risk[key] ? (
              <div key={key} className="rounded-md border border-line p-3">
                <div className="mb-1.5 flex items-center gap-1.5">
                  <Icon size={11} className="text-[#8b98aa] flex-shrink-0" />
                  <p className="font-mono text-[9px] uppercase tracking-wider text-[#8b98aa]">
                    {label}
                  </p>
                </div>
                <p className="text-[11.5px] leading-relaxed text-gray-600 dark:text-[#e8edf5]/70">
                  {risk[key]}
                </p>
              </div>
            ) : null
          ))}
        </div>
      </div>
    </div>
  )
}
