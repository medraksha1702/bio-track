import { supabase } from '@/lib/supabase'

const BUCKET_NAME = 'transaction-receipts'
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

export interface UploadResult {
  path: string
  url: string
  name: string
  size: number
  type: string
}

export interface UploadError {
  message: string
  code?: string
}

/**
 * Validates file before upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    }
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'File type not supported. Please upload images, PDFs, or documents.',
    }
  }

  return { valid: true }
}

/**
 * Generates a unique file path for storage
 */
function generateFilePath(transactionId: string, fileName: string): string {
  const timestamp = Date.now()
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  return `${transactionId}/${timestamp}_${sanitizedName}`
}

/**
 * Uploads a file to Supabase Storage
 */
export async function uploadReceipt(
  transactionId: string,
  file: File
): Promise<UploadResult> {
  // Validate file
  const validation = validateFile(file)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  // Generate unique path
  const filePath = generateFilePath(transactionId, file.name)

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    console.error('Upload error:', error)
    throw new Error(`Failed to upload file: ${error.message}`)
  }

  // Get public URL (note: bucket is private, so this requires signed URL for access)
  const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path)

  return {
    path: data.path,
    url: urlData.publicUrl,
    name: file.name,
    size: file.size,
    type: file.type,
  }
}

/**
 * Deletes a file from Supabase Storage
 */
export async function deleteReceipt(filePath: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath])

  if (error) {
    console.error('Delete error:', error)
    throw new Error(`Failed to delete file: ${error.message}`)
  }
}

/**
 * Gets a signed URL for private file access (valid for 1 hour)
 */
export async function getSignedUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, 3600) // 1 hour

  if (error) {
    console.error('Signed URL error:', error)
    throw new Error(`Failed to generate signed URL: ${error.message}`)
  }

  return data.signedUrl
}

/**
 * Downloads a file from storage
 */
export async function downloadReceipt(filePath: string, fileName: string): Promise<void> {
  const { data, error } = await supabase.storage.from(BUCKET_NAME).download(filePath)

  if (error) {
    console.error('Download error:', error)
    throw new Error(`Failed to download file: ${error.message}`)
  }

  // Create download link
  const url = URL.createObjectURL(data)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Formats file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Gets file icon based on MIME type
 */
export function getFileIcon(mimeType: string | null | undefined): string {
  if (!mimeType) return '📄'

  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType === 'application/pdf') return '📕'
  if (mimeType.includes('word')) return '📘'
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📗'

  return '📄'
}
