'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  X,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  useGetCustomersQuery,
  useAddCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  type Customer,
} from '@/lib/services/api'
import { fadeInUp, tableRow } from '@/lib/animations'

// ─── Add / Edit dialog ───────────────────────────────────────────────────────

export function CustomerFormDialog({
  customer,
  isOpen,
  onOpenChange,
}: {
  customer?: Customer
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [updateCustomer, { isLoading: saving }] = useUpdateCustomerMutation()
  const [addCustomer, { isLoading: adding }] = useAddCustomerMutation()
  const [formData, setFormData] = useState({
    name: '',
    contact_number: '',
    gst_number: '',
    bill_to_address: '',
    ship_to_address: '',
  })
  const [error, setError] = useState('')

  useEffect(() => {
    setFormData({
      name: customer?.name || '',
      contact_number: customer?.contact_number || '',
      gst_number: customer?.gst_number || '',
      bill_to_address: customer?.bill_to_address || '',
      ship_to_address: customer?.ship_to_address || '',
    })
    setError('')
  }, [customer, isOpen])

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Name is required')
      return
    }
    setError('')
    try {
      if (customer) {
        await updateCustomer({ id: customer.id, ...formData }).unwrap()
      } else {
        await addCustomer(formData).unwrap()
      }
      onOpenChange(false)
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message ?? 'Failed to save'
      setError(msg)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{customer ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Name*</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Customer name"
              className="mt-1 h-9 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Contact Number</label>
            <Input
              value={formData.contact_number}
              onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
              placeholder="+1 (555) 000-0000"
              className="mt-1 h-9 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">GST Number</label>
            <Input
              value={formData.gst_number}
              onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
              placeholder="GST/Tax ID"
              className="mt-1 h-9 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Bill To Address</label>
            <Input
              value={formData.bill_to_address}
              onChange={(e) => setFormData({ ...formData, bill_to_address: e.target.value })}
              placeholder="Billing address"
              className="mt-1 h-9 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Ship To Address</label>
            <Input
              value={formData.ship_to_address}
              onChange={(e) => setFormData({ ...formData, ship_to_address: e.target.value })}
              placeholder="Shipping address"
              className="mt-1 h-9 text-sm"
            />
          </div>
          {error && (
            <p className="flex items-center gap-1 text-xs text-destructive">
              <AlertCircle className="h-3 w-3" />
              {error}
            </p>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || adding}>
            {saving || adding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Single row ────────────────────────────────────────────────────────────────

function CustomerTableRow({ customer, index }: { customer: Customer; index: number }) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteCustomer, { isLoading: deleting }] = useDeleteCustomerMutation()

  return (
    <motion.tr
      className="group border-b border-border/40 transition-colors duration-200 hover:bg-muted/30"
      variants={tableRow}
      custom={index}
      initial="hidden"
      animate="visible"
    >
      <TableCell className="py-3 text-sm font-medium">{customer.name}</TableCell>
      <TableCell className="py-3 text-sm text-muted-foreground">
        {customer.contact_number || '—'}
      </TableCell>
      <TableCell className="py-3 text-sm text-muted-foreground">
        {customer.gst_number || '—'}
      </TableCell>
      <TableCell className="max-w-[200px] truncate py-3 text-sm text-muted-foreground">
        {customer.bill_to_address || '—'}
      </TableCell>
      <TableCell className="max-w-[200px] truncate py-3 text-sm text-muted-foreground">
        {customer.ship_to_address || '—'}
      </TableCell>
      <TableCell className="py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <CustomerFormDialog customer={customer} isOpen={editOpen} onOpenChange={setEditOpen} />
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 focus:opacity-100"
            onClick={() => setEditOpen(true)}
            aria-label={`Edit ${customer.name}`}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100 focus:opacity-100"
                disabled={deleting}
                aria-label={`Delete ${customer.name}`}
              >
                {deleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete customer?</AlertDialogTitle>
                <AlertDialogDescription>
                  <strong>&quot;{customer.name}&quot;</strong> will be removed from the list.
                  Existing transactions are not affected.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => deleteCustomer(customer.id)}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </motion.tr>
  )
}

// ─── Table ───────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10

export function CustomersTable() {
  const { data: customers = [], isLoading, isError } = useGetCustomersQuery()
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return customers
    return customers.filter((c) =>
      [c.name, c.contact_number, c.gst_number, c.bill_to_address, c.ship_to_address]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(q)),
    )
  }, [customers, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  useEffect(() => {
    if (page > totalPages) setPage(1)
  }, [totalPages, page])

  const paged = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, (page - 1) * PAGE_SIZE + PAGE_SIZE),
    [filtered, page],
  )

  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible">
      <Card className="border-border/40 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold">Customer Directory</CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {customers.length > 0
                  ? `${customers.length} customer${customers.length === 1 ? '' : 's'}`
                  : 'All customers used when adding transactions'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative w-[180px] sm:w-[220px]">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search customers…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 border-border/60 bg-muted/30 pl-8 text-xs placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-ring/30"
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
              <Button size="sm" className="h-9 gap-1.5" onClick={() => setAddOpen(true)}>
                <Plus className="h-3.5 w-3.5" />
                Add Customer
              </Button>
              <CustomerFormDialog isOpen={addOpen} onOpenChange={setAddOpen} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isError && (
            <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              Failed to load customers. Please try again.
            </div>
          )}
          <div className="overflow-x-auto rounded-lg border border-border/40">
            <Table>
              <TableHeader>
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="h-10 text-xs font-medium text-muted-foreground">Name</TableHead>
                  <TableHead className="h-10 text-xs font-medium text-muted-foreground">Contact</TableHead>
                  <TableHead className="h-10 text-xs font-medium text-muted-foreground">GST Number</TableHead>
                  <TableHead className="h-10 text-xs font-medium text-muted-foreground">Bill To</TableHead>
                  <TableHead className="h-10 text-xs font-medium text-muted-foreground">Ship To</TableHead>
                  <TableHead className="h-10 w-24 text-right text-xs font-medium text-muted-foreground">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-b border-border/40">
                      <TableCell className="py-3"><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell className="py-3"><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="py-3"><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell className="py-3"><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell className="py-3"><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell className="py-3 text-right"><Skeleton className="ml-auto h-7 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                      {search ? 'No customers match your search.' : 'No customers yet. Add one to get started.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  paged.map((c, i) => <CustomerTableRow key={c.id} customer={c} index={i} />)
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>

        {filtered.length > PAGE_SIZE && (
          <CardFooter className="flex items-center justify-between border-t border-border/40 px-5 py-3">
            <p className="text-xs text-muted-foreground">
              Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filtered.length)} of{' '}
              {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1 px-2">
                <span className="text-xs font-medium">{page}</span>
                <span className="text-xs text-muted-foreground">of</span>
                <span className="text-xs font-medium">{totalPages}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </motion.div>
  )
}
