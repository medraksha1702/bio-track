import type { Transaction } from '@/lib/data'
import { formatCurrency } from '@/lib/format-currency'

function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

export interface CsvExportOptions {
  filterLabel?: string
  periodLine?: string
  generatedAt?: Date
}

export function transactionsToCsv(
  transactions: Transaction[],
  opts: CsvExportOptions = {},
): string {
  const {
    filterLabel = 'All Time',
    periodLine = '',
    generatedAt = new Date(),
  } = opts

  // ── Compute summary ────────────────────────────────────────────────────
  const totalIncome  = transactions.filter(t => t.type === 'income' ).reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const netProfit    = totalIncome - totalExpense
  const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0

  const stamp = generatedAt.toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  // ── Metadata header ────────────────────────────────────────────────────
  const meta = [
    ['BioTrack — Financial Report'],
    [`Period,${escapeCsvField(filterLabel)}${periodLine ? `,${escapeCsvField(periodLine)}` : ''}`],
    [`Generated,${stamp}`],
    [`Records,${transactions.length}`],
    [],
  ]

  // ── Summary block ──────────────────────────────────────────────────────
  const summary = [
    ['SUMMARY'],
    ['Metric', 'Value'],
    ['Total Income',   formatCurrency(totalIncome)],
    ['Total Expenses', formatCurrency(totalExpense)],
    ['Net Profit',     formatCurrency(netProfit)],
    ['Profit Margin',  `${profitMargin.toFixed(1)}%`],
    [],
  ]

  // ── Transaction rows ───────────────────────────────────────────────────
  const dataHeader = ['date', 'type', 'category', 'amount', 'customer', 'notes']
  const dataRows = transactions.map((t) => [
    t.date,
    t.type,
    escapeCsvField(t.category),
    t.type === 'income' ? String(t.amount) : String(-t.amount),
    escapeCsvField(t.client),
    escapeCsvField(t.notes ?? ''),
  ])

  const allLines = [
    ...meta.map(r => r.join(',')),
    ...summary.map(r => r.join(',')),
    ['TRANSACTIONS'].join(','),
    dataHeader.join(','),
    ...dataRows.map(r => r.join(',')),
  ]

  return allLines.join('\n')
}

export function downloadTextFile(filename: string, content: string, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
