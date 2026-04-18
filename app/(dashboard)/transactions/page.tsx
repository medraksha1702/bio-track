'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { DashboardHeader } from '@/components/dashboard-header'
import { TransactionsTable } from '@/components/transactions-table'
import { DateRangeFilter } from '@/components/date-range-filter'
import { ImportCsvDialog } from '@/components/import-csv-dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown, ArrowLeftRight, Upload } from 'lucide-react'
import { useGetSummaryQuery } from '@/lib/services/api'
import { staggerContainer, staggerItem } from '@/lib/animations'
import { DEFAULT_FILTER, getDateRange, type DateFilter } from '@/lib/date-filters'
import { formatCurrency } from '@/lib/format-currency'

export default function TransactionsPage() {
  const [dateFilter, setDateFilter] = useState<DateFilter>(DEFAULT_FILTER)
  const filterParams = useMemo(() => getDateRange(dateFilter), [dateFilter])
  const [importOpen, setImportOpen] = useState(false)

  const { data: summary, isLoading } = useGetSummaryQuery(filterParams)

  const cards = [
    {
      title: 'Total Income',
      value: summary ? formatCurrency(summary.totalIncome) : null,
      icon: TrendingUp,
      iconColor: 'text-success',
      bgColor: 'bg-success/10',
      valueColor: 'text-success',
    },
    {
      title: 'Total Expenses',
      value: summary ? formatCurrency(summary.totalExpense) : null,
      icon: TrendingDown,
      iconColor: 'text-destructive',
      bgColor: 'bg-destructive/10',
      valueColor: 'text-destructive',
    },
    {
      title: 'Net Total',
      value: summary ? formatCurrency(summary.profit) : null,
      icon: ArrowLeftRight,
      iconColor: 'text-primary',
      bgColor: 'bg-primary/10',
      valueColor: 'text-primary',
    },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardHeader
        title="Transactions"
        description="View all financial transactions"
      />
      <main className="flex-1 p-6 md:p-8">
        <motion.div
          className="mx-auto max-w-7xl space-y-6"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {/* Filter bar + Import button */}
          <motion.div variants={staggerItem} className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-0">
              <DateRangeFilter value={dateFilter} onChange={setDateFilter} />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2 border-primary/30 text-primary hover:bg-primary/5"
              onClick={() => setImportOpen(true)}
            >
              <Upload className="h-4 w-4" />
              Import CSV
            </Button>
          </motion.div>

          <ImportCsvDialog open={importOpen} onOpenChange={setImportOpen} />

          {/* Summary cards */}
          <motion.div
            className="grid gap-4 sm:grid-cols-3"
            variants={staggerItem}
          >
            {cards.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.1 }}
              >
                <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                  <Card className="group border-border/40 shadow-sm transition-shadow duration-300 hover:border-border/60 hover:shadow-lg">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            {card.title}
                          </p>
                          {isLoading ? (
                            <Skeleton className="h-8 w-24" />
                          ) : (
                            <motion.p
                              className={`text-2xl font-semibold tracking-tight ${card.valueColor}`}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
                            >
                              {card.value}
                            </motion.p>
                          )}
                        </div>
                        <motion.div
                          className={`rounded-xl p-2.5 ${card.bgColor}`}
                          whileHover={{ scale: 1.15, rotate: 5 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                        >
                          <card.icon className={`h-5 w-5 ${card.iconColor}`} />
                        </motion.div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>

          {/* Transactions table */}
          <motion.div variants={staggerItem}>
            <TransactionsTable
              filterParams={filterParams}
              title="All Transactions"
              description="Complete list of all income and expense transactions"
            />
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}
