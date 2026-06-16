/**
 * PRAGMA — UI Constants
 * Owner: Ashwin — M3 / M4 premium pass
 * Centralised labels and Tailwind class mappings. Update colours here only.
 */

export const MAP_STATUSES = {
  PENDING:     'Pending',
  APPROVED:    'Approved',
  REJECTED:    'Rejected',
  IN_PROGRESS: 'In Progress',
  COMPLETED:   'Completed',
}

// Flat, hairline-bordered, restrained — reads as a status field, not a sticker
export const MAP_STATUS_COLORS = {
  'Pending':     'bg-amber-50   text-amber-700   border border-amber-200',
  'Approved':    'bg-blue-50    text-blue-700    border border-blue-200',
  'Rejected':    'bg-red-50     text-red-700     border border-red-200',
  'In Progress': 'bg-violet-50  text-violet-700  border border-violet-200',
  'Completed':   'bg-emerald-50 text-emerald-700 border border-emerald-200',
}

export const MAP_PRIORITY_COLORS = {
  'Critical': 'bg-red-50    text-red-700    border border-red-200',
  'High':     'bg-orange-50 text-orange-700 border border-orange-200',
  'Medium':   'bg-amber-50  text-amber-700  border border-amber-200',
  'Low':      'bg-slate-50  text-slate-600  border border-slate-200',
}

export const DEPARTMENTS = ['IT', 'Compliance', 'Risk', 'Treasury', 'Legal']

export const CIRCULAR_SOURCES = ['RBI', 'SEBI', 'MCA']

export const POLL_INTERVAL_MS = 5000
