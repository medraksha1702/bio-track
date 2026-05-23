'use client'

import { useState } from 'react'
import { Receipt } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { InvoiceForm, type InvoiceFormDefaults } from '@/components/invoice-form'
import { InvoiceStatusBadge } from '@/components/invoice-status-badge'
import type { Transaction } from '@/lib/data'
import type { Invoice } from '@/lib/services/api'

interface Props {
  transaction: Transaction
  existingInvoice?: Invoice
}

export function CreateInvoiceDialog({ transaction, existingInvoice }: Props) {
  const [open, setOpen] = useState(false)

  if (existingInvoice) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex h-7 cursor-default items-center gap-1 rounded px-1">
            <Receipt className="h-3 w-3 shrink-0 text-muted-foreground" />
            <InvoiceStatusBadge status={existingInvoice.status} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {existingInvoice.invoice_number} · Invoice already created
        </TooltipContent>
      </Tooltip>
    )
  }

  const defaults: InvoiceFormDefaults = {
    client_name: transaction.client,
    issue_date: new Date(transaction.date),
    notes: transaction.notes ?? '',
    transaction_id: transaction.id,
    items: [
      {
        description: transaction.category,
        quantity: 1,
        unit_price: transaction.amount,
        amount: transaction.amount,
      },
    ],
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
          title="Create invoice from this entry"
        >
          <Receipt className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" />
            Create Invoice
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Pre-filled from income entry for{' '}
            <span className="font-medium text-foreground">{transaction.client}</span>. Edit as needed.
          </p>
        </DialogHeader>
        <ScrollArea className="max-h-[75vh] pr-1">
          {/* key forces a fresh mount with correct defaults each time the dialog opens */}
          <InvoiceForm
            key={transaction.id}
            defaultValues={defaults}
            onSuccess={() => setOpen(false)}
            asDialogContent
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
