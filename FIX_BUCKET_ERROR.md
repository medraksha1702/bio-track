# Quick Fix: "Bucket not found" Error ✅ SOLVED

## ✅ Storage Bucket Created!
The `transaction-receipts` bucket has been successfully created.

## ⚠️ Still Need: RLS Policies

You're getting "Bucket not found" because the RLS policies aren't set up yet. Here's how to fix it:

### 🚀 Quick Fix (1 minute)

**Click this link to open SQL Editor:**
👉 **https://supabase.com/dashboard/project/mepniegwjfkpeiiqfmgu/sql/new**

**Paste this SQL and click "Run":**

```sql
-- Allow anon users to upload files
CREATE POLICY IF NOT EXISTS "Allow anon upload receipts"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'transaction-receipts');

-- Allow anon users to read files
CREATE POLICY IF NOT EXISTS "Allow anon read receipts"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'transaction-receipts');

-- Allow anon users to delete files
CREATE POLICY IF NOT EXISTS "Allow anon delete receipts"
ON storage.objects FOR DELETE
TO anon
USING (bucket_id = 'transaction-receipts');

-- Allow anon users to update files
CREATE POLICY IF NOT EXISTS "Allow anon update receipts"
ON storage.objects FOR UPDATE
TO anon
USING (bucket_id = 'transaction-receipts')
WITH CHECK (bucket_id = 'transaction-receipts');
```

**That's it!** After running this, go back to your app and try uploading an attachment again.

---

## 📋 What We've Done

✅ **Step 1**: Created storage bucket `transaction-receipts`
   - Private bucket (not publicly accessible)
   - 10MB file size limit
   - Supports images, PDF, DOC, XLS

⚠️ **Step 2**: Need RLS policies (run SQL above)
   - Controls who can upload/view/delete files
   - Currently set for anonymous users (update for production)

---

## 🧪 Test After Setup

1. Go to your app (localhost:3000)
2. Create an expense or income
3. Click "Click to attach receipt/invoice"
4. Select a file
5. Click "Add Expense" or "Add Income"
6. Should work! ✅

---

## 🔍 Verify Bucket Exists

You can check in Supabase Dashboard:
- Go to **Storage** → You should see `transaction-receipts`
- It should show as **Private**

---

## ❓ Still Having Issues?

If you still get "Bucket not found" after running the policies:

1. **Verify bucket exists:**
   - Go to Supabase Dashboard → Storage
   - Look for `transaction-receipts`

2. **Check RLS is enabled:**
   ```sql
   SELECT * FROM storage.buckets WHERE name = 'transaction-receipts';
   ```

3. **List policies:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
   ```

Need help? Let me know! 🚀
