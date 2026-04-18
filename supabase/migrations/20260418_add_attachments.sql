-- Migration: Add attachments support for transactions
-- Adds attachment_url and attachment_name columns to store receipt/invoice files

-- Add columns for file attachments
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_name TEXT,
ADD COLUMN IF NOT EXISTS attachment_size INTEGER,
ADD COLUMN IF NOT EXISTS attachment_type TEXT;

-- Add index for transactions with attachments (for filtering/reports)
CREATE INDEX IF NOT EXISTS idx_transactions_has_attachment 
  ON public.transactions ((attachment_url IS NOT NULL))
  WHERE attachment_url IS NOT NULL;

COMMENT ON COLUMN public.transactions.attachment_url IS 'Supabase Storage path to receipt/invoice file';
COMMENT ON COLUMN public.transactions.attachment_name IS 'Original filename of the uploaded attachment';
COMMENT ON COLUMN public.transactions.attachment_size IS 'File size in bytes';
COMMENT ON COLUMN public.transactions.attachment_type IS 'MIME type of the attachment';
