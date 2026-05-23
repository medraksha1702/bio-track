'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Trash2, CheckCircle2, Download } from 'lucide-react'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { InvoiceStatusBadge } from '@/components/invoice-status-badge'
import { InvoiceDetailDialog } from '@/components/invoice-detail-dialog'
import { downloadInvoicePdf } from '@/lib/export-invoice-pdf'
import {
  useGetInvoicesQuery, useDeleteInvoiceMutation, useUpdateInvoiceMutation,
  type InvoiceStatus,
} from '@/lib/services/api'
import { fadeInUp, tableRow } from '@/lib/animations'
import { formatCurrency } from '@/lib/format-currency'

const PAGE_SIZE = 10

export function InvoiceTable() {
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all')
  const [currentPage, setCurrentPage] = useState(1)

  const { data: invoices = [], isLoading, isError } = useGetInvoicesQuery(undefined)
  const [deleteInvoice] = useDeleteInvoiceMutation()
  const [updateInvoice] = useUpdateInvoiceMutation()

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return invoices
    return invoices.filter((inv) => inv.status === statusFilter)
  }, [invoices, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const page = Math.min(currentPage, totalPages)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const totalBilled = filtered.reduce((s, i) => s + Number(i.total), 0)

  const handleStatusChange = async (id: string, status: InvoiceStatus) => {
    await updateInvoice({ id, status })
  }

  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible">
      <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
        <Card className="border-border/40 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold">Invoices</CardTitle>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {filtered.length} invoice{filtered.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-right text-xl font-semibold text-primary">{formatCurrency(totalBilled)}</p>
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as InvoiceStatus | 'all'); setCurrentPage(1) }}>
                  <SelectTrigger className="h-8 w-32 border-border/60 bg-muted/30 text-xs">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {isError && (
              <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                Failed to load invoices. Please try again.
              </div>
            )}
            <div className="overflow-x-auto rounded-lg border border-border/40">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/40 hover:bg-transparent">
                    <TableHead className="h-10 text-xs font-medium text-muted-foreground">Invoice #</TableHead>
                    <TableHead className="h-10 text-xs font-medium text-muted-foreground">Client</TableHead>
                    <TableHead className="h-10 text-xs font-medium text-muted-foreground">Issue Date</TableHead>
                    <TableHead className="h-10 text-xs font-medium text-muted-foreground">Due Date</TableHead>
                    <TableHead className="h-10 text-xs font-medium text-muted-foreground">Status</TableHead>
                    <TableHead className="h-10 text-right text-xs font-medium text-muted-foreground">Total</TableHead>
                    <TableHead className="h-10 w-24 text-xs font-medium text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i} className="border-b border-border/40">
                        {Array.from({ length: 7 }).map((__, j) => (
                          <TableCell key={j} className="py-3"><Skeleton className="h-4 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : paginated.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                        No invoices found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginated.map((inv, index) => (
                      <motion.tr
                        key={inv.id}
                        className="border-b border-border/40 transition-colors duration-200 hover:bg-primary/5"
                        variants={tableRow}
                        custom={index}
                        initial="hidden"
                        animate="visible"
                      >
                        <TableCell className="py-3 text-sm font-medium text-primary">{inv.invoice_number}</TableCell>
                        <TableCell className="py-3 text-sm">{inv.client_name}</TableCell>
                        <TableCell className="py-3 text-sm">{format(new Date(inv.issue_date), 'dd MMM yyyy')}</TableCell>
                        <TableCell className="py-3 text-sm">{format(new Date(inv.due_date), 'dd MMM yyyy')}</TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-center gap-1.5">
                            <Select
                              value={inv.status}
                              onValueChange={(v) => handleStatusChange(inv.id, v as InvoiceStatus)}
                            >
                              <SelectTrigger className="h-7 w-28 border-0 bg-transparent p-0 text-xs shadow-none focus:ring-0">
                                <InvoiceStatusBadge status={inv.status} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="sent">Sent</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
                                <SelectItem value="overdue">Overdue</SelectItem>
                              </SelectContent>
                            </Select>
                            {inv.status === 'paid' && inv.transaction_id && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs">
                                  Income recorded automatically
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-3 text-right text-sm font-semibold text-primary">
                          {formatCurrency(Number(inv.total))}
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-center gap-1">
                            <InvoiceDetailDialog invoice={inv} />
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                                  onClick={() => downloadInvoicePdf(inv)}
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">Download PDF</TooltipContent>
                            </Tooltip>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete {inv.invoice_number}? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteInvoice(inv.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>

          {filtered.length > PAGE_SIZE && (
            <CardFooter className="flex items-center justify-between border-t border-border/40 px-5 py-3">
              <p className="text-xs text-muted-foreground">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-2 text-xs font-medium">{page} of {totalPages}</span>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
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
