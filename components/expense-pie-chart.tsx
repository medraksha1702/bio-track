'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Pie, PieChart, Cell, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { useGetTransactionsQuery, type TransactionFilter } from '@/lib/services/api'
import { buildExpenseCategoryBreakdown } from '@/lib/chart-data'
import { fadeInUp } from '@/lib/animations'

const COLOR_VARS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
]

function buildChartConfig(categories: string[]): ChartConfig {
  const config: ChartConfig = {}
  categories.forEach((cat, i) => {
    config[cat] = {
      label: cat,
      color: COLOR_VARS[i % COLOR_VARS.length],
    }
  })
  return config
}

type ExpensePieChartProps = {
  filter?: TransactionFilter
}

export function ExpensePieChart({ filter }: ExpensePieChartProps) {
  const { data: transactions, isLoading, isError, refetch } = useGetTransactionsQuery(filter)

  const pieData = useMemo(
    () => buildExpenseCategoryBreakdown(transactions ?? []),
    [transactions]
  )

  const chartConfig = useMemo(() => buildChartConfig(pieData.map((d) => d.category)), [pieData])

  const total = useMemo(() => pieData.reduce((sum, item) => sum + item.value, 0), [pieData])

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
    >
      <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
        <Card className="border-border/40 shadow-sm transition-shadow duration-300 hover:shadow-md">
          <CardHeader className="pb-2">
            <div>
              <CardTitle className="text-base font-semibold">Expense Breakdown</CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Share of expenses by category in the selected range
              </p>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <Skeleton className="h-[280px] w-full rounded-lg" />
            ) : isError ? (
              <div className="flex h-[280px] flex-col items-center justify-center gap-2 rounded-lg border border-border/40 bg-muted/20 px-4 text-center text-sm text-muted-foreground">
                <p>Could not load chart data.</p>
                <button
                  type="button"
                  className="text-xs font-medium text-primary underline underline-offset-2"
                  onClick={() => refetch()}
                >
                  Try again
                </button>
              </div>
            ) : pieData.length === 0 || total === 0 ? (
              <div className="flex h-[280px] items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/10 px-4 text-center text-sm text-muted-foreground">
                No expense transactions in this range yet.
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, rotate: -10 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <ChartContainer config={chartConfig} className="h-[280px] w-full">
                  <PieChart>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, name) => {
                            const percentage = ((Number(value) / total) * 100).toFixed(1)
                            return [`$${Number(value).toLocaleString()} (${percentage}%)`, name]
                          }}
                        />
                      }
                    />
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="45%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      nameKey="category"
                      strokeWidth={0}
                      animationBegin={200}
                      animationDuration={1000}
                      animationEasing="ease-out"
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={entry.category}
                          fill={COLOR_VARS[index % COLOR_VARS.length]}
                          className="transition-opacity duration-200 hover:opacity-80"
                        />
                      ))}
                    </Pie>
                    <Legend
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                      iconType="circle"
                      iconSize={8}
                      formatter={(value: string) => (
                        <span className="text-xs text-muted-foreground">{value}</span>
                      )}
                      wrapperStyle={{ paddingTop: '16px' }}
                    />
                  </PieChart>
                </ChartContainer>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
