'use client'

import { motion } from 'framer-motion'
import { DashboardHeader } from '@/components/dashboard-header'
import { BillingStats } from '@/components/billing-stats'
import { InvoiceForm } from '@/components/invoice-form'
import { InvoiceTable } from '@/components/invoice-table'
import { staggerContainer, staggerItem } from '@/lib/animations'

export default function BillingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardHeader
        title="Billing"
        description="Create invoices and track payment status"
      />
      <main className="flex-1 p-6 md:p-8">
        <motion.div
          className="mx-auto max-w-7xl space-y-6"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {/* Summary stats */}
          <motion.div variants={staggerItem}>
            <BillingStats />
          </motion.div>

          {/* Invoice form + table */}
          <div className="grid gap-6 lg:grid-cols-4">
            <motion.div className="lg:col-span-1" variants={staggerItem}>
              <InvoiceForm />
            </motion.div>
            <motion.div className="lg:col-span-3" variants={staggerItem}>
              <InvoiceTable />
            </motion.div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
