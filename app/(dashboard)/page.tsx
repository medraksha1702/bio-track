'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { Plus, FileSpreadsheet, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DashboardHeader } from '@/components/dashboard-header'
import { DateRangeFilter } from '@/components/date-range-filter'
import { SummaryCards } from '@/components/summary-cards'
import { IncomeExpenseChart } from '@/components/income-expense-chart'
import { ExpensePieChart } from '@/components/expense-pie-chart'
import { ProfitChart } from '@/components/profit-chart'
import { TransactionsTable } from '@/components/transactions-table'
import { staggerContainer, staggerItem } from '@/lib/animations'
import { DEFAULT_FILTER, getDateRange, getFilterLabel, type DateFilter } from '@/lib/date-filters'
import { useGetTransactionsQuery, useGetSummaryQuery } from '@/lib/services/api'
import { transactionsToCsv, downloadTextFile } from '@/lib/export-csv'

export default function DashboardPage() {
  const [dateFilter, setDateFilter] = useState<DateFilter>(DEFAULT_FILTER)
  const filterParams = useMemo(() => getDateRange(dateFilter), [dateFilter])
  const filterLabel = getFilterLabel(dateFilter)

  const { data: transactions = [], isFetching: txLoading } = useGetTransactionsQuery(filterParams)
  const { data: summary } = useGetSummaryQuery(filterParams)

  const [pdfLoading, setPdfLoading] = useState(false)

  const periodRangeLine = useMemo(() => {
    if (!filterParams?.startDate || !filterParams?.endDate) return 'All recorded transactions'
    return `${filterParams.startDate} → ${filterParams.endDate}`
  }, [filterParams])

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

  const noData = !txLoading && transactions.length === 0

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardHeader
        title="Dashboard"
        description="Financial overview for your biomedical organisation"
      />

      <main className="flex-1 p-5 md:p-8">
        <motion.div
          className="mx-auto max-w-7xl space-y-6"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {/* ── Control bar ─────────────────────────────────────────── */}
          <motion.div
            variants={staggerItem}
            className="flex flex-wrap items-center justify-between gap-3"
          >
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Overview</h2>
              <p className="text-xs text-muted-foreground">
                Showing data for:{' '}
                <span className="font-medium text-foreground">{filterLabel}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <DateRangeFilter value={dateFilter} onChange={setDateFilter} />
              <Button
                asChild
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 border-border/60 text-xs"
              >
                <Link href="/income">
                  <Plus className="h-3.5 w-3.5" />
                  Add Income
                </Link>
              </Button>
              <Button asChild size="sm" className="h-8 gap-1.5 text-xs">
                <Link href="/expenses">
                  <Plus className="h-3.5 w-3.5" />
                  Add Expense
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* ── KPI cards ───────────────────────────────────────────── */}
          <motion.div variants={staggerItem}>
            <SummaryCards filterParams={filterParams} filterLabel={filterLabel} />
          </motion.div>

          {/* ── Row 1: Income/Expense bar + Expense pie ─────────────── */}
          <motion.div className="grid gap-5 lg:grid-cols-5" variants={staggerItem}>
            <div className="lg:col-span-3">
              <IncomeExpenseChart filter={filterParams} />
            </div>
            <div className="lg:col-span-2">
              <ExpensePieChart filter={filterParams} />
            </div>
          </motion.div>

          {/* ── Row 2: Profit trend + Export panel ──────────────────── */}
          <motion.div className="grid gap-5 lg:grid-cols-5" variants={staggerItem}>
            {/* Profit chart — 3 columns */}
            <div className="lg:col-span-3">
              <ProfitChart
                filter={filterParams}
                description="Monthly net profit (income minus expenses) for the selected range"
              />
            </div>

            {/* Export panel — 2 columns */}
            <div className="lg:col-span-2">
              <div className="flex h-full flex-col gap-3 rounded-xl border border-border/40 bg-card p-5 shadow-sm">
                <div>
                  <p className="text-sm font-semibold">Export data</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {noData
                      ? 'No transactions in this range'
                      : `${transactions.length} transaction${transactions.length === 1 ? '' : 's'} · ${filterLabel}`}
                  </p>
                </div>

                <div className="flex flex-1 flex-col justify-end gap-2.5 pt-2">
                  {/* CSV */}
                  <motion.button
                    type="button"
                    disabled={txLoading || noData}
                    onClick={handleExportCsv}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    className="group flex items-center gap-3 rounded-xl border border-border/40 bg-background px-4 py-3 text-left shadow-sm transition-all duration-200 hover:border-emerald-500/40 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 transition-colors group-hover:bg-emerald-500/15">
                      <FileSpreadsheet className="h-[18px] w-[18px] text-emerald-600" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-foreground">
                        Download CSV
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        Spreadsheet · all columns
                      </span>
                    </span>
                  </motion.button>

                  {/* PDF */}
                  <motion.button
                    type="button"
                    disabled={txLoading || noData || pdfLoading}
                    onClick={handleExportPdf}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    className="group flex items-center gap-3 rounded-xl border border-border/40 bg-background px-4 py-3 text-left shadow-sm transition-all duration-200 hover:border-rose-500/40 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 transition-colors group-hover:bg-rose-500/15">
                      {pdfLoading ? (
                        <Loader2 className="h-[18px] w-[18px] animate-spin text-rose-600" />
                      ) : (
                        <FileText className="h-[18px] w-[18px] text-rose-600" />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-foreground">
                        {pdfLoading ? 'Generating…' : 'Download PDF'}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        Formatted report · summary + table
                      </span>
                    </span>
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Recent transactions ──────────────────────────────────── */}
          <motion.div variants={staggerItem}>
            <TransactionsTable
              filterParams={filterParams}
              title="Recent Transactions"
              description={`Latest activity · ${filterLabel}`}
              limit={5}
            />
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}
