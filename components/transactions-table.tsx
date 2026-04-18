'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Pencil, Search, Trash2, X } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { EditTransactionDialog } from '@/components/edit-transaction-dialog'
import { useGetTransactionsQuery, useDeleteTransactionMutation } from '@/lib/services/api'
import type { TransactionFilter } from '@/lib/services/api'
import type { Transaction } from '@/lib/data'
import { fadeInUp, tableRow } from '@/lib/animations'
import { formatCurrency } from '@/lib/format-currency'

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

type TypeFilter = 'all' | 'income' | 'expense'

interface TransactionsTableProps {
  transactions?: Transaction[]
  filterParams?: TransactionFilter
  title?: string
  description?: string
  /** Cap the number of rows displayed (shows "View all" footer link when set).
   *  Also hides the search / filter bar. */
  limit?: number
}

export function TransactionsTable({
  transactions: propTransactions,
  filterParams,
  title = 'Recent Transactions',
  description = 'Your latest financial activities',
  limit,
}: TransactionsTableProps) {
  const { data: apiTransactions, isLoading, isError } = useGetTransactionsQuery(
    filterParams,
    { skip: propTransactions !== undefined }
  )
  const [deleteTransaction, { isLoading: isDeleting }] = useDeleteTransactionMutation()

  const [editTarget, setEditTarget] = useState<Transaction | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  // ── Search / filter state (only used in full-table mode) ──────────────
  const [search, setSearch]           = useState('')
  const [typeFilter, setTypeFilter]   = useState<TypeFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const allTransactions = propTransactions ?? apiTransactions ?? []
  const showFilters     = limit === undefined   // hide on limited / preview tables

  // Unique sorted categories from loaded data
  const categories = useMemo(
    () => Array.from(new Set(allTransactions.map((t) => t.category))).sort(),
    [allTransactions]
  )

  // Client-side filtering (search + type + category)
  const filteredTransactions = useMemo(() => {
    if (!showFilters) return allTransactions

    const q = search.trim().toLowerCase()
    return allTransactions.filter((t) => {
      if (typeFilter !== 'all' && t.type !== typeFilter) return false
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false
      if (q) {
        const haystack = [t.client, t.category, t.notes ?? ''].join(' ').toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [allTransactions, search, typeFilter, categoryFilter, showFilters])

  const hasActiveFilters = search !== '' || typeFilter !== 'all' || categoryFilter !== 'all'

  const clearFilters = () => {
    setSearch('')
    setTypeFilter('all')
    setCategoryFilter('all')
  }

  // Apply limit only on preview tables (no search in that case)
  const hasMore    = limit !== undefined && allTransactions.length > limit
  const displayRows = limit !== undefined
    ? allTransactions.slice(0, limit)
    : filteredTransactions

  const handleEditClick   = (t: Transaction) => { setEditTarget(t); setEditOpen(true) }
  const handleDeleteClick = (t: Transaction) => { setDeleteTarget(t); setDeleteOpen(true) }
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    await deleteTransaction(deleteTarget.id)
    setDeleteOpen(false)
    setDeleteTarget(null)
  }

  return (
    <>
      <motion.div variants={fadeInUp} initial="hidden" animate="visible">
        <Card className="border-border/40 shadow-sm">
          {/* ── Card header ─────────────────────────────────────────── */}
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <CardTitle className="text-base font-semibold">{title}</CardTitle>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {showFilters && !isLoading
                    ? hasActiveFilters
                      ? `${filteredTransactions.length} of ${allTransactions.length} transactions`
                      : `${allTransactions.length} transaction${allTransactions.length === 1 ? '' : 's'}`
                    : description}
                </p>
              </div>

              {/* Clear button — visible only when a filter is active */}
              {showFilters && hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear filters
                </Button>
              )}
            </div>

            {/* ── Filter bar (full-table only) ─────────────────────── */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-3 flex flex-wrap items-center gap-2"
              >
                {/* Text search */}
                <div className="relative min-w-[180px] flex-1">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search customer, category, notes…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-8 border-border/60 bg-muted/30 pl-8 text-xs placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-ring/30"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {/* Type pills */}
                <div className="flex items-center gap-0.5 rounded-lg border border-border/40 bg-muted/20 p-0.5">
                  {(['all', 'income', 'expense'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTypeFilter(t)}
                      className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-all duration-150 ${
                        typeFilter === t
                          ? t === 'income'
                            ? 'bg-emerald-500/15 text-emerald-700 shadow-sm ring-1 ring-emerald-500/20 dark:text-emerald-400'
                            : t === 'expense'
                            ? 'bg-rose-500/15 text-rose-700 shadow-sm ring-1 ring-rose-500/20 dark:text-rose-400'
                            : 'bg-background text-foreground shadow-sm ring-1 ring-border/30'
                          : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                      }`}
                    >
                      {t === 'all' ? 'All' : t}
                    </button>
                  ))}
                </div>

                {/* Category dropdown */}
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-8 w-[170px] border-border/60 bg-muted/30 text-xs focus:ring-1 focus:ring-ring/30">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg text-xs">
                    <SelectItem value="all" className="text-xs">All categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-xs">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>
            )}
          </CardHeader>

          {/* ── Table ───────────────────────────────────────────────── */}
          <CardContent className="pt-0">
            {isError && (
              <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                Failed to load transactions. Please try again.
              </div>
            )}
            <div className="overflow-x-auto rounded-lg border border-border/40">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/40 hover:bg-transparent">
                    <TableHead className="h-10 text-xs font-medium text-muted-foreground">Date</TableHead>
                    <TableHead className="h-10 text-xs font-medium text-muted-foreground">Type</TableHead>
                    <TableHead className="h-10 text-xs font-medium text-muted-foreground">Category</TableHead>
                    <TableHead className="h-10 text-xs font-medium text-muted-foreground">Customer</TableHead>
                    <TableHead className="h-10 text-right text-xs font-medium text-muted-foreground">Amount</TableHead>
                    <TableHead className="h-10 w-[88px] text-right text-xs font-medium text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i} className="border-b border-border/40">
                        <TableCell className="py-3"><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell className="py-3"><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                        <TableCell className="py-3"><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell className="py-3"><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell className="py-3 text-right"><Skeleton className="ml-auto h-4 w-20" /></TableCell>
                        <TableCell className="py-3 text-right"><Skeleton className="ml-auto h-7 w-16 rounded-md" /></TableCell>
                      </TableRow>
                    ))
                  ) : displayRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-12 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <p className="text-sm font-medium text-muted-foreground">
                            {hasActiveFilters ? 'No matching transactions' : 'No transactions found'}
                          </p>
                          {hasActiveFilters && (
                            <button
                              type="button"
                              onClick={clearFilters}
                              className="text-xs text-primary hover:underline"
                            >
                              Clear filters
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    <AnimatePresence mode="popLayout">
                      {displayRows.map((transaction, index) => (
                        <motion.tr
                          key={transaction.id}
                          variants={tableRow}
                          custom={index}
                          initial="hidden"
                          animate="visible"
                          exit={{ opacity: 0, height: 0 }}
                          layout
                          className="group border-b border-border/40 transition-colors duration-200 hover:bg-muted/50"
                        >
                          <TableCell className="py-3 text-sm font-medium">
                            {formatDate(transaction.date)}
                          </TableCell>
                          <TableCell className="py-3">
                            <Badge
                              variant="secondary"
                              className={`text-[11px] font-medium ${
                                transaction.type === 'income'
                                  ? 'border-success/20 bg-success/10 text-success hover:bg-success/15'
                                  : 'border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/15'
                              }`}
                            >
                              {transaction.type === 'income' ? 'Income' : 'Expense'}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 text-sm">{transaction.category}</TableCell>
                          <TableCell className="py-3 text-sm text-muted-foreground">
                            {transaction.client}
                          </TableCell>
                          <TableCell
                            className={`py-3 text-right text-sm font-semibold ${
                              transaction.type === 'income' ? 'text-success' : 'text-destructive'
                            }`}
                          >
                            {transaction.type === 'income' ? '+' : '-'}
                            {formatCurrency(transaction.amount)}
                          </TableCell>
                          <TableCell className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                onClick={() => handleEditClick(transaction)}
                                aria-label="Edit transaction"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDeleteClick(transaction)}
                                aria-label="Delete transaction"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>

          {hasMore && (
            <CardFooter className="border-t border-border/40 px-5 py-3">
              <Link
                href="/transactions"
                className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                View all {allTransactions.length} transactions
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardFooter>
          )}
        </Card>
      </motion.div>

      <EditTransactionDialog
        transaction={editTarget}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this{' '}
              <span className={deleteTarget?.type === 'income' ? 'font-medium text-success' : 'font-medium text-destructive'}>
                {deleteTarget?.type}
              </span>{' '}
              transaction of{' '}
              <span className="font-medium">
                {deleteTarget
                  ? formatCurrency(deleteTarget.amount)
                  : ''}
              </span>{' '}
              from <span className="font-medium">{deleteTarget?.client}</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
