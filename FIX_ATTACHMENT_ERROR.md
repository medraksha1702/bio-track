# Fix: "attachment_name column not found" Error

## Problem
API returns 500 error: "Could not find the 'attachment_name' column of 'transactions' in the schema cache"

## Cause
The database migration to add attachment columns hasn't been run yet.

## Solution - Run the Migration

### Option 1: Via Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Open your project at https://supabase.com/dashboard

2. **Open SQL Editor**
   - Click **"SQL Editor"** in the left sidebar
   - Click **"New query"**

3. **Copy and paste this SQL:**

```sql
-- Add attachment columns to transactions table
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_name TEXT,
ADD COLUMN IF NOT EXISTS attachment_size INTEGER,
ADD COLUMN IF NOT EXISTS attachment_type TEXT;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_has_attachment 
  ON public.transactions ((attachment_url IS NOT NULL))
  WHERE attachment_url IS NOT NULL;

-- Add helpful comments
COMMENT ON COLUMN public.transactions.attachment_url IS 'Supabase Storage path to receipt/invoice file';
COMMENT ON COLUMN public.transactions.attachment_name IS 'Original filename of the uploaded attachment';
COMMENT ON COLUMN public.transactions.attachment_size IS 'File size in bytes';
COMMENT ON COLUMN public.transactions.attachment_type IS 'MIME type of the attachment';
```

4. **Run the query**
   - Click **"Run"** button or press `Ctrl+Enter` / `Cmd+Enter`
   - You should see "Success. No rows returned"

5. **Verify the migration**
   - Go to **"Table Editor"** → **"transactions"**
   - Check that you see the new columns:
     - `attachment_url`
     - `attachment_name`
     - `attachment_size`
     - `attachment_type`

### Option 2: Via Supabase CLI (if installed)

```bash
cd /home/bacancy/Khushbu/Projects/bio_track

# Run the migration
supabase db push

# Or manually execute the migration file
supabase db execute -f supabase/migrations/20260418_add_attachments.sql
```

## After Running Migration

1. **Test the API again**
   - Try creating a transaction via the form
   - The error should be gone

2. **Verify in browser**
   - Create an expense or income
   - Should work without errors
   - You can optionally attach a file

## Quick Verification Query

Run this in SQL Editor to confirm columns exist:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'transactions' 
  AND column_name LIKE 'attachment%'
ORDER BY column_name;
```

**Expected Result:**
```
attachment_name    | text
attachment_size    | integer
attachment_type    | text
attachment_url     | text
```

## Still Having Issues?

### Check Column Existence
```sql
SELECT EXISTS (
  SELECT 1 
  FROM information_schema.columns 
  WHERE table_schema = 'public' 
    AND table_name = 'transactions' 
    AND column_name = 'attachment_name'
);
```

Should return `true`.

### Force Schema Cache Refresh

If columns exist but API still shows error:

1. **Restart your dev server**
   ```bash
   # Stop the server (Ctrl+C)
   # Start again
   npm run dev
   ```

2. **Check Supabase connection**
   - Verify `.env.local` has correct credentials
   - Check `NEXT_PUBLIC_SUPABASE_URL`
   - Check `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Summary

**Quick Fix:**
1. Open Supabase Dashboard → SQL Editor
2. Copy the ALTER TABLE SQL above
3. Run it
4. Verify columns in Table Editor
5. Try creating transaction again

That's it! The error should be resolved. 🎉
