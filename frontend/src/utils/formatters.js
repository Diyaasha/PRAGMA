/**
 * PRAGMA — Display Formatters
 *
 * Owner: Ashwin (React Dashboard)
 * Pure functions — no side effects, easy to unit test.
 */

// The backend stores timestamps as naive UTC (SQLAlchemy func.now()) and
// serialises them without a timezone marker, e.g. "2026-07-01T01:08:27".
// A bare datetime string is parsed by JS as *local* time, which silently drops
// the UTC→local offset (e.g. +5:30 for IST) and shows the wrong clock time.
// Normalise such strings to explicit UTC so toLocale* converts them correctly.
// Date-only values (deadlines like "2026-09-28") have no 'T' and are left as-is.
export const toLocalDate = (value) => {
  if (value == null || value === '') return null
  if (value instanceof Date) return value
  const s = String(value)
  const hasTz = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(s)
  const isNaiveDateTime = s.includes('T') && !hasTz
  return new Date(isNaiveDateTime ? `${s}Z` : s)
}

export const formatDate = (dateString) => {
  const d = toLocalDate(dateString)
  if (!d || isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export const formatDateTime = (dateString) => {
  const d = toLocalDate(dateString)
  if (!d || isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export const truncate = (text, max = 120) => {
  if (!text) return ''
  return text.length > max ? `${text.slice(0, max)}…` : text
}

export const pluralise = (count, singular, plural) =>
  `${count} ${count === 1 ? singular : plural}`
