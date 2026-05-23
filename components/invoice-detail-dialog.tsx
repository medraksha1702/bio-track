'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Eye, Download } from 'lucide-react'
import { downloadInvoicePdf } from '@/lib/export-invoice-pdf'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { InvoiceStatusBadge } from '@/components/invoice-status-badge'
import type { Invoice } from '@/lib/services/api'
import { formatCurrency } from '@/lib/format-currency'

interface Props {
  invoice: Invoice
}

export function InvoiceDetailDialog({ invoice }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
          <Eye className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="text-lg font-semibold">{invoice.invoice_number}</DialogTitle>
            <div className="flex items-center gap-2">
              <InvoiceStatusBadge status={invoice.status} />
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 text-xs"
                onClick={() => downloadInvoicePdf(invoice)}
              >
                <Download className="h-3 w-3" /> Download PDF
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 pt-2 print:text-black">
          {/* Client + dates */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Bill To</p>
              <p className="font-semibold">{invoice.client_name}</p>
            </div>
            <div className="text-right">
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">
                  Issue Date: <span className="text-foreground">{format(new Date(invoice.issue_date), 'dd MMM yyyy')}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Due Date: <span className="text-foreground">{format(new Date(invoice.due_date), 'dd MMM yyyy')}</span>
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Line items */}
          <div>
            <div className="grid grid-cols-[1fr_60px_90px_90px] gap-2 text-[11px] font-medium uppercase text-muted-foreground">
              <span>Description</span>
              <span className="text-right">Qty</span>
              <span className="text-right">Unit Price</span>
              <span className="text-right">Amount</span>
            </div>
            <div className="mt-2 space-y-2">
              {(invoice.invoice_items ?? []).map((item) => (
                <div key={item.id} className="grid grid-cols-[1fr_60px_90px_90px] gap-2 text-sm">
                  <span>{item.description}</span>
                  <span className="text-right">{item.quantity}</span>
                  <span className="text-right">{formatCurrency(item.unit_price)}</span>
                  <span className="text-right font-medium">{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Totals */}
          <div className="ml-auto w-64 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(Number(invoice.subtotal))}</span>
            </div>
            {Number(invoice.tax_rate) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax ({invoice.tax_rate}%)</span>
                <span>{formatCurrency(Number(invoice.tax_amount))}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-semibold text-base">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(Number(invoice.total))}</span>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="rounded-lg bg-muted/40 px-4 py-3">
              <p className="text-xs font-medium text-muted-foreground">Notes</p>
              <p className="mt-1 text-sm">{invoice.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
