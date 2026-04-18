'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useGetTransactionsQuery, type TransactionFilter } from '@/lib/services/api'
import { fadeInUp, tableRow } from '@/lib/animations'
import { formatCurrency } from '@/lib/format-currency'

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

interface IncomeTableProps {
  filterParams?: TransactionFilter
  pageSize?: number
}

export function IncomeTable({ filterParams, pageSize = 20 }: IncomeTableProps) {
  const { data: transactions, isLoading, isError } = useGetTransactionsQuery(filterParams)
  const [currentPage, setCurrentPage] = useState(1)

  const incomeData = transactions?.filter((t) => t.type === 'income') ?? []
  const totalIncome = incomeData.reduce((sum, entry) => sum + entry.amount, 0)

  // Pagination
  const totalPages = Math.ceil(incomeData.length / pageSize)
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return incomeData.slice(start, start + pageSize)
  }, [incomeData, currentPage, pageSize])

  const handlePrevPage = () => setCurrentPage((p) => Math.max(1, p - 1))
  const handleNextPage = () => setCurrentPage((p) => Math.min(totalPages, p + 1))

  // Reset to page 1 when data changes
  useMemo(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1)
    }
  }, [totalPages, currentPage])

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
    >
      <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
        <Card className="border-border/40 shadow-sm transition-shadow duration-300 hover:shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Income Entries</CardTitle>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {incomeData.length > 0
                    ? `${incomeData.length} income transaction${incomeData.length === 1 ? '' : 's'}`
                    : 'All recorded income transactions'}
                </p>
              </div>
              <motion.div
                className="text-right"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Total Income</p>
                {isLoading ? (
                  <Skeleton className="mt-1 h-7 w-24" />
                ) : (
                  <p className="text-xl font-semibold text-success">{formatCurrency(totalIncome)}</p>
                )}
              </motion.div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {isError && (
              <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                Failed to load income data. Please try again.
              </div>
            )}
            <div className="overflow-x-auto rounded-lg border border-border/40">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/40 hover:bg-transparent">
                    <TableHead className="h-10 text-xs font-medium text-muted-foreground">Date</TableHead>
                    <TableHead className="h-10 text-xs font-medium text-muted-foreground">Customer</TableHead>
                    <TableHead className="h-10 text-xs font-medium text-muted-foreground">Category</TableHead>
                    <TableHead className="h-10 text-xs font-medium text-muted-foreground">Notes</TableHead>
                    <TableHead className="h-10 text-right text-xs font-medium text-muted-foreground">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i} className="border-b border-border/40">
                        <TableCell className="py-3"><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell className="py-3"><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell className="py-3"><Skeleton className="h-5 w-28 rounded-full" /></TableCell>
                        <TableCell className="py-3"><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell className="py-3 text-right"><Skeleton className="ml-auto h-4 w-20" /></TableCell>
                      </TableRow>
                    ))
                  ) : incomeData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                        No income entries found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {paginatedData.map((entry, index) => (
                        <motion.tr
                          key={entry.id}
                          className="border-b border-border/40 transition-colors duration-200 hover:bg-success/5"
                          variants={tableRow}
                          custom={index}
                          initial="hidden"
                          animate="visible"
                        >
                          <TableCell className="py-3 text-sm font-medium">
                            {formatDate(entry.date)}
                          </TableCell>
                          <TableCell className="py-3 text-sm">{entry.client}</TableCell>
                          <TableCell className="py-3">
                            <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.15 }}>
                              <Badge
                                variant="secondary"
                                className="border-success/20 bg-success/10 text-[11px] font-medium text-success hover:bg-success/15"
                              >
                                {entry.category}
                              </Badge>
                            </motion.div>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate py-3 text-sm text-muted-foreground">
                            {entry.notes ?? '—'}
                          </TableCell>
                          <TableCell className="py-3 text-right text-sm font-semibold text-success">
                            +{formatCurrency(entry.amount)}
                          </TableCell>
                        </motion.tr>
                      ))}
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>

          {/* Pagination footer */}
          {incomeData.length > pageSize && (
            <CardFooter className="flex items-center justify-between border-t border-border/40 px-5 py-3">
              <p className="text-xs text-muted-foreground">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, incomeData.length)} of {incomeData.length}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1 px-2">
                  <span className="text-xs font-medium">{currentPage}</span>
                  <span className="text-xs text-muted-foreground">of</span>
                  <span className="text-xs font-medium">{totalPages}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>
      </motion.div>
    </motion.div>
  )
}
