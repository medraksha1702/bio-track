-- Storage RLS Policies for transaction-receipts bucket
-- Drop existing policies first (if they exist), then recreate

-- Clean up any existing policies
DROP POLICY IF EXISTS "Allow anon upload receipts" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon read receipts" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon delete receipts" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon update receipts" ON storage.objects;

-- Create new policies
CREATE POLICY "Allow anon upload receipts"
ON storage.objects FOR INSERT 
TO anon
WITH CHECK (bucket_id = 'transaction-receipts');

CREATE POLICY "Allow anon read receipts"
ON storage.objects FOR SELECT 
TO anon
USING (bucket_id = 'transaction-receipts');

CREATE POLICY "Allow anon delete receipts"
ON storage.objects FOR DELETE 
TO anon
USING (bucket_id = 'transaction-receipts');

CREATE POLICY "Allow anon update receipts"
ON storage.objects FOR UPDATE 
TO anon
USING (bucket_id = 'transaction-receipts')
WITH CHECK (bucket_id = 'transaction-receipts');
