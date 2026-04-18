'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { useGetTransactionsQuery, type TransactionFilter } from '@/lib/services/api'
import { buildMonthlyProfitSeries } from '@/lib/chart-data'
import { fadeInUp } from '@/lib/animations'

const chartConfig = {
  profit: {
    label: 'Profit',
    color: 'var(--color-chart-3)',
  },
} satisfies ChartConfig

function formatYAxis(value: number) {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (abs >= 1000) return `$${(value / 1000).toFixed(abs >= 10_000 ? 0 : 1)}k`
  return `$${Math.round(value)}`
}

type ProfitChartProps = {
  filter?: TransactionFilter
  description?: string
}

export function ProfitChart({
  filter,
  description = 'Net profit (income minus expenses) by month for transactions in the selected range',
}: ProfitChartProps) {
  const { data: transactions, isLoading, isError, refetch } = useGetTransactionsQuery(filter)

  const chartData = useMemo(
    () => buildMonthlyProfitSeries(transactions ?? []),
    [transactions]
  )

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
    >
      <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
        <Card className="border-border/40 shadow-sm transition-shadow duration-300 hover:shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Revenue Overview</CardTitle>
                <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
              </div>
              <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <span className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-xs text-muted-foreground">Net profit</span>
              </motion.div>
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
            ) : chartData.length === 0 ? (
              <div className="flex h-[280px] items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/10 px-4 text-center text-sm text-muted-foreground">
                No transactions in this range yet. Add income and expenses to see monthly trends.
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <ChartContainer config={chartConfig} className="h-[280px] w-full">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-chart-3)" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="var(--color-chart-3)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" vertical={false} />
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
                          formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Net profit']}
                        />
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="profit"
                      stroke="var(--color-chart-3)"
                      strokeWidth={2}
                      fill="url(#profitGradient)"
                      animationDuration={1200}
                      animationEasing="ease-out"
                    />
                  </AreaChart>
                </ChartContainer>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
