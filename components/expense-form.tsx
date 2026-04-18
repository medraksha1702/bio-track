'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarIcon, Minus, Check, Loader2, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CategoryCombobox } from '@/components/category-combobox'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { useAddTransactionMutation } from '@/lib/services/api'
import { CustomerCombobox } from '@/components/customer-combobox'
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations'

export function ExpenseForm() {
  const [date, setDate] = useState<Date>()
  const [vendor, setVendor] = useState('')
  const [category, setCategory] = useState('')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const [addTransaction, { isLoading: isSubmitting, isError, error }] = useAddTransactionMutation()

  const resetForm = () => {
    setVendor('')
    setCategory('')
    setAmount('')
    setDate(undefined)
    setNotes('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await addTransaction({
        type: 'expense',
        client: vendor,
        category,
        amount: parseFloat(amount),
        date: date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        notes: notes || undefined,
      }).unwrap()
      resetForm()
      setIsSuccess(true)
      setTimeout(() => setIsSuccess(false), 2000)
    } catch {
      // error state is handled via isError from the mutation hook
    }
  }

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
    >
      <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
        <Card className="border-border/40 shadow-sm transition-shadow duration-300 hover:shadow-md">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2.5">
              <motion.div
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10"
                whileHover={{ scale: 1.1, rotate: -5 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              >
                <Minus className="h-4 w-4 text-destructive" />
              </motion.div>
              <div>
                <CardTitle className="text-base font-semibold">Add Expense</CardTitle>
                <p className="mt-0.5 text-xs text-muted-foreground">Record a new expense transaction</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isError && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {(error as { data?: { message?: string } })?.data?.message ??
                    'Failed to add expense. Please try again.'}
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
              <motion.div className="space-y-2" variants={staggerItem}>
                <Label className="text-xs font-medium text-muted-foreground">Customer</Label>
                <CustomerCombobox
                  value={vendor}
                  onChange={setVendor}
                  placeholder="Select or create customer…"
                />
              </motion.div>
              <motion.div className="space-y-2" variants={staggerItem}>
                <Label className="text-xs font-medium text-muted-foreground">Category</Label>
                <CategoryCombobox
                  type="expense"
                  value={category}
                  onChange={setCategory}
                  placeholder="Select or create category…"
                />
              </motion.div>
              <motion.div className="grid gap-4 sm:grid-cols-2" variants={staggerItem}>
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-xs font-medium text-muted-foreground">Amount ($)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-9 border-border/60 bg-muted/30 text-sm transition-all duration-200 focus-visible:ring-2 focus-visible:ring-destructive/30 focus-visible:border-destructive/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'h-9 w-full justify-start border-border/60 bg-muted/30 text-left text-sm font-normal transition-all duration-200 hover:bg-muted/50 focus:ring-2 focus:ring-destructive/30',
                          !date && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                        {date ? format(date, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto rounded-lg p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </motion.div>
              <motion.div className="space-y-2" variants={staggerItem}>
                <Label htmlFor="notes" className="text-xs font-medium text-muted-foreground">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes..."
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="border-border/60 bg-muted/30 text-sm transition-all duration-200 focus-visible:ring-2 focus-visible:ring-destructive/30 focus-visible:border-destructive/50"
                />
              </motion.div>
              <motion.div variants={staggerItem}>
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <Button
                    type="submit"
                    variant="destructive"
                    className={cn(
                      'h-9 w-full text-sm font-medium transition-all duration-300',
                      isSuccess && 'bg-success hover:bg-success'
                    )}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : isSuccess ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Added Successfully!
                      </>
                    ) : (
                      'Add Expense'
                    )}
                  </Button>
                </motion.div>
              </motion.div>
            </motion.form>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
