# Quick Setup Guide - Transaction Attachments

## 🚀 5-Minute Setup

### Step 1: Run Database Migration
In **Supabase SQL Editor**:

```sql
-- Add attachment columns
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_name TEXT,
ADD COLUMN IF NOT EXISTS attachment_size INTEGER,
ADD COLUMN IF NOT EXISTS attachment_type TEXT;

CREATE INDEX IF NOT EXISTS idx_transactions_has_attachment 
  ON public.transactions ((attachment_url IS NOT NULL))
  WHERE attachment_url IS NOT NULL;
```

### Step 2: Create Storage Bucket

**Option A: Via Dashboard** (Recommended)
1. Go to Supabase Dashboard → **Storage**
2. Click **"New bucket"**
3. Bucket name: `transaction-receipts`
4. **Uncheck** "Public bucket"
5. Click **"Create bucket"**

**Option B: Via SQL**
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('transaction-receipts', 'transaction-receipts', false)
ON CONFLICT (id) DO NOTHING;
```

### Step 3: Set Storage Policies

In **Supabase SQL Editor**:

```sql
-- Allow uploads
CREATE POLICY "Allow anon upload receipts"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'transaction-receipts');

-- Allow reads
CREATE POLICY "Allow anon read receipts"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'transaction-receipts');

-- Allow deletes
CREATE POLICY "Allow anon delete receipts"
ON storage.objects FOR DELETE
TO anon
USING (bucket_id = 'transaction-receipts');

-- Allow updates
CREATE POLICY "Allow anon update receipts"
ON storage.objects FOR UPDATE
TO anon
USING (bucket_id = 'transaction-receipts')
WITH CHECK (bucket_id = 'transaction-receipts');
```

### Step 4: Test It!

1. **Start dev server**: `npm run dev`
2. **Create a transaction** (income or expense)
3. **Edit the transaction**
4. **Upload a test file** (PDF or image)
5. **Verify**:
   - File appears in attachment uploader
   - Paperclip icon (📎) shows in transactions table
   - Can view, download, and delete file

## ✅ Verification Checklist

- [ ] Database columns added (check `transactions` table schema)
- [ ] Storage bucket `transaction-receipts` exists
- [ ] Bucket is **private** (not public)
- [ ] 4 RLS policies enabled on `storage.objects`
- [ ] Test upload works
- [ ] Test view/download works
- [ ] Paperclip icon appears in table

## 🔧 Troubleshooting

### "Failed to upload file"
→ Check RLS policy for INSERT exists  
→ Verify bucket name is exactly `transaction-receipts`

### "Cannot view file"
→ Check RLS policy for SELECT exists  
→ Verify signed URL generation works

### Upload button disabled
→ Transaction must be saved first (needs ID)  
→ Check console for errors

## 📱 Where to See Attachments

1. **Transactions Table**: Look for 📎 icon next to customer name
2. **Edit Transaction Dialog**: Scroll to bottom → "Receipt / Invoice Attachment"
3. **Supabase Dashboard**: Storage → `transaction-receipts` bucket

## 🎯 Quick Test Commands

```bash
# Check if migrations ran
psql $DATABASE_URL -c "\d transactions"
# Should see: attachment_url, attachment_name, attachment_size, attachment_type

# Check if bucket exists
# Go to: Supabase Dashboard → Storage
# Should see: transaction-receipts (private)
```

## 📝 Notes

- **Max file size**: 10MB
- **Supported formats**: Images (JPG, PNG, etc.), PDF, DOC, XLS
- **Storage location**: Files stored as `{transactionId}/{timestamp}_{filename}`
- **Access**: Files are private, viewed via 1-hour signed URLs

## 🚨 Production Checklist

Before going live:
- [ ] Update RLS policies for authenticated users (not anon)
- [ ] Add server-side file validation
- [ ] Set up file cleanup on transaction delete
- [ ] Configure monitoring/alerts
- [ ] Test with real receipts
- [ ] Check storage quota

## 💡 Tips

- **Organize receipts**: Use consistent naming (e.g., "invoice_2024_04_18.pdf")
- **Backup**: Supabase handles storage backups, but export critical data
- **Monitor usage**: Check Storage dashboard for usage stats
- **Performance**: 10MB limit keeps uploads fast

## 🆘 Need Help?

Check full documentation: `docs/ATTACHMENTS.md`

Common issues and solutions included!

---

**Setup time**: ~5 minutes  
**Difficulty**: Easy  
**Dependencies**: Supabase project with Storage enabled

🎉 **You're ready to use attachments!**
