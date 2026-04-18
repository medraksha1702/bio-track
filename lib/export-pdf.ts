import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Transaction } from '@/lib/data'
import type { TransactionSummary } from '@/lib/services/api'

const BRAND = '#4F46E5'   // indigo-600 – matches the primary hue
const MUTED  = '#6B7280'  // gray-500

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Format currency for PDF export (plain text without special symbols)
 * Using INR with Indian numbering: Rs 1,19,700
 * Note: jsPDF fonts don't always render ₹ symbol correctly, so we use "Rs" prefix
 */
function formatCurrencyForPdf(value: number): string {
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
  
  return `Rs ${formatted}`
}

export interface PdfExportOptions {
  transactions: Transaction[]
  summary: TransactionSummary | null | undefined
  filterLabel: string
  /** ISO date range string, e.g. "2026-01-01 → 2026-03-31" */
  periodLine: string
  generatedAt?: Date
}

export function exportToPdf(opts: PdfExportOptions): void {
  const { transactions, summary, filterLabel, periodLine, generatedAt = new Date() } = opts

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 16

  /* ─── HEADER ─────────────────────────────────────────────────────────── */
  // Brand bar
  doc.setFillColor(BRAND)
  doc.rect(0, 0, pageW, 18, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor('#FFFFFF')
  doc.text('BioTrack', margin, 12)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Biomedical Finance Tracking', margin + 36, 12)

  // Title row
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor('#111827')
  doc.text('Financial Report', margin, 30)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(MUTED)
  doc.text(`Period: ${filterLabel}  ·  ${periodLine}`, margin, 37)
  doc.text(
    `Generated: ${generatedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    margin,
    43
  )

  /* ─── SUMMARY BOXES ──────────────────────────────────────────────────── */
  const boxY = 50
  const boxH = 22
  const boxW = (pageW - margin * 2 - 9) / 4  // 4 cards, 3×3mm gaps

  const summaryItems = [
    { label: 'Total Income',   value: summary ? formatCurrencyForPdf(summary.totalIncome)  : '—', color: '#10B981' },
    { label: 'Total Expenses', value: summary ? formatCurrencyForPdf(summary.totalExpense) : '—', color: '#EF4444' },
    { label: 'Net Profit',     value: summary ? formatCurrencyForPdf(summary.profit)        : '—', color: '#4F46E5' },
    {
      label: 'Profit Margin',
      value: summary && summary.totalIncome > 0
        ? `${((summary.profit / summary.totalIncome) * 100).toFixed(1)}%`
        : '—',
      color: '#7C3AED',
    },
  ]

  summaryItems.forEach((item, i) => {
    const x = margin + i * (boxW + 3)

    // Card background
    doc.setFillColor('#F9FAFB')
    doc.setDrawColor('#E5E7EB')
    doc.setLineWidth(0.3)
    doc.roundedRect(x, boxY, boxW, boxH, 2, 2, 'FD')

    // Colored top strip
    doc.setFillColor(item.color)
    doc.rect(x, boxY, boxW, 2, 'F')

    // Label
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(MUTED)
    doc.text(item.label.toUpperCase(), x + 3, boxY + 8)

    // Value
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor('#111827')
    doc.text(item.value, x + 3, boxY + 17)
  })

  /* ─── TRANSACTIONS TABLE ─────────────────────────────────────────────── */
  const tableStartY = boxY + boxH + 10

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor('#111827')
  doc.text('Transactions', margin, tableStartY - 3)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(MUTED)
  doc.text(`${transactions.length} record${transactions.length === 1 ? '' : 's'}`, margin + 32, tableStartY - 3)

  const rows = transactions.map((t) => [
    formatDate(t.date),
    t.type === 'income' ? 'Income' : 'Expense',
    t.category,
    t.client,
    `${t.type === 'income' ? '+' : '-'} ${formatCurrencyForPdf(t.amount)}`,
    t.notes ?? '',
  ])

  autoTable(doc, {
    startY: tableStartY,
    head: [['Date', 'Type', 'Category', 'Customer', 'Amount', 'Notes']],
    body: rows,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 8,
      cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: BRAND,
      textColor: '#FFFFFF',
      fontStyle: 'bold',
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 24 },       // date
      1: { cellWidth: 18 },       // type
      2: { cellWidth: 36 },       // category
      3: { cellWidth: 36 },       // client
      4: { cellWidth: 24, halign: 'right' }, // amount
      5: { cellWidth: 'auto' },   // notes
    },
    alternateRowStyles: { fillColor: '#F9FAFB' },
    // didParseCell runs during layout (before any drawing) — the correct hook
    // for conditional cell styles. autotable then renders each cell exactly once
    // with these colours already set, so there is no double-draw.
    didParseCell(data) {
      if (data.section !== 'body') return

      // Type column — green for Income, red for Expense
      if (data.column.index === 1) {
        const text = String(data.cell.raw)
        data.cell.styles.textColor = text === 'Income' ? '#10B981' : '#EF4444'
        data.cell.styles.fontStyle = 'bold'
      }

      // Amount column — green for +, red for −
      if (data.column.index === 4) {
        const text = String(data.cell.raw)
        data.cell.styles.textColor = text.startsWith('+') ? '#10B981' : '#EF4444'
        data.cell.styles.fontStyle = 'bold'
      }
    },
  })

  /* ─── FOOTER ─────────────────────────────────────────────────────────── */
  const pageCount = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    const pageH = doc.internal.pageSize.getHeight()
    doc.setDrawColor('#E5E7EB')
    doc.setLineWidth(0.3)
    doc.line(margin, pageH - 10, pageW - margin, pageH - 10)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(MUTED)
    doc.text('BioTrack · Confidential', margin, pageH - 5)
    doc.text(`Page ${i} of ${pageCount}`, pageW - margin, pageH - 5, { align: 'right' })
  }

  /* ─── SAVE ────────────────────────────────────────────────────────────── */
  const safePeriod = filterLabel.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-')
  const stamp = new Intl.DateTimeFormat('en-CA').format(generatedAt)  // yyyy-MM-dd
  doc.save(`BioTrack-Report_${safePeriod}_${stamp}.pdf`)
}
