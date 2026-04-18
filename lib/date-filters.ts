import {
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfQuarter,
  endOfQuarter,
  subQuarters,
  startOfYear,
  endOfYear,
  format,
} from 'date-fns'

export type DatePreset =
  | 'all'
  | 'this-month'
  | 'last-month'
  | 'this-quarter'
  | 'last-quarter'
  | 'this-year'
  | 'custom'

export type DateFilter = {
  preset: DatePreset
  startDate?: string  // ISO date string yyyy-MM-dd, only used for 'custom'
  endDate?: string
}

export type TransactionFilter = {
  startDate?: string
  endDate?: string
}

export const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'all', label: 'All Time' },
  { value: 'this-month', label: 'This Month' },
  { value: 'last-month', label: 'Last Month' },
  { value: 'this-quarter', label: 'This Quarter' },
  { value: 'last-quarter', label: 'Last Quarter' },
  { value: 'this-year', label: 'This Year' },
]

export const DEFAULT_FILTER: DateFilter = { preset: 'all' }

/** Returns the active date range label for display in UI */
export function getFilterLabel(filter: DateFilter): string {
  if (filter.preset === 'custom' && filter.startDate && filter.endDate) {
    const start = new Date(filter.startDate)
    const end = new Date(filter.endDate)
    return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`
  }
  return DATE_PRESETS.find((p) => p.value === filter.preset)?.label ?? 'All Time'
}

/**
 * Converts a DateFilter preset into concrete startDate / endDate strings.
 * Returns undefined for 'all' (no restriction) or invalid custom ranges.
 */
export function getDateRange(filter: DateFilter): TransactionFilter | undefined {
  const now = new Date()

  switch (filter.preset) {
    case 'all':
      return undefined

    case 'this-month':
      return {
        startDate: format(startOfMonth(now), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
      }

    case 'last-month': {
      const prev = subMonths(now, 1)
      return {
        startDate: format(startOfMonth(prev), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(prev), 'yyyy-MM-dd'),
      }
    }

    case 'this-quarter':
      return {
        startDate: format(startOfQuarter(now), 'yyyy-MM-dd'),
        endDate: format(endOfQuarter(now), 'yyyy-MM-dd'),
      }

    case 'last-quarter': {
      const prev = subQuarters(now, 1)
      return {
        startDate: format(startOfQuarter(prev), 'yyyy-MM-dd'),
        endDate: format(endOfQuarter(prev), 'yyyy-MM-dd'),
      }
    }

    case 'this-year':
      return {
        startDate: format(startOfYear(now), 'yyyy-MM-dd'),
        endDate: format(endOfYear(now), 'yyyy-MM-dd'),
      }

    case 'custom':
      if (filter.startDate && filter.endDate) {
        return { startDate: filter.startDate, endDate: filter.endDate }
      }
      return undefined

    default:
      return undefined
  }
}
