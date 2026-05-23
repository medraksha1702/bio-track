import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Invoice } from '@/lib/services/api'

/* ─── Brand ──────────────────────────────────────────────────────────────── */
const TEAL      = '#006D6F'
const DEEP_TEAL = '#004B4D'
const SILVER    = '#BFC5C7'
const SOFT_BG   = '#F0F7F7'
const CHARCOAL  = '#1F2933'
const MUTED     = '#6B7280'
const WHITE     = '#FFFFFF'
const BLACK     = '#000000'

const PAGE_W  = 210
const MARGIN  = 12
const COL_W   = PAGE_W - MARGIN * 2  // 186mm

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function rs(v: number) {
  return 'Rs ' + new Intl.NumberFormat('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v)
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2,'0')} / ${String(d.getMonth()+1).padStart(2,'0')} / ${d.getFullYear()}`
}

function sectionTitle(doc: jsPDF, y: number, title: string) {
  doc.setFillColor(DEEP_TEAL)
  doc.rect(MARGIN, y, COL_W, 6, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(WHITE)
  doc.text(title, MARGIN + 3, y + 4.2)
  return y + 6
}

function hLine(doc: jsPDF, y: number, color = SILVER) {
  doc.setDrawColor(color)
  doc.setLineWidth(0.3)
  doc.line(MARGIN, y, MARGIN + COL_W, y)
}

function labelValue(doc: jsPDF, x: number, y: number, label: string, value: string, labelW = 28) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(MUTED)
  doc.text(label, x, y)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(CHARCOAL)
  doc.text(value, x + labelW, y)
}

function blankField(doc: jsPDF, x: number, y: number, w: number) {
  doc.setDrawColor(SILVER)
  doc.setLineWidth(0.25)
  doc.line(x, y, x + w, y)
}

/* ─── Main export ────────────────────────────────────────────────────────── */
export function downloadInvoicePdf(invoice: Invoice): void {
  const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const items = invoice.invoice_items ?? []
  let y = 0

  /* ══════════════════════════════════════════════════════════════════════════
     HEADER BAR
  ══════════════════════════════════════════════════════════════════════════ */
  doc.setFillColor(DEEP_TEAL)
  doc.rect(0, 0, PAGE_W, 9, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(WHITE)
  doc.text('K² ENTERPRISE', PAGE_W / 2, 5.8, { align: 'center' })

  y = 11

  /* ══════════════════════════════════════════════════════════════════════════
     TWO-COLUMN COMPANY + INVOICE INFO
  ══════════════════════════════════════════════════════════════════════════ */
  const leftX  = MARGIN
  const rightX = MARGIN + COL_W / 2 + 4
  const colW2  = COL_W / 2 - 4

  // ── Left: Company branding ──────────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(DEEP_TEAL)
  doc.text('K² Enterprise', leftX, y + 6)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(TEAL)
  doc.text('Biomedical Equipment Service & Support', leftX, y + 12)

  doc.setFont('helvetica', 'italic')
  doc.setFontSize(7.5)
  doc.setTextColor(MUTED)
  doc.text('Where Precision Meets Dedication', leftX, y + 17)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(CHARCOAL)
  const contactLines = [
    'Ahmedabad, Gujarat',
    '+91 9510768056',
    'k2biomedicalservice@gmail.com',
    'www.k2biomedical.work',
  ]
  contactLines.forEach((line, i) => {
    doc.text(line, leftX, y + 23 + i * 5)
  })

  // ── Right: TAX INVOICE box ─────────────────────────────────────────────
  doc.setFillColor(SOFT_BG)
  doc.setDrawColor(TEAL)
  doc.setLineWidth(0.5)
  doc.roundedRect(rightX, y, colW2, 41, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(DEEP_TEAL)
  doc.text('TAX INVOICE', rightX + colW2 / 2, y + 7, { align: 'center' })

  // divider inside the TAX INVOICE box only (not full width)
  doc.setDrawColor(TEAL)
  doc.setLineWidth(0.3)
  doc.line(rightX + 1, y + 9, rightX + colW2 - 1, y + 9)

  const rf = [
    ['Invoice No.', invoice.invoice_number],
    ['Date',        fmtDate(invoice.issue_date)],
    ['Due Date',    fmtDate(invoice.due_date)],
    ['Service Type','Repair / Maintenance / Calibration'],
  ]
  rf.forEach(([label, val], i) => {
    const ry = y + 14 + i * 6.5
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(MUTED)
    doc.text(label + ':', rightX + 3, ry)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(CHARCOAL)
    const valX = rightX + 28
    const maxW = colW2 - 30
    if (label === 'Service Type') {
      doc.setFontSize(7)
    } else {
      doc.setFontSize(7.5)
    }
    doc.text(val, valX, ry, { maxWidth: maxW })
  })

  y += 43

  /* ══════════════════════════════════════════════════════════════════════════
     BILL TO
  ══════════════════════════════════════════════════════════════════════════ */
  y = sectionTitle(doc, y, 'BILL TO')
  y += 2

  doc.setFillColor(WHITE)
  doc.setDrawColor(SILVER)
  doc.setLineWidth(0.2)
  doc.rect(MARGIN, y, COL_W, 20, 'FD')

  const billFields = [
    { label: 'Hospital / Lab Name', value: invoice.client_name, x: leftX + 3,       w: 60 },
    { label: 'Contact Person',      value: '',                  x: leftX + 3,       w: 60 },
    { label: 'Mobile Number',       value: '',                  x: rightX - 4,      w: 60 },
    { label: 'Address',             value: '',                  x: rightX - 4,      w: 60 },
  ]

  // Two columns, two rows
  const billLeft  = [billFields[0], billFields[1]]
  const billRight = [billFields[2], billFields[3]]

  billLeft.forEach((f, i) => {
    const fy = y + 6 + i * 9
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(MUTED)
    doc.text(f.label + ':', f.x, fy)
    if (f.value) {
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(CHARCOAL)
      doc.setFontSize(8)
      doc.text(f.value, f.x, fy + 4)
    } else {
      blankField(doc, f.x, fy + 4, f.w)
    }
  })

  billRight.forEach((f, i) => {
    const fy = y + 6 + i * 9
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(MUTED)
    doc.text(f.label + ':', f.x, fy)
    if (f.value) {
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(CHARCOAL)
      doc.setFontSize(8)
      doc.text(f.value, f.x, fy + 4)
    } else {
      blankField(doc, f.x, fy + 4, f.w)
    }
  })

  y += 22

  /* ══════════════════════════════════════════════════════════════════════════
     EQUIPMENT DETAILS
  ══════════════════════════════════════════════════════════════════════════ */
  y = sectionTitle(doc, y, 'EQUIPMENT DETAILS')

  autoTable(doc, {
    startY: y,
    head: [['Equipment', 'Model', 'Serial No.', 'Issue / Complaint']],
    body: [['', '', '', ''], ['', '', '', '']],
    margin: { left: MARGIN, right: MARGIN },
    styles: { fontSize: 8, cellPadding: { top: 3, bottom: 3, left: 3, right: 3 }, textColor: CHARCOAL, lineColor: SILVER, lineWidth: 0.2 },
    headStyles: { fillColor: TEAL, textColor: WHITE, fontStyle: 'bold', fontSize: 7.5 },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 35 },
      2: { cellWidth: 35 },
      3: { cellWidth: 'auto' },
    },
    tableLineColor: SILVER,
    tableLineWidth: 0.2,
  })

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 1

  /* ══════════════════════════════════════════════════════════════════════════
     SERVICE DETAILS
  ══════════════════════════════════════════════════════════════════════════ */
  y = sectionTitle(doc, y, 'SERVICE DETAILS')

  // Build rows from invoice items, padded to at least 3 rows
  const defaultDescriptions = [
    'Biomedical Service Charges',
    'Spare Parts (if any)',
    'Calibration / Maintenance',
  ]
  const serviceRows = items.length > 0
    ? items.map((it, i) => [
        String(i + 1),
        it.description,
        String(it.quantity),
        rs(Number(it.unit_price)),
        rs(Number(it.amount)),
      ])
    : defaultDescriptions.map((desc, i) => [String(i + 1), desc, '', '', ''])

  // Always ensure at least 3 rows
  while (serviceRows.length < 3) {
    serviceRows.push([String(serviceRows.length + 1), defaultDescriptions[serviceRows.length] ?? '', '', '', ''])
  }

  autoTable(doc, {
    startY: y,
    head: [['Sr.', 'Description of Service', 'Qty', 'Rate (Rs)', 'Amount (Rs)']],
    body: serviceRows,
    margin: { left: MARGIN, right: MARGIN },
    styles: { fontSize: 8.5, cellPadding: { top: 3, bottom: 3, left: 3, right: 3 }, textColor: CHARCOAL, lineColor: SILVER, lineWidth: 0.2 },
    headStyles: { fillColor: TEAL, textColor: WHITE, fontStyle: 'bold', fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 14, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
    },
    alternateRowStyles: { fillColor: SOFT_BG },
    tableLineColor: SILVER,
    tableLineWidth: 0.2,
  })

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 1

  /* ══════════════════════════════════════════════════════════════════════════
     PAYMENT SUMMARY (left) + PAYMENT DETAILS (right)
  ══════════════════════════════════════════════════════════════════════════ */
  const summaryW = 85
  const detailsW = COL_W - summaryW - 4
  const detailsX = MARGIN + summaryW + 4
  const sectionH = 36

  // Payment Summary box
  doc.setFillColor(WHITE)
  doc.setDrawColor(SILVER)
  doc.setLineWidth(0.2)
  doc.rect(MARGIN, y, summaryW, sectionH, 'FD')

  doc.setFillColor(DEEP_TEAL)
  doc.rect(MARGIN, y, summaryW, 6, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(WHITE)
  doc.text('PAYMENT SUMMARY', MARGIN + 3, y + 4.2)

  const summaryRows = [
    ['Subtotal',            rs(Number(invoice.subtotal))],
    [`GST (${invoice.tax_rate > 0 ? invoice.tax_rate + '%' : 'if applicable'})`, invoice.tax_amount > 0 ? rs(Number(invoice.tax_amount)) : '—'],
    ['Total Amount',        rs(Number(invoice.total))],
  ]

  summaryRows.forEach(([label, value], i) => {
    const ry = y + 11 + i * 7
    const isTotal = label === 'Total Amount'

    if (isTotal) {
      doc.setFillColor(SOFT_BG)
      doc.rect(MARGIN + 1, ry - 4, summaryW - 2, 8, 'F')
    }

    doc.setFont('helvetica', isTotal ? 'bold' : 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(isTotal ? DEEP_TEAL : CHARCOAL)
    doc.text(label, MARGIN + 4, ry)

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(isTotal ? DEEP_TEAL : CHARCOAL)
    doc.text(value, MARGIN + summaryW - 4, ry, { align: 'right' })
  })

  // Payment Details box
  doc.setFillColor(WHITE)
  doc.setDrawColor(SILVER)
  doc.rect(detailsX, y, detailsW, sectionH, 'FD')

  doc.setFillColor(DEEP_TEAL)
  doc.rect(detailsX, y, detailsW, 6, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(WHITE)
  doc.text('PAYMENT DETAILS', detailsX + 3, y + 4.2)

  const payRows = [
    ['UPI',        ''],
    ['Bank Name',  ''],
    ['Account No.',''],
    ['IFSC Code',  ''],
  ]
  payRows.forEach(([label], i) => {
    const ry = y + 12 + i * 6
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(MUTED)
    doc.text(label + ':', detailsX + 3, ry)
    blankField(doc, detailsX + 28, ry, detailsW - 32)
  })

  y += sectionH + 2

  /* ══════════════════════════════════════════════════════════════════════════
     TERMS & CONDITIONS
  ══════════════════════════════════════════════════════════════════════════ */
  y = sectionTitle(doc, y, 'TERMS & CONDITIONS')
  y += 1

  doc.setFillColor(SOFT_BG)
  doc.setDrawColor(SILVER)
  doc.setLineWidth(0.2)
  doc.rect(MARGIN, y, COL_W, 22, 'FD')

  const terms = [
    'Service once completed will be treated as accepted.',
    'Warranty applicable only on replaced parts if explicitly specified.',
    'Payment due within agreed terms. Late payments may attract additional charges.',
    'Equipment should be checked at the time of delivery / service completion.',
  ]
  terms.forEach((t, i) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(CHARCOAL)
    doc.text(`${i + 1}.  ${t}`, MARGIN + 3, y + 5 + i * 4.5)
  })

  y += 24

  /* ══════════════════════════════════════════════════════════════════════════
     SIGNATURE SECTION
  ══════════════════════════════════════════════════════════════════════════ */
  y = sectionTitle(doc, y, 'SIGNATURE')
  y += 2

  doc.setFillColor(WHITE)
  doc.setDrawColor(SILVER)
  doc.setLineWidth(0.2)
  doc.rect(MARGIN, y, COL_W, 22, 'FD')

  // Vertical divider
  doc.setDrawColor(SILVER)
  doc.line(MARGIN + COL_W / 2, y, MARGIN + COL_W / 2, y + 22)

  // Customer signature side
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(MUTED)
  doc.text('Customer Signature', MARGIN + 4, y + 5)
  blankField(doc, MARGIN + 4, y + 17, COL_W / 2 - 10)

  // Authorized signature side
  const sigRightX = MARGIN + COL_W / 2 + 4
  doc.text('Authorized Signature', sigRightX, y + 5)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(DEEP_TEAL)
  doc.text('Kaushik Koshti', sigRightX + (COL_W / 2 - 10) / 2, y + 14, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(MUTED)
  doc.text('K² Enterprise', sigRightX + (COL_W / 2 - 10) / 2, y + 19, { align: 'center' })

  y += 24

  /* ══════════════════════════════════════════════════════════════════════════
     FOOTER
  ══════════════════════════════════════════════════════════════════════════ */
  // Teal footer bar
  const pageH = doc.internal.pageSize.getHeight()
  doc.setFillColor(DEEP_TEAL)
  doc.rect(0, pageH - 16, PAGE_W, 16, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(WHITE)
  doc.text('K² Enterprise', PAGE_W / 2, pageH - 10.5, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor('#A7D8D9')
  doc.text('Professional Biomedical Equipment Service & Support', PAGE_W / 2, pageH - 6, { align: 'center' })
  doc.text('Ahmedabad, Gujarat  ·  www.k2biomedical.work', PAGE_W / 2, pageH - 2, { align: 'center' })

  /* ─── Save ──────────────────────────────────────────────────────────────── */
  doc.save(`${invoice.invoice_number}.pdf`)
}
