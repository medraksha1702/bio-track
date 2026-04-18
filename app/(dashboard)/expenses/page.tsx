'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { DashboardHeader } from '@/components/dashboard-header'
import { ExpenseForm } from '@/components/expense-form'
import { ExpenseTable } from '@/components/expense-table'
import { DateRangeFilter } from '@/components/date-range-filter'
import { staggerContainer, staggerItem } from '@/lib/animations'
import { DEFAULT_FILTER, getDateRange, type DateFilter } from '@/lib/date-filters'

export default function ExpensesPage() {
  const [dateFilter, setDateFilter] = useState<DateFilter>(DEFAULT_FILTER)
  const filterParams = useMemo(() => getDateRange(dateFilter), [dateFilter])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardHeader
        title="Expenses"
        description="Track and manage your expenses"
      />
      <main className="flex-1 p-6 md:p-8">
        <motion.div
          className="mx-auto max-w-7xl"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <div className="grid gap-6 lg:grid-cols-3">
            <motion.div className="lg:col-span-1" variants={staggerItem}>
              <ExpenseForm />
            </motion.div>
            <motion.div className="lg:col-span-2 space-y-4" variants={staggerItem}>
              <DateRangeFilter value={dateFilter} onChange={setDateFilter} />
              <ExpenseTable filterParams={filterParams} />
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
