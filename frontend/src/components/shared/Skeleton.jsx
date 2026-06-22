export function SkeletonMetricCard() {
  return (
    <div className="rounded-xl border border-line bg-white dark:bg-card px-5 py-4">
      <div className="flex items-center gap-2">
        <div className="skeleton h-1.5 w-1.5 rounded-full" />
        <div className="skeleton h-2.5 w-24 rounded" />
      </div>
      <div className="skeleton mt-3 h-9 w-14 rounded" />
      <div className="skeleton mt-2 h-2.5 w-20 rounded" />
    </div>
  )
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="rounded-xl border border-line bg-white dark:bg-card p-5 space-y-3">
      <div className="skeleton h-3 w-32 rounded" />
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`skeleton h-2.5 rounded ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  )
}

export function SkeletonTableRows({ rows = 5, cols = 6 }) {
  return Array.from({ length: rows }).map((_, r) => (
    <tr key={r} className="border-b border-line">
      {Array.from({ length: cols }).map((_, c) => (
        <td key={c} className="px-4 py-3">
          <div
            className={`skeleton h-3 rounded ${
              c === 0 ? 'w-12' : c === 1 ? 'w-full' : 'w-16'
            }`}
          />
        </td>
      ))}
    </tr>
  ))
}
