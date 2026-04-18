'use client'

import { useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  Loader2,
} from 'lucide-react'
import {
  parseImportCsv,
  CSV_TEMPLATE,
  type ParsedRow,
  type ImportPreview,
} from '@/lib/import-csv'
import { downloadTextFile } from '@/lib/export-csv'
import { useGetTransactionsQuery, useAddTransactionMutation } from '@/lib/services/api'
import { formatCurrency } from '@/lib/format-currency'
import type { Transaction } from '@/lib/data'
import { cn } from '@/lib/utils'

// ─── Helpers ────────────────────────────────────────────────────────────────

function RowBadge({ row }: { row: ParsedRow }) {
  if (row.errors.length > 0)
    return <Badge variant="destructive" className="text-[10px]">Invalid</Badge>
  return <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Valid</Badge>
}

// ─── Component ───────────────────────────────────────────────────────────────

interface ImportCsvDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Step = 'upload' | 'preview' | 'done'

export function ImportCsvDialog({ open, onOpenChange }: ImportCsvDialogProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [step, setStep] = useState<Step>('upload')
  const [fileName, setFileName] = useState('')
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [includeDuplicates, setIncludeDuplicates] = useState(false)
  const [importProgress, setImportProgress] = useState<{ done: number; total: number } | null>(null)
  const [importErrors, setImportErrors] = useState<string[]>([])

  const { data: existing = [] } = useGetTransactionsQuery(undefined)
  const [addTransaction] = useAddTransactionMutation()

  // ── Reset when dialog closes ─────────────────────────────────────────────
  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setStep('upload')
      setPreview(null)
      setFileName('')
      setImportProgress(null)
      setImportErrors([])
      setIncludeDuplicates(false)
    }
    onOpenChange(v)
  }

  // ── File processing ──────────────────────────────────────────────────────
  const processFile = useCallback(
    (file: File) => {
      if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
        alert('Please select a CSV file.')
        return
      }
      setFileName(file.name)
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        const result = parseImportCsv(text, existing as Transaction[])
        setPreview(result)
        setStep('preview')
      }
      reader.readAsText(file)
    },
    [existing],
  )

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  // ── Import ───────────────────────────────────────────────────────────────
  const handleImport = async () => {
    if (!preview) return
    const rows = includeDuplicates
      ? [...preview.valid, ...preview.duplicates]
      : preview.valid

    if (rows.length === 0) return

    const errs: string[] = []
    setImportProgress({ done: 0, total: rows.length })
    setImportErrors([])

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      if (!row.data) continue
      try {
        await addTransaction(row.data).unwrap()
      } catch {
        errs.push(`Line ${row.line}: failed to import (${row.data.client} ${row.data.date})`)
      }
      setImportProgress({ done: i + 1, total: rows.length })
    }

    setImportErrors(errs)
    setStep('done')
  }

  // ── Template download ────────────────────────────────────────────────────
  const downloadTemplate = () =>
    downloadTextFile('mediledger-import-template.csv', CSV_TEMPLATE)

  // ─── Summary counts ──────────────────────────────────────────────────────
  const validCount = preview?.valid.length ?? 0
  const invalidCount = preview?.invalid.length ?? 0
  const dupCount = preview?.duplicates.length ?? 0
  const importCount = includeDuplicates ? validCount + dupCount : validCount

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Upload className="h-4 w-4 text-primary" />
            Import Transactions from CSV
          </DialogTitle>
          <DialogDescription className="text-xs">
            Upload a CSV file to bulk-import transactions. We&apos;ll validate each row and let you
            review before importing.
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* ── Step 1: Upload ─────────────────────────────────────────── */}
          {step === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              {/* Drop zone */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileRef.current?.click()}
                onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={cn(
                  'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 cursor-pointer transition-colors',
                  dragging
                    ? 'border-primary bg-primary/5'
                    : 'border-border/60 hover:border-primary/50 hover:bg-muted/30',
                )}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">Drag & drop your CSV here</p>
                  <p className="text-xs text-muted-foreground mt-0.5">or click to browse</p>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={onFileChange}
                />
              </div>

              {/* Expected format */}
              <div className="rounded-lg border border-border/40 bg-muted/30 p-4 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Expected columns
                </p>
                <code className="text-xs text-foreground/80 block">
                  date, type, category, amount, customer, notes
                </code>
                <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
                  <li><strong>date</strong> — YYYY-MM-DD format</li>
                  <li><strong>type</strong> — &quot;income&quot; or &quot;expense&quot;</li>
                  <li><strong>amount</strong> — positive number (expenses can be negative)</li>
                  <li><strong>client</strong> — customer name</li>
                  <li><strong>notes</strong> — optional</li>
                </ul>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs mt-1"
                  onClick={(e) => { e.stopPropagation(); downloadTemplate() }}
                >
                  <Download className="mr-1.5 h-3 w-3" />
                  Download template
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── Step 2: Preview ────────────────────────────────────────── */}
          {step === 'preview' && preview && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              {/* Summary bar */}
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs font-medium text-muted-foreground">{fileName}</span>
                <div className="flex gap-2 ml-auto flex-wrap">
                  <Badge className="bg-emerald-100 text-emerald-700 gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {validCount} valid
                  </Badge>
                  {dupCount > 0 && (
                    <Badge className="bg-amber-100 text-amber-700 gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {dupCount} duplicate{dupCount !== 1 ? 's' : ''}
                    </Badge>
                  )}
                  {invalidCount > 0 && (
                    <Badge variant="destructive" className="gap-1">
                      <XCircle className="h-3 w-3" />
                      {invalidCount} invalid
                    </Badge>
                  )}
                </div>
              </div>

              {/* Valid rows table */}
              {(validCount > 0 || dupCount > 0) && (
                <div className="rounded-lg border border-border/40 overflow-hidden">
                  <p className="text-xs font-medium px-3 py-2 bg-muted/40 border-b border-border/40">
                    Rows to import ({importCount})
                  </p>
                  <div className="max-h-52 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="text-xs">
                          <TableHead className="w-24">Date</TableHead>
                          <TableHead className="w-20">Type</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="w-20 text-center">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[...preview.valid, ...(includeDuplicates ? preview.duplicates : [])].map(
                          (row) => (
                            <TableRow key={row.line} className="text-xs">
                              <TableCell className="font-mono">{row.data?.date}</TableCell>
                              <TableCell>
                                <Badge
                                  className={cn(
                                    'text-[10px]',
                                    row.data?.type === 'income'
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : 'bg-red-100 text-red-700',
                                  )}
                                >
                                  {row.data?.type}
                                </Badge>
                              </TableCell>
                              <TableCell>{row.data?.category}</TableCell>
                              <TableCell>{row.data?.client}</TableCell>
                              <TableCell className="text-right font-medium">
                                {row.data ? formatCurrency(row.data.amount) : '—'}
                              </TableCell>
                              <TableCell className="text-center">
                                {preview.duplicates.includes(row) ? (
                                  <Badge className="bg-amber-100 text-amber-700 text-[10px]">
                                    Dup
                                  </Badge>
                                ) : (
                                  <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">
                                    New
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ),
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Duplicate toggle */}
              {dupCount > 0 && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-800 flex-1">
                    {dupCount} row{dupCount !== 1 ? 's look' : ' looks'} like existing transactions
                    (same date, type, amount & customer).
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-100"
                    onClick={() => setIncludeDuplicates((v) => !v)}
                  >
                    {includeDuplicates ? 'Skip duplicates' : 'Import anyway'}
                  </Button>
                </div>
              )}

              {/* Invalid rows accordion */}
              {invalidCount > 0 && (
                <Accordion type="single" collapsible>
                  <AccordionItem value="invalid" className="border border-destructive/30 rounded-lg px-3">
                    <AccordionTrigger className="text-xs font-medium text-destructive py-2 hover:no-underline">
                      {invalidCount} row{invalidCount !== 1 ? 's' : ''} with validation errors (will be skipped)
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pb-2 max-h-36 overflow-y-auto">
                        {preview.invalid.map((row) => (
                          <div
                            key={row.line}
                            className="rounded border border-destructive/20 bg-destructive/5 px-2.5 py-2"
                          >
                            {row.line > 0 && (
                              <p className="text-[10px] font-mono text-muted-foreground mb-1">
                                Line {row.line}: {row.raw.join(', ')}
                              </p>
                            )}
                            <ul className="text-xs text-destructive space-y-0.5 list-disc list-inside">
                              {row.errors.map((err, i) => (
                                <li key={i}>{err}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}

              {importCount === 0 && (
                <div className="flex flex-col items-center gap-2 py-4 text-center text-muted-foreground">
                  <XCircle className="h-8 w-8 text-destructive/60" />
                  <p className="text-sm">No valid rows to import.</p>
                  <Button variant="outline" size="sm" onClick={() => setStep('upload')}>
                    Try another file
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {/* ── Step 3: Done ───────────────────────────────────────────── */}
          {step === 'done' && importProgress && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 py-6 text-center"
            >
              {importErrors.length === 0 ? (
                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
              ) : (
                <AlertTriangle className="h-12 w-12 text-amber-500" />
              )}
              <div>
                <p className="text-base font-semibold">
                  {importProgress.done - importErrors.length} of {importProgress.total} transactions imported
                </p>
                {importErrors.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {importErrors.length} row{importErrors.length !== 1 ? 's' : ''} failed. You can re-import them individually.
                  </p>
                )}
              </div>
              {importErrors.length > 0 && (
                <div className="w-full max-h-32 overflow-y-auto rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-left">
                  {importErrors.map((e, i) => (
                    <p key={i} className="text-xs text-destructive">{e}</p>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <Separator className="bg-border/40" />

        <DialogFooter className="gap-2 sm:gap-0">
          {step === 'upload' && (
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
          )}

          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back
              </Button>
              <Button
                disabled={importCount === 0 || !!importProgress}
                onClick={handleImport}
                className="min-w-28"
              >
                {importProgress ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {importProgress.done}/{importProgress.total}
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import {importCount} row{importCount !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </>
          )}

          {step === 'done' && (
            <>
              <Button variant="outline" onClick={() => { setStep('upload'); setPreview(null); setFileName('') }}>
                Import more
              </Button>
              <Button onClick={() => handleOpenChange(false)}>Done</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
