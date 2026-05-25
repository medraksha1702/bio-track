'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Users,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import {
  useGetCustomersQuery,
  useAddCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  type Customer,
} from '@/lib/services/api'

// ─── Customer Form Dialog ──────────────────────────────────────────────────────

function CustomerFormDialog({
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
    if (customer) {
      setFormData({
        name: customer.name || '',
        contact_number: customer.contact_number || '',
        gst_number: customer.gst_number || '',
        bill_to_address: customer.bill_to_address || '',
        ship_to_address: customer.ship_to_address || '',
      })
    } else {
      setFormData({
        name: '',
        contact_number: '',
        gst_number: '',
        bill_to_address: '',
        ship_to_address: '',
      })
    }
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

function CustomerRow({ customer }: { customer: Customer }) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteCustomer, { isLoading: deleting }] = useDeleteCustomerMutation()

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      className="flex items-center gap-2 rounded-lg border border-border/40 bg-background px-3 py-2 transition-colors hover:bg-muted/30"
    >
      <div className="flex-1">
        <p className="text-sm font-medium">{customer.name}</p>
        {customer.contact_number && (
          <p className="text-xs text-muted-foreground">{customer.contact_number}</p>
        )}
      </div>
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
    </motion.div>
  )
}

// ─── Card ──────────────────────────────────────────────────────────────────────

export function CustomersCard() {
  const { data: customers = [], isLoading } = useGetCustomersQuery()
  const [addOpen, setAddOpen] = useState(false)

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
      <Card className="border-border/40 shadow-sm transition-shadow duration-300 hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2.5">
            <motion.div
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
              <Users className="h-4 w-4 text-primary" />
            </motion.div>
            <div className="flex-1">
              <CardTitle className="text-base font-semibold">Customers</CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Manage the customer list used when adding transactions
              </p>
            </div>
            <Badge variant="secondary" className="text-xs">
              {customers.length} total
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
            </div>
          ) : (
            <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
              <AnimatePresence initial={false}>
                {customers.length === 0 ? (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-4 text-center text-xs text-muted-foreground"
                  >
                    No customers yet. Add one below.
                  </motion.p>
                ) : (
                  customers.map((c) => (
                    <div key={c.id} className="group">
                      <CustomerRow customer={c} />
                    </div>
                  ))
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Add new */}
          <CustomerFormDialog isOpen={addOpen} onOpenChange={setAddOpen} />
          <Button size="sm" className="w-full gap-1.5" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add Customer
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}
