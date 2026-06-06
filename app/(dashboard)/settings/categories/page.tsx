'use client'

import { motion } from 'framer-motion'
import { Tags, TrendingUp, TrendingDown } from 'lucide-react'
import { DashboardHeader } from '@/components/dashboard-header'
import { CategoriesBoard } from '@/components/categories-board'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useGetCategoriesQuery } from '@/lib/services/api'
import { staggerContainer, staggerItem } from '@/lib/animations'

export default function CategoriesSettingsPage() {
  const { data: allCategories = [], isLoading } = useGetCategoriesQuery(undefined)
  const incomeCount = allCategories.filter((c) => c.type === 'income').length
  const expenseCount = allCategories.filter((c) => c.type === 'expense').length

  const cards = [
    {
      title: 'Total Categories',
      value: allCategories.length,
      icon: Tags,
      iconColor: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Income Categories',
      value: incomeCount,
      icon: TrendingUp,
      iconColor: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Expense Categories',
      value: expenseCount,
      icon: TrendingDown,
      iconColor: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardHeader title="Categories" description="Manage your income and expense categories" />
      <main className="flex-1 p-6 md:p-8">
        <motion.div
          className="mx-auto max-w-7xl space-y-6"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {/* Summary cards */}
          <motion.div className="grid gap-4 sm:grid-cols-3" variants={staggerItem}>
            {cards.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.1 }}
              >
                <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                  <Card className="border-border/40 shadow-sm transition-shadow duration-300 hover:shadow-lg">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            {card.title}
                          </p>
                          {isLoading ? (
                            <Skeleton className="h-8 w-16" />
                          ) : (
                            <p className="text-2xl font-semibold tracking-tight">{card.value}</p>
                          )}
                        </div>
                        <div className={`rounded-xl p-2.5 ${card.bgColor}`}>
                          <card.icon className={`h-5 w-5 ${card.iconColor}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>

          {/* Income / Expense category columns */}
          <motion.div variants={staggerItem}>
            <CategoriesBoard />
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}
