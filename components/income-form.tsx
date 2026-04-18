'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { CalendarIcon, Plus, Check, Loader2, AlertCircle } from 'lucide-react'
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
import { useAddTransactionMutation, useUpdateTransactionMutation } from '@/lib/services/api'
import { CustomerCombobox } from '@/components/customer-combobox'
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations'
import { uploadReceipt, validateFile } from '@/lib/storage'

export function IncomeForm() {
  const [date, setDate] = useState<Date>()
  const [clientName, setClientName] = useState('')
  const [category, setCategory] = useState('')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [addTransaction, { isLoading: isSubmitting, isError, error }] = useAddTransactionMutation()
  const [updateTransaction] = useUpdateTransactionMutation()

  const resetForm = () => {
    setClientName('')
    setCategory('')
    setAmount('')
    setDate(undefined)
    setNotes('')
    setSelectedFile(null)
    setUploadError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)
    const validation = validateFile(file)
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid file')
      setSelectedFile(null)
      return
    }

    setSelectedFile(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Step 1: Create transaction
      const transaction = await addTransaction({
        type: 'income',
        client: clientName,
        category,
        amount: parseFloat(amount),
        date: date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        notes: notes || undefined,
      }).unwrap()

      // Step 2: Upload attachment if file is selected
      if (selectedFile && transaction.id) {
        try {
          const uploadResult = await uploadReceipt(transaction.id, selectedFile)
          
          // Step 3: Update transaction with attachment metadata
          await updateTransaction({
            id: transaction.id,
            type: transaction.type,
            client: transaction.client,
            category: transaction.category,
            amount: transaction.amount,
            date: transaction.date,
            notes: transaction.notes,
            attachment_url: uploadResult.path,
            attachment_name: uploadResult.name,
            attachment_size: uploadResult.size,
            attachment_type: uploadResult.type,
          }).unwrap()
        } catch (uploadErr) {
          // Transaction created but upload failed - show warning but don't fail completely
          console.error('Attachment upload failed:', uploadErr)
          setUploadError(uploadErr instanceof Error ? uploadErr.message : 'Failed to upload attachment')
        }
      }

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
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              >
                <Plus className="h-4 w-4 text-success" />
              </motion.div>
              <div>
                <CardTitle className="text-base font-semibold">Add Income</CardTitle>
                <p className="mt-0.5 text-xs text-muted-foreground">Record a new income transaction</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isError && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {(error as { data?: { message?: string } })?.data?.message ??
                    'Failed to add income. Please try again.'}
                </span>
              </div>
            )}
            {uploadError && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-orange-500/30 bg-orange-50 px-4 py-3 text-sm text-orange-700 dark:bg-orange-950/30 dark:text-orange-400">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Transaction created but attachment upload failed: {uploadError}
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
                  value={clientName}
                  onChange={setClientName}
                  placeholder="Select or create customer…"
                />
              </motion.div>
              <motion.div className="space-y-2" variants={staggerItem}>
                <Label className="text-xs font-medium text-muted-foreground">Category</Label>
                <CategoryCombobox
                  type="income"
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
                    className="h-9 border-border/60 bg-muted/30 text-sm transition-all duration-200 focus-visible:ring-2 focus-visible:ring-success/30 focus-visible:border-success/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          'h-9 w-full justify-start border-border/60 bg-muted/30 text-left text-sm font-normal transition-all duration-200 hover:bg-muted/50 focus:ring-2 focus:ring-success/30',
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
                  className="border-border/60 bg-muted/30 text-sm transition-all duration-200 focus-visible:ring-2 focus-visible:ring-success/30 focus-visible:border-success/50"
                />
              </motion.div>
              
              {/* Attachment Upload */}
              <motion.div className="space-y-2" variants={staggerItem}>
                <Label htmlFor="receipt-income" className="text-xs font-medium text-muted-foreground">
                  Receipt / Invoice (Optional)
                </Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="receipt-income"
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <label
                      htmlFor="receipt-income"
                      className={cn(
                        'flex-1 cursor-pointer rounded-lg border-2 border-dashed border-border/60 bg-muted/30 px-4 py-3 text-center text-sm transition-colors hover:border-primary/50 hover:bg-muted/50',
                        selectedFile && 'border-primary/50 bg-primary/5'
                      )}
                    >
                      {selectedFile ? (
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-lg">📎</span>
                          <div className="flex flex-col items-start">
                            <div className="flex items-center gap-2">
                              <span className="text-foreground font-medium">{selectedFile.name}</span>
                              <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400">
                                Ready to upload
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {(selectedFile.size / 1024).toFixed(1)} KB • Uploads when you click Submit
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-muted-foreground">
                            Click to select file (not uploaded until you submit form)
                          </span>
                        </div>
                      )}
                    </label>
                    {selectedFile && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedFile(null)
                          setUploadError(null)
                          if (fileInputRef.current) {
                            fileInputRef.current.value = ''
                          }
                        }}
                        className="h-9 text-xs"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedFile 
                      ? '✓ File ready. Click "Add Income" below to save transaction and upload file.'
                      : 'Supported: Images, PDF, DOC, XLS (max 10MB)'}
                  </p>
                </div>
              </motion.div>

              <motion.div variants={staggerItem}>
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <Button
                    type="submit"
                    className={cn(
                      'h-9 w-full text-sm font-medium transition-all duration-300',
                      isSuccess
                        ? 'bg-success text-success-foreground'
                        : 'bg-success text-success-foreground hover:bg-success/90 hover:shadow-md'
                    )}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {selectedFile ? 'Adding & Uploading...' : 'Adding...'}
                      </>
                    ) : isSuccess ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Added Successfully!
                      </>
                    ) : (
                      'Add Income'
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
