'use client'

import { useMemo, useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { DashboardHeader } from '@/components/dashboard-header'
import { ProfitChart } from '@/components/profit-chart'
import { DateRangeFilter } from '@/components/date-range-filter'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { FileDown, FileSpreadsheet, FileText, Loader2 } from 'lucide-react'
import { useGetSummaryQuery, useGetTransactionsQuery } from '@/lib/services/api'
import { transactionsToCsv, downloadTextFile } from '@/lib/export-csv'
import { staggerContainer, staggerItem } from '@/lib/animations'
import { DEFAULT_FILTER, getDateRange, getFilterLabel, type DateFilter } from '@/lib/date-filters'

export default function ReportsPage() {
  const [dateFilter, setDateFilter] = useState<DateFilter>(DEFAULT_FILTER)
  const filterParams = useMemo(() => getDateRange(dateFilter), [dateFilter])
  const filterLabel = getFilterLabel(dateFilter)

  const { data: summary } = useGetSummaryQuery(filterParams)
  const { data: transactions = [], isFetching: txLoading } = useGetTransactionsQuery(filterParams)

  const [pdfLoading, setPdfLoading] = useState(false)

  const periodRangeLine = useMemo(() => {
    if (!filterParams?.startDate || !filterParams?.endDate) return 'All recorded transactions'
    return `${filterParams.startDate} → ${filterParams.endDate}`
  }, [filterParams])

  const noData = !txLoading && transactions.length === 0

  const handleExportCsv = useCallback(() => {
    const stamp = format(new Date(), 'yyyy-MM-dd')
    const suffix =
      filterParams?.startDate && filterParams?.endDate
        ? `${filterParams.startDate}_to_${filterParams.endDate}`
        : 'all'
    downloadTextFile(
      `BioTrack-transactions_${suffix}_${stamp}.csv`,
      transactionsToCsv(transactions, {
        filterLabel,
        periodLine: periodRangeLine,
        generatedAt: new Date(),
      }),
    )
  }, [transactions, filterParams, filterLabel, periodRangeLine])

  const handleExportPdf = useCallback(async () => {
    setPdfLoading(true)
    try {
      const { exportToPdf } = await import('@/lib/export-pdf')
      exportToPdf({ transactions, summary, filterLabel, periodLine: periodRangeLine })
    } finally {
      setPdfLoading(false)
    }
  }, [transactions, summary, filterLabel, periodRangeLine])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardHeader
        title="Reports"
        description="Profit trends and data exports"
      />
      <main className="flex-1 p-6 md:p-8">
        <motion.div
          className="mx-auto max-w-4xl space-y-6"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {/* ── Date filter ─────────────────────────────────────────── */}
          <motion.div variants={staggerItem}>
            <DateRangeFilter value={dateFilter} onChange={setDateFilter} />
          </motion.div>

          {/* ── Profit trend chart ──────────────────────────────────── */}
          <motion.div variants={staggerItem}>
            <ProfitChart
              filter={filterParams}
              description="Monthly net profit (income minus expenses) for the selected period"
            />
          </motion.div>

          {/* ── Export card ─────────────────────────────────────────── */}
          <motion.div variants={staggerItem}>
            <Card className="border-border/40 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <FileDown className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">Export</CardTitle>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Download the transactions that match the filter above
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pt-0">
                {/* Dataset preview */}
                {txLoading ? (
                  <Skeleton className="h-12 w-full rounded-xl" />
                ) : noData ? (
                  <p className="rounded-xl border border-dashed border-border/60 bg-muted/10 px-4 py-3 text-sm text-muted-foreground">
                    No transactions in this range. Adjust the filter or add transactions on the
                    dashboard.
                  </p>
                ) : (
                  <div className="rounded-xl border border-border/40 bg-muted/20 px-4 py-2.5">
                    <p className="text-sm font-medium">
                      {transactions.length} transaction{transactions.length === 1 ? '' : 's'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {filterLabel} · {periodRangeLine}
                    </p>
                  </div>
                )}

                {/* Buttons */}
                <div className="grid gap-3 sm:grid-cols-2">
                  {/* CSV */}
                  <motion.button
                    type="button"
                    disabled={txLoading || noData}
                    onClick={handleExportCsv}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="group flex items-center gap-4 rounded-xl border border-border/40 bg-card p-4 text-left shadow-sm transition-all hover:border-emerald-500/30 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 transition-colors group-hover:bg-emerald-500/15">
                      <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-foreground">
                        Download CSV
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        Spreadsheet · all columns included
                      </span>
                    </span>
                  </motion.button>

                  {/* PDF */}
                  <motion.button
                    type="button"
                    disabled={txLoading || noData || pdfLoading}
                    onClick={handleExportPdf}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="group flex items-center gap-4 rounded-xl border border-border/40 bg-card p-4 text-left shadow-sm transition-all hover:border-rose-500/30 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 transition-colors group-hover:bg-rose-500/15">
                      {pdfLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin text-rose-600" />
                      ) : (
                        <FileText className="h-5 w-5 text-rose-600" />
                      )}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-foreground">
                        {pdfLoading ? 'Generating PDF…' : 'Download PDF'}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        Formatted report · summary + table
                      </span>
                    </span>
                  </motion.button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}
