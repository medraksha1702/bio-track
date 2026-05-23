'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarIcon, Plus, Trash2, Check, Loader2, AlertCircle } from 'lucide-react'
import { format, addDays } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Separator } from '@/components/ui/separator'
import { CustomerCombobox } from '@/components/customer-combobox'
import { cn } from '@/lib/utils'
import { useAddInvoiceMutation, type InvoiceStatus, type NewInvoiceItem } from '@/lib/services/api'
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations'
import { formatCurrency } from '@/lib/format-currency'

const emptyItem = (): NewInvoiceItem & { _key: string } => ({
  _key: Math.random().toString(36).slice(2),
  description: '',
  quantity: 1,
  unit_price: 0,
  amount: 0,
})

export interface InvoiceFormDefaults {
  client_name?: string
  issue_date?: Date
  due_date?: Date
  notes?: string
  transaction_id?: string
  items?: Array<{ description: string; quantity: number; unit_price: number; amount: number }>
}

interface InvoiceFormProps {
  defaultValues?: InvoiceFormDefaults
  onSuccess?: () => void
  /** When true, renders bare form content without the Card wrapper (for use inside a Dialog) */
  asDialogContent?: boolean
}

function withKeys(
  items: InvoiceFormDefaults['items'] = []
): (NewInvoiceItem & { _key: string })[] {
  return items.map((it) => ({ ...it, _key: Math.random().toString(36).slice(2) }))
}

function initialItems(dv?: InvoiceFormDefaults) {
  return dv?.items?.length ? withKeys(dv.items) : [emptyItem()]
}

