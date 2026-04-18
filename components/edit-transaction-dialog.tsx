'use client'

import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { CalendarIcon, Loader2, AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import type { Transaction } from '@/lib/data'
import { useUpdateTransactionMutation } from '@/lib/services/api'
import { CategoryCombobox } from '@/components/category-combobox'
import { CustomerCombobox } from '@/components/customer-combobox'

interface EditTransactionDialogProps {
  transaction: Transaction | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditTransactionDialog({
  transaction,
  open,
  onOpenChange,
}: EditTransactionDialogProps) {
  const [type, setType] = useState<'income' | 'expense'>('income')
  const [client, setClient] = useState('')
  const [category, setCategory] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [notes, setNotes] = useState('')

  const [updateTransaction, { isLoading, isError, error, reset }] =
    useUpdateTransactionMutation()

  // Sync form state whenever the dialog opens with a new transaction
  useEffect(() => {
    if (transaction && open) {
      setType(transaction.type)
      setClient(transaction.client)
      setCategory(transaction.category)
      setAmount(String(transaction.amount))
      setDate(parseISO(transaction.date))
      setNotes(transaction.notes ?? '')
      reset()
    }
  }, [transaction, open, reset])

  // Reset category when transaction type changes
  useEffect(() => {
    setCategory('')
  }, [type])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!transaction) return

    try {
      await updateTransaction({
        id: transaction.id,
        type,
        client,
        category,
        amount: parseFloat(amount),
        date: date ? format(date, 'yyyy-MM-dd') : transaction.date,
        notes: notes || undefined,
      }).unwrap()
      onOpenChange(false)
    } catch {
      // error shown via isError
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 p-0">
        <DialogHeader className="border-b border-border/40 px-6 py-4">
          <DialogTitle className="text-base font-semibold">Edit Transaction</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 px-6 py-5">
            {isError && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {(error as { data?: { message?: string } })?.data?.message ??
                    'Failed to update transaction. Please try again.'}
                </span>
              </div>
            )}

            {/* Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Type</Label>
                <Select
                  value={type}
                  onValueChange={(v) => setType(v as 'income' | 'expense')}
                >
                  <SelectTrigger className="h-9 border-border/60 bg-muted/30 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income" className="text-sm text-success">Income</SelectItem>
                    <SelectItem value="expense" className="text-sm text-destructive">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="edit-amount" className="text-xs font-medium text-muted-foreground">
                  Amount ($)
                </Label>
                <Input
                  id="edit-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-9 border-border/60 bg-muted/30 text-sm focus-visible:ring-2 focus-visible:ring-primary/30"
                />
              </div>
            </div>

            {/* Customer */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Customer</Label>
              <CustomerCombobox
                value={client}
                onChange={setClient}
                placeholder="Select or create customer…"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Category</Label>
              <CategoryCombobox
                type={type as 'income' | 'expense'}
                value={category}
                onChange={setCategory}
                placeholder="Select or create category…"
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      'h-9 w-full justify-start border-border/60 bg-muted/30 text-left text-sm font-normal hover:bg-muted/50',
                      !date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                    {date ? format(date, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto rounded-lg p-0" align="start">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="edit-notes" className="text-xs font-medium text-muted-foreground">Notes</Label>
              <Textarea
                id="edit-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes..."
                className="border-border/60 bg-muted/30 text-sm focus-visible:ring-2 focus-visible:ring-primary/30"
              />
            </div>
          </div>

          <DialogFooter className="border-t border-border/40 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              className="h-9 border-border/60 text-sm"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-9 text-sm"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
