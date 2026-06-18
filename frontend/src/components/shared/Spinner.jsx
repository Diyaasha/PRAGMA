/**
 * PRAGMA — Spinner
 * Owner: Ashwin — M4 polish
 * Centered loading indicator. Pass a label for context.
 */

export default function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-400">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-primary-600" />
      <span className="text-sm">{label}</span>
    </div>
  )
}