export function InvoiceForm({ defaultValues, onSuccess, asDialogContent = false }: InvoiceFormProps) {
  const [clientName, setClientName] = useState(defaultValues?.client_name ?? '')
  const [status, setStatus] = useState<InvoiceStatus>('draft')
  const [issueDate, setIssueDate] = useState<Date>(defaultValues?.issue_date ?? new Date())
  const [dueDate, setDueDate] = useState<Date | undefined>(
    defaultValues?.due_date ??
      (defaultValues?.issue_date ? addDays(defaultValues.issue_date, 30) : undefined)
  )
  const [taxRate, setTaxRate] = useState(0)
  const [notes, setNotes] = useState(defaultValues?.notes ?? '')
  const [items, setItems] = useState<(NewInvoiceItem & { _key: string })[]>(initialItems(defaultValues))
  const [isSuccess, setIsSuccess] = useState(false)

  const [addInvoice, { isLoading, isError, error }] = useAddInvoiceMutation()

  const updateItem = (key: string, field: keyof NewInvoiceItem, raw: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it._key !== key) return it
        const updated = { ...it, [field]: field === 'description' ? raw : parseFloat(raw) || 0 }
        updated.amount = +(updated.quantity * updated.unit_price).toFixed(2)
        return updated
      })
    )
  }

  const subtotal = items.reduce((s, it) => s + it.amount, 0)
  const taxAmount = +(subtotal * (taxRate / 100)).toFixed(2)
  const total = +(subtotal + taxAmount).toFixed(2)

  const resetForm = () => {
    setClientName(defaultValues?.client_name ?? '')
    setStatus('draft')
    setIssueDate(defaultValues?.issue_date ?? new Date())
    setDueDate(
      defaultValues?.due_date ??
        (defaultValues?.issue_date ? addDays(defaultValues.issue_date, 30) : undefined)
    )
    setTaxRate(0)
    setNotes(defaultValues?.notes ?? '')
    setItems(initialItems(defaultValues))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validItems = items.filter((it) => it.description.trim() && it.amount > 0)
    if (!validItems.length) return

    try {
      await addInvoice({
        client_name: clientName,
        status,
        issue_date: format(issueDate, 'yyyy-MM-dd'),
        due_date: dueDate ? format(dueDate, 'yyyy-MM-dd') : format(issueDate, 'yyyy-MM-dd'),
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total,
        notes: notes || undefined,
        transaction_id: defaultValues?.transaction_id ?? null,
        items: validItems.map(({ _key: _, ...rest }) => rest),
      }).unwrap()

      resetForm()
      setIsSuccess(true)
      setTimeout(() => {
        setIsSuccess(false)
        onSuccess?.()
      }, 1500)
    } catch {
      // error shown via isError
    }
  }

  const formContent = (
    <>
      {isError && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {(error as { data?: { message?: string } })?.data?.message ?? 'Failed to create invoice.'}
          </span>
        </div>
      )}
      <motion.form
        onSubmit={handleSubmit}
        className="space-y-5"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {/* Client + Status */}
        <motion.div className="grid gap-4 sm:grid-cols-2" variants={staggerItem}>
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Client</Label>
            <CustomerCombobox
              value={clientName}
              onChange={setClientName}
              placeholder="Select or create client…"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as InvoiceStatus)}>
              <SelectTrigger className="h-9 border-border/60 bg-muted/30 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Dates */}
        <motion.div className="grid gap-4 sm:grid-cols-2" variants={staggerItem}>
          {([
            { label: 'Issue Date', value: issueDate, onChange: setIssueDate },
            { label: 'Due Date',   value: dueDate,   onChange: setDueDate   },
          ] as const).map(({ label, value, onChange }) => (
            <div key={label} className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      'h-9 w-full justify-start border-border/60 bg-muted/30 text-left text-sm font-normal',
                      !value && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                    {value ? format(value, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto rounded-lg p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={value}
                    onSelect={onChange as (d?: Date) => void}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          ))}
        </motion.div>

        <Separator />

        {/* Line Items */}
        <motion.div className="space-y-3" variants={staggerItem}>
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-muted-foreground">Line Items</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => setItems((prev) => [...prev, emptyItem()])}
            >
              <Plus className="h-3 w-3" /> Add Item
            </Button>
          </div>

          <div className="grid grid-cols-[1fr_60px_80px_80px_28px] gap-2 text-[11px] font-medium text-muted-foreground">
            <span>Description</span>
            <span className="text-right">Qty</span>
            <span className="text-right">Price (₹)</span>
            <span className="text-right">Amount</span>
            <span />
          </div>

          {items.map((item) => (
            <div
              key={item._key}
              className="grid grid-cols-[1fr_60px_80px_80px_28px] items-center gap-2"
            >
              <Input
                placeholder="Description"
                value={item.description}
                onChange={(e) => updateItem(item._key, 'description', e.target.value)}
                className="h-8 border-border/60 bg-muted/30 text-xs"
                required
              />
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={item.quantity}
                onChange={(e) => updateItem(item._key, 'quantity', e.target.value)}
                className="h-8 border-border/60 bg-muted/30 text-right text-xs"
              />
              <Input
                type="number"
                min="0"
                step="0.01"
                value={item.unit_price}
                onChange={(e) => updateItem(item._key, 'unit_price', e.target.value)}
                className="h-8 border-border/60 bg-muted/30 text-right text-xs"
              />
              <span className="text-right text-xs font-medium">{formatCurrency(item.amount)}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                onClick={() =>
                  setItems((prev) =>
                    prev.length > 1 ? prev.filter((i) => i._key !== item._key) : prev
                  )
                }
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </motion.div>

        <Separator />

        {/* Totals */}
        <motion.div className="space-y-2" variants={staggerItem}>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Tax (%)</span>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                className="h-7 w-16 border-border/60 bg-muted/30 text-center text-xs"
              />
            </div>
            <span className="font-medium">{formatCurrency(taxAmount)}</span>
          </div>
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>Total</span>
            <span className="text-base text-primary">{formatCurrency(total)}</span>
          </div>
        </motion.div>

        {/* Notes */}
        <motion.div className="space-y-2" variants={staggerItem}>
          <Label htmlFor="inv-notes" className="text-xs font-medium text-muted-foreground">
            Notes (optional)
          </Label>
          <Textarea
            id="inv-notes"
            placeholder="Payment terms, bank details, etc."
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="border-border/60 bg-muted/30 text-sm"
          />
        </motion.div>

        <motion.div variants={staggerItem}>
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
            <Button
              type="submit"
              disabled={isLoading || !clientName || items.every((i) => !i.description.trim())}
              className={cn(
                'h-9 w-full text-sm font-medium transition-all duration-300',
                isSuccess
                  ? 'bg-success text-success-foreground'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md'
              )}
            >
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating Invoice…</>
              ) : isSuccess ? (
                <><Check className="mr-2 h-4 w-4" />Invoice Created!</>
              ) : (
                'Create Invoice'
              )}
            </Button>
          </motion.div>
        </motion.div>
      </motion.form>
    </>
  )

  if (asDialogContent) return formContent

  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible">
      <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
        <Card className="border-border/40 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2.5">
              <motion.div
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              >
                <Plus className="h-4 w-4 text-primary" />
              </motion.div>
              <div>
                <CardTitle className="text-base font-semibold">New Invoice</CardTitle>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Create an invoice for your client
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>{formContent}</CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
