'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { useGetTransactionsQuery, type TransactionFilter } from '@/lib/services/api'
import { buildIncomeExpenseSeries } from '@/lib/chart-data'
import { fadeInUp } from '@/lib/animations'

const chartConfig = {
  income: {
    label: 'Income',
    color: 'var(--color-chart-2)',
  },
  expense: {
    label: 'Expenses',
    color: 'var(--color-chart-1)',
  },
} satisfies ChartConfig

function formatYAxis(value: number) {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}k`
  return `$${Math.round(value)}`
}

type IncomeExpenseChartProps = {
  filter?: TransactionFilter
}

export function IncomeExpenseChart({ filter }: IncomeExpenseChartProps) {
  const { data: transactions, isLoading, isError, refetch } = useGetTransactionsQuery(filter)

  const chartData = useMemo(
    () => buildIncomeExpenseSeries(transactions ?? []),
    [transactions]
  )

  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible">
      <Card className="border-border/40 shadow-sm transition-shadow duration-300 hover:shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Income vs Expenses</CardTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Monthly comparison for the selected range
          </p>
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
          ) : chartData.length === 0 ? (
            <div className="flex h-[280px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border/60 bg-muted/10 px-6 text-center">
              <p className="text-sm font-medium text-muted-foreground">No transactions in this range</p>
              <p className="text-xs text-muted-foreground">
                Try selecting "All Time" or a wider date range.
              </p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <ChartContainer config={chartConfig} className="h-[280px] w-full">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  barGap={3}
                  barCategoryGap="30%"
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border/30"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tickMargin={12}
                    interval="preserveStartEnd"
                    minTickGap={24}
                    tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickMargin={12}
                    tickFormatter={formatYAxis}
                    tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) => [
                          `$${Number(value).toLocaleString()}`,
                          name === 'income' ? 'Income' : 'Expenses',
                        ]}
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar
                    dataKey="income"
                    fill="var(--color-chart-2)"
                    radius={[3, 3, 0, 0]}
                    maxBarSize={44}
                    animationDuration={900}
                    animationEasing="ease-out"
                  />
                  <Bar
                    dataKey="expense"
                    fill="var(--color-chart-1)"
                    radius={[3, 3, 0, 0]}
                    maxBarSize={44}
                    animationDuration={900}
                    animationEasing="ease-out"
                  />
                </BarChart>
              </ChartContainer>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
