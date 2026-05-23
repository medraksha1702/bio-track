'use client'

import { motion } from 'framer-motion'
import { FileText, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useGetInvoicesQuery, type Invoice } from '@/lib/services/api'
import { staggerContainer, staggerItem } from '@/lib/animations'
import { formatCurrency } from '@/lib/format-currency'

function calcStats(invoices: Invoice[]) {
  const total = invoices.reduce((s, i) => s + Number(i.total), 0)
  const paid = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + Number(i.total), 0)
  const pending = invoices.filter((i) => i.status === 'draft' || i.status === 'sent').reduce((s, i) => s + Number(i.total), 0)
  const overdue = invoices.filter((i) => i.status === 'overdue').reduce((s, i) => s + Number(i.total), 0)
  return { total, paid, pending, overdue }
}

export function BillingStats() {
  const { data: invoices = [] } = useGetInvoicesQuery(undefined)
  const stats = calcStats(invoices)

  const cards = [
    {
      label: 'Total Billed',
      value: formatCurrency(stats.total),
      sub: `${invoices.length} invoice${invoices.length !== 1 ? 's' : ''}`,
      icon: FileText,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Paid',
      value: formatCurrency(stats.paid),
      sub: `${invoices.filter((i) => i.status === 'paid').length} invoice${invoices.filter((i) => i.status === 'paid').length !== 1 ? 's' : ''}`,
      icon: CheckCircle,
      color: 'text-success',
      bg: 'bg-success/10',
    },
    {
      label: 'Pending',
      value: formatCurrency(stats.pending),
      sub: 'Draft & sent',
      icon: Clock,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Overdue',
      value: formatCurrency(stats.overdue),
      sub: `${invoices.filter((i) => i.status === 'overdue').length} invoice${invoices.filter((i) => i.status === 'overdue').length !== 1 ? 's' : ''}`,
      icon: AlertTriangle,
      color: 'text-destructive',
      bg: 'bg-destructive/10',
    },
  ]

  return (
    <motion.div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {cards.map((card) => (
        <motion.div key={card.label} variants={staggerItem}>
          <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
            <Card className="border-border/40 shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
                    <p className="mt-1 text-xl font-semibold tracking-tight">{card.value}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{card.sub}</p>
                  </div>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.bg}`}>
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      ))}
    </motion.div>
  )
}
