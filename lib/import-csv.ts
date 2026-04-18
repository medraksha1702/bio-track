import type { Transaction } from '@/lib/data'
import type { NewTransaction } from '@/lib/services/api'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ParsedRow {
  /** 1-based original line number in the file */
  line: number
  raw: string[]
  data?: NewTransaction
  errors: string[]
}

export interface ImportPreview {
  valid: ParsedRow[]
  invalid: ParsedRow[]
  /** valid rows that look like duplicates of existing transactions */
  duplicates: ParsedRow[]
}

// ─── CSV parsing ─────────────────────────────────────────────────────────────

/**
 * Minimal RFC 4180-compatible CSV parser.
 * Handles quoted fields (including embedded commas and newlines).
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let i = 0
  while (i < line.length) {
    if (line[i] === '"') {
      // quoted field
      let value = ''
      i++ // skip opening quote
      while (i < line.length) {
        if (line[i] === '"' && line[i + 1] === '"') {
          value += '"'
          i += 2
        } else if (line[i] === '"') {
          i++ // skip closing quote
          break
        } else {
          value += line[i++]
        }
      }
      fields.push(value.trim())
      if (line[i] === ',') i++
    } else {
      // unquoted field
      const end = line.indexOf(',', i)
      if (end === -1) {
        fields.push(line.slice(i).trim())
        break
      }
      fields.push(line.slice(i, end).trim())
      i = end + 1
    }
  }
  return fields
}

// ─── Row validation ───────────────────────────────────────────────────────────

const VALID_TYPES = new Set(['income', 'expense'])
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function validateRow(rawFields: string[], lineNumber: number): ParsedRow {
  const errors: string[] = []

  const [date, type, category, amountStr, client, notes = ''] = rawFields

  if (!date || !ISO_DATE_RE.test(date)) {
    errors.push(`date "${date ?? ''}" is not a valid YYYY-MM-DD date`)
  } else {
    const d = new Date(date)
    if (isNaN(d.getTime())) errors.push(`date "${date}" cannot be parsed`)
  }

  if (!type || !VALID_TYPES.has(type.toLowerCase())) {
    errors.push(`type "${type ?? ''}" must be "income" or "expense"`)
  }

  if (!category || category.trim() === '') {
    errors.push('category is required')
  }

  const amount = parseFloat(amountStr)
  if (amountStr === undefined || amountStr.trim() === '') {
    errors.push('amount is required')
  } else if (isNaN(amount)) {
    errors.push(`amount "${amountStr}" is not a number`)
  } else if (amount === 0) {
    errors.push('amount must be non-zero')
  }

  if (!client || client.trim() === '') {
    errors.push('customer name is required')
  }

  if (errors.length > 0) {
    return { line: lineNumber, raw: rawFields, errors }
  }

  return {
    line: lineNumber,
    raw: rawFields,
    errors: [],
    data: {
      date,
      type: type.toLowerCase() as 'income' | 'expense',
      category: category.trim(),
      amount: Math.abs(amount),
      client: client.trim(),
      notes: notes.trim() || undefined,
    },
  }
}

// ─── Duplicate detection ──────────────────────────────────────────────────────

/**
 * A row is considered a duplicate when an existing transaction shares the same
 * date, type, amount, and client (case-insensitive).
 */
export function isDuplicate(row: NewTransaction, existing: Transaction[]): boolean {
  return existing.some(
    (t) =>
      t.date === row.date &&
      t.type === row.type &&
      t.amount === row.amount &&
      t.client.toLowerCase() === row.client.toLowerCase(),
  )
}

// ─── Main entry point ─────────────────────────────────────────────────────────

/**
 * Parse CSV text and classify every data row as valid, invalid, or duplicate.
 *
 * Accepted column order (matches our CSV export):
 *   date, type, category, amount, customer, notes
 *
 * Rows that look like metadata / summary / header lines are silently skipped.
 */
export function parseImportCsv(
  csvText: string,
  existingTransactions: Transaction[] = [],
): ImportPreview {
  const lines = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')

  const valid: ParsedRow[] = []
  const invalid: ParsedRow[] = []
  const duplicates: ParsedRow[] = []

  let dataStarted = false
  let lineNumber = 0

  for (const line of lines) {
    lineNumber++
    const trimmed = line.trim()

    // Skip blank lines and comment-like metadata lines
    if (trimmed === '' || trimmed.startsWith('#')) continue

    const fields = parseCsvLine(trimmed)
    if (fields.length < 4) continue // too few columns, probably a section header

    const firstField = fields[0].toLowerCase()

    // Detect our own header row or section markers and skip
    if (
      firstField === 'date' ||
      firstField === 'mediledger' ||
      firstField === 'period' ||
      firstField === 'generated' ||
      firstField === 'records' ||
      firstField === 'summary' ||
      firstField === 'transactions' ||
      firstField === 'metric' ||
      firstField === 'total income' ||
      firstField === 'total expenses' ||
      firstField === 'net profit' ||
      firstField === 'profit margin'
    ) {
      continue
    }

    // Once we see a line that looks like a data row, we are in the data section
    dataStarted = true

    const result = validateRow(fields, lineNumber)

    if (result.errors.length > 0) {
      invalid.push(result)
    } else if (result.data && isDuplicate(result.data, existingTransactions)) {
      duplicates.push(result)
    } else {
      valid.push(result)
    }
  }

  // If nothing looked like data, return everything as invalid with a hint
  if (!dataStarted && valid.length === 0 && invalid.length === 0) {
    invalid.push({
      line: 0,
      raw: [],
      errors: ['No recognisable transaction rows found. Check that the file matches the expected format.'],
    })
  }

  return { valid, invalid, duplicates }
}

// ─── Expected CSV template ────────────────────────────────────────────────────

export const CSV_TEMPLATE = `date,type,category,amount,customer,notes
2026-04-01,income,Medical Equipment Sales,45000,Metro General Hospital,MRI Scanner
2026-04-05,expense,Staff Salaries,28000,Internal,Monthly payroll
`
