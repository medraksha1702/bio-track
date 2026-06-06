'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { DashboardHeader } from '@/components/dashboard-header'
import { IncomeForm } from '@/components/income-form'
import { IncomeTable } from '@/components/income-table'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { staggerContainer, staggerItem } from '@/lib/animations'
import { getDateRange, getFilterLabel } from '@/lib/date-filters'
import { useDateFilter } from '@/lib/date-filter-context'

export default function IncomePage() {
  const { dateFilter } = useDateFilter()
  const filterParams = useMemo(() => getDateRange(dateFilter), [dateFilter])
  const filterLabel = getFilterLabel(dateFilter)
  const [formOpen, setFormOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardHeader
        title="Income"
        description="Track and manage your income streams"
        showDateFilter
      />
      <main className="flex-1 p-6 md:p-8">
        <motion.div
          className="mx-auto max-w-7xl space-y-4"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {/* Control bar */}
          <motion.div
            variants={staggerItem}
            className="flex flex-wrap items-center justify-between gap-3"
          >
            <p className="text-xs text-muted-foreground">
              Showing data for:{' '}
              <span className="font-medium text-foreground">{filterLabel}</span>
              {filterParams?.startDate && filterParams?.endDate && (
                <span className="ml-1">
                  ({new Date(filterParams.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(filterParams.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})
                </span>
              )}
            </p>
            <Button
              size="sm"
              className="h-9 gap-1.5 bg-success text-success-foreground hover:bg-success/90"
              onClick={() => setFormOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Add Income
            </Button>
          </motion.div>

          {/* Table */}
          <motion.div variants={staggerItem}>
            <IncomeTable filterParams={filterParams} />
          </motion.div>
        </motion.div>
      </main>

      {/* Add Income dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Income</DialogTitle>
          </DialogHeader>
          <IncomeForm embedded onSuccess={() => setFormOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
