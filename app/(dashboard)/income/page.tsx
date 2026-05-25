'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { DashboardHeader } from '@/components/dashboard-header'
import { IncomeForm } from '@/components/income-form'
import { IncomeTable } from '@/components/income-table'
import { DateRangeFilter } from '@/components/date-range-filter'
import { staggerContainer, staggerItem } from '@/lib/animations'
import { getDateRange, getFilterLabel } from '@/lib/date-filters'
import { useDateFilter } from '@/lib/date-filter-context'

export default function IncomePage() {
  const { dateFilter, setDateFilter } = useDateFilter()
  const filterParams = useMemo(() => getDateRange(dateFilter), [dateFilter])
  const filterLabel = getFilterLabel(dateFilter)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardHeader
        title="Income"
        description="Track and manage your income streams"
      />
      <main className="flex-1 p-6 md:p-8">
        <motion.div
          className="mx-auto max-w-7xl"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <div className="grid gap-6 lg:grid-cols-4">
            <motion.div className="lg:col-span-1" variants={staggerItem}>
              <IncomeForm />
            </motion.div>
            <motion.div className="lg:col-span-3 space-y-4" variants={staggerItem}>
              <div className="space-y-1.5">
                <DateRangeFilter value={dateFilter} onChange={setDateFilter} />
                <p className="text-xs text-muted-foreground">
                  Showing data for:{' '}
                  <span className="font-medium text-foreground">{filterLabel}</span>
                  {filterParams?.startDate && filterParams?.endDate && (
                    <span className="ml-1">
                      ({new Date(filterParams.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(filterParams.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})
                    </span>
                  )}
                </p>
              </div>
              <IncomeTable filterParams={filterParams} />
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
