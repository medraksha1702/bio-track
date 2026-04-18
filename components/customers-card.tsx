'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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

// ─── Single row ────────────────────────────────────────────────────────────────

function CustomerRow({ customer }: { customer: Customer }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(customer.name)
  const [updateCustomer, { isLoading: saving }] = useUpdateCustomerMutation()
  const [deleteCustomer, { isLoading: deleting }] = useDeleteCustomerMutation()
  const [saveError, setSaveError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      setDraft(customer.name)
      setSaveError('')
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [editing, customer.name])

  const handleSave = async () => {
    if (!draft.trim() || draft.trim() === customer.name) {
      setEditing(false)
      return
    }
    setSaveError('')
    try {
      await updateCustomer({ id: customer.id, name: draft.trim() }).unwrap()
      setEditing(false)
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message ?? 'Failed to save'
      setSaveError(msg)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') setEditing(false)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      className="flex items-center gap-2 rounded-lg border border-border/40 bg-background px-3 py-2 transition-colors hover:bg-muted/30"
    >
      {editing ? (
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-7 flex-1 border-primary/40 text-sm focus-visible:ring-1 focus-visible:ring-primary/40"
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-emerald-600 hover:bg-emerald-50"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-muted-foreground hover:bg-muted"
              onClick={() => setEditing(false)}
              disabled={saving}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          {saveError && (
            <p className="flex items-center gap-1 text-[11px] text-destructive">
              <AlertCircle className="h-3 w-3" />
              {saveError}
            </p>
          )}
        </div>
      ) : (
        <>
          <span className="flex-1 text-sm">{customer.name}</span>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 focus:opacity-100"
            onClick={() => setEditing(true)}
            aria-label={`Rename ${customer.name}`}
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
        </>
      )}
    </motion.div>
  )
}

// ─── Card ──────────────────────────────────────────────────────────────────────

export function CustomersCard() {
  const { data: customers = [], isLoading } = useGetCustomersQuery()
  const [addCustomer, { isLoading: adding }] = useAddCustomerMutation()
  const [newName, setNewName] = useState('')
  const [addError, setAddError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleAdd = async () => {
    const name = newName.trim()
    if (!name) return
    setAddError('')
    try {
      await addCustomer({ name }).unwrap()
      setNewName('')
      inputRef.current?.focus()
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message ?? 'Failed to add'
      setAddError(msg)
    }
  }

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
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                value={newName}
                onChange={(e) => { setNewName(e.target.value); setAddError('') }}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                placeholder="New customer name…"
                className="h-9 flex-1 border-border/60 bg-muted/30 text-sm focus-visible:ring-2 focus-visible:ring-primary/30"
              />
              <Button
                size="sm"
                className="h-9 gap-1.5"
                onClick={handleAdd}
                disabled={adding || !newName.trim()}
              >
                {adding ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                Add
              </Button>
            </div>
            {addError && (
              <p className="flex items-center gap-1 text-[11px] text-destructive">
                <AlertCircle className="h-3 w-3" />
                {addError}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
