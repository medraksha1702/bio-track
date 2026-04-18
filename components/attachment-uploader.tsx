'use client'

import { useState, useRef } from 'react'
import { Upload, X, File, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  uploadReceipt,
  deleteReceipt,
  validateFile,
  formatFileSize,
  getFileIcon,
} from '@/lib/storage'
import { cn } from '@/lib/utils'

interface AttachmentUploaderProps {
  transactionId?: string
  existingAttachment?: {
    url: string | null
    name: string | null
    size: number | null
    type: string | null
  } | null
  onAttachmentChange?: (attachment: {
    url: string
    name: string
    size: number
    type: string
  } | null) => void
  disabled?: boolean
  className?: string
}

export function AttachmentUploader({
  transactionId,
  existingAttachment,
  onAttachmentChange,
  disabled = false,
  className,
}: AttachmentUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const hasAttachment = existingAttachment?.url && existingAttachment?.name

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !transactionId) return

    setError(null)

    // Validate file
    const validation = validateFile(file)
    if (!validation.valid) {
      setError(validation.error || 'Invalid file')
      return
    }

    try {
      setUploading(true)

      // Delete old attachment if exists
      if (existingAttachment?.url) {
        const pathMatch = existingAttachment.url.match(/transaction-receipts\/(.+)$/)
        if (pathMatch?.[1]) {
          await deleteReceipt(pathMatch[1])
        }
      }

      // Upload new file
      const result = await uploadReceipt(transactionId, file)

      onAttachmentChange?.({
        url: result.path, // Store the path, not public URL
        name: result.name,
        size: result.size,
        type: result.type,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async () => {
    if (!existingAttachment?.url) return

    const confirmed = window.confirm(
      'Are you sure you want to delete this attachment? This action cannot be undone.'
    )
    if (!confirmed) return

    try {
      setDeleting(true)
      setError(null)

      // Extract path from URL
      const pathMatch = existingAttachment.url.match(/transaction-receipts\/(.+)$/)
      if (pathMatch?.[1]) {
        await deleteReceipt(pathMatch[1])
      }

      onAttachmentChange?.(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete file')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-xs font-medium text-muted-foreground">
        Receipt / Invoice Attachment
      </Label>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {hasAttachment ? (
        <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 p-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-lg">{getFileIcon(existingAttachment.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{existingAttachment.name}</p>
                {existingAttachment.size && (
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(existingAttachment.size)}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={handleDelete}
              disabled={disabled || deleting}
              title="Delete attachment"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
            onChange={handleFileSelect}
            disabled={disabled || uploading || !transactionId}
            className="hidden"
            id="receipt-upload"
          />
          <label htmlFor="receipt-upload">
            <div
              className={cn(
                'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border/60 bg-muted/30 px-6 py-8 text-center transition-colors',
                !disabled && !uploading && transactionId && 'cursor-pointer hover:border-primary/50 hover:bg-muted/50',
                (disabled || uploading || !transactionId) && 'cursor-not-allowed opacity-60'
              )}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Uploading...
                  </p>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {transactionId ? 'Click to upload' : 'Save transaction first'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Images, PDF, or documents (max 10MB)
                    </p>
                  </div>
                </>
              )}
            </div>
          </label>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Supported formats: JPG, PNG, PDF, DOC, DOCX, XLS, XLSX
      </p>
    </div>
  )
}
