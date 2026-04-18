import { eachMonthOfInterval, format, parseISO } from 'date-fns'
import type { Transaction } from '@/lib/data'

export type MonthlyProfitPoint = {
  month: string
  profit: number
}

const MAX_MONTHS_IN_CHART = 24

/** Net profit (income − expenses) per calendar month for transactions in range. */
export function buildMonthlyProfitSeries(transactions: Transaction[]): MonthlyProfitPoint[] {
  if (transactions.length === 0) return []

  const byMonth = new Map<string, { income: number; expense: number }>()
  for (const t of transactions) {
    const key = t.date.slice(0, 7)
    const cur = byMonth.get(key) ?? { income: 0, expense: 0 }
    if (t.type === 'income') cur.income += t.amount
    else cur.expense += t.amount
    byMonth.set(key, cur)
  }

  const sortedKeys = Array.from(byMonth.keys()).sort()
  const firstKey = sortedKeys[0]!
  const lastKey = sortedKeys[sortedKeys.length - 1]!
  const start = parseISO(`${firstKey}-01`)
  const end = parseISO(`${lastKey}-01`)
  let months = eachMonthOfInterval({ start, end })
  if (months.length > MAX_MONTHS_IN_CHART) {
    months = months.slice(-MAX_MONTHS_IN_CHART)
  }

  return months.map((m) => {
    const key = format(m, 'yyyy-MM')
    const agg = byMonth.get(key) ?? { income: 0, expense: 0 }
    return {
      month: format(m, 'MMM yyyy'),
      profit: agg.income - agg.expense,
    }
  })
}

export type MonthlyBarPoint = {
  month: string
  income: number
  expense: number
}

/** Income and expense totals per calendar month. */
export function buildIncomeExpenseSeries(transactions: Transaction[]): MonthlyBarPoint[] {
  if (transactions.length === 0) return []

  const byMonth = new Map<string, { income: number; expense: number }>()
  for (const t of transactions) {
    const key = t.date.slice(0, 7)
    const cur = byMonth.get(key) ?? { income: 0, expense: 0 }
    if (t.type === 'income') cur.income += t.amount
    else cur.expense += t.amount
    byMonth.set(key, cur)
  }

  const sortedKeys = Array.from(byMonth.keys()).sort()
  const start = parseISO(`${sortedKeys[0]!}-01`)
  const end = parseISO(`${sortedKeys[sortedKeys.length - 1]!}-01`)
  let months = eachMonthOfInterval({ start, end })
  if (months.length > MAX_MONTHS_IN_CHART) months = months.slice(-MAX_MONTHS_IN_CHART)

  return months.map((m) => {
    const key = format(m, 'yyyy-MM')
    const agg = byMonth.get(key) ?? { income: 0, expense: 0 }
    return { month: format(m, 'MMM yyyy'), income: agg.income, expense: agg.expense }
  })
}

export type ExpenseCategorySlice = {
  category: string
  value: number
}

/** Sums expenses by category (only expense-type transactions). */
export function buildExpenseCategoryBreakdown(transactions: Transaction[]): ExpenseCategorySlice[] {
  const map = new Map<string, number>()
  for (const t of transactions) {
    if (t.type !== 'expense') continue
    map.set(t.category, (map.get(t.category) ?? 0) + t.amount)
  }
  return Array.from(map.entries())
    .map(([category, value]) => ({ category, value }))
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value)
}
