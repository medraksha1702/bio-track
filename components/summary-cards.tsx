'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useGetSummaryQuery, type TransactionFilter } from '@/lib/services/api'
import { staggerContainer, staggerItem } from '@/lib/animations'
import { formatCurrency } from '@/lib/format-currency'

interface SummaryCardsProps {
  filterParams?: TransactionFilter
  filterLabel?: string
}

export function SummaryCards({ filterParams, filterLabel = 'All Time' }: SummaryCardsProps) {
  const { data: summary, isLoading, isError } = useGetSummaryQuery(filterParams)

  const profitMarginPct =
    summary && summary.totalIncome > 0
      ? (summary.profit / summary.totalIncome) * 100
      : 0

  const cards = [
    {
      title: 'Total Income',
      value: summary ? formatCurrency(summary.totalIncome) : null,
      sub: `Revenue · ${filterLabel}`,
      icon: TrendingUp,
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-500',
      valueColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'Total Expenses',
      value: summary ? formatCurrency(summary.totalExpense) : null,
      sub: `Spending · ${filterLabel}`,
      icon: TrendingDown,
      iconBg: 'bg-rose-500/10',
      iconColor: 'text-rose-500',
      valueColor: 'text-rose-600 dark:text-rose-400',
    },
    {
      title: 'Net Profit',
      value: summary ? formatCurrency(summary.profit) : null,
      sub: `Income minus expenses · ${filterLabel}`,
      icon: DollarSign,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      valueColor:
        summary && summary.profit >= 0
          ? 'text-foreground'
          : 'text-rose-600 dark:text-rose-400',
    },
    {
      title: 'Profit Margin',
      value: summary ? `${profitMarginPct.toFixed(1)}%` : null,
      sub: 'Net profit ÷ income',
      icon: Percent,
      iconBg: 'bg-violet-500/10',
      iconColor: 'text-violet-500',
      valueColor: 'text-foreground',
    },
  ]

  if (isError) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        Failed to load summary data. Please check your connection and try again.
      </div>
    )
  }

  return (
    <motion.div
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {cards.map((card) => (
        <motion.div key={card.title} variants={staggerItem}>
          <motion.div whileHover={{ y: -3, transition: { duration: 0.18 } }}>
            <Card className="group relative overflow-hidden border-border/40 bg-card shadow-sm transition-shadow duration-300 hover:border-border/60 hover:shadow-lg">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1.5">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {card.title}
                    </p>
                    {isLoading ? (
                      <Skeleton className="h-9 w-28" />
                    ) : (
                      <motion.p
                        className={`text-3xl font-bold tracking-tight ${card.valueColor}`}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                      >
                        {card.value ?? '—'}
                      </motion.p>
                    )}
                    <p className="truncate text-xs text-muted-foreground">{card.sub}</p>
                  </div>
                  <motion.div
                    className={`shrink-0 rounded-xl p-2.5 ${card.iconBg}`}
                    whileHover={{ scale: 1.12, rotate: 4 }}
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
  )
}
