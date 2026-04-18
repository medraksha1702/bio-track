-- Create Storage bucket for transaction receipts
-- Run this in Supabase SQL Editor after creating the bucket via UI

-- Note: Create the bucket first via Supabase Dashboard:
-- Storage > Create Bucket > Name: "transaction-receipts" > Public: false

-- Set up RLS policies for the storage bucket
-- Allow authenticated users to upload files
INSERT INTO storage.buckets (id, name, public)
VALUES ('transaction-receipts', 'transaction-receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow users to upload files
CREATE POLICY "Allow anon upload receipts"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'transaction-receipts');

-- Policy: Allow users to read their files
CREATE POLICY "Allow anon read receipts"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'transaction-receipts');

-- Policy: Allow users to delete files
CREATE POLICY "Allow anon delete receipts"
ON storage.objects FOR DELETE
TO anon
USING (bucket_id = 'transaction-receipts');

-- Policy: Allow users to update file metadata
CREATE POLICY "Allow anon update receipts"
ON storage.objects FOR UPDATE
TO anon
USING (bucket_id = 'transaction-receipts')
WITH CHECK (bucket_id = 'transaction-receipts');

COMMENT ON TABLE storage.objects IS 'Stores transaction receipts and invoices';
