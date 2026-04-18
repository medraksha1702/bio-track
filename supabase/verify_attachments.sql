-- Quick Verification Script for Attachment Columns
-- Run this in Supabase SQL Editor to check migration status

-- 1. Check if attachment columns exist
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'transactions' 
  AND column_name LIKE 'attachment%'
ORDER BY column_name;

-- Expected: 4 rows (attachment_url, attachment_name, attachment_size, attachment_type)

-- 2. Check if index exists
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename = 'transactions'
  AND indexname LIKE '%attachment%';

-- Expected: idx_transactions_has_attachment

-- 3. View all columns in transactions table
SELECT 
  column_name,
  data_type,
  character_maximum_length,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'transactions'
ORDER BY ordinal_position;

-- Expected: id, date, type, category, amount, client, notes, created_at, 
--           attachment_url, attachment_name, attachment_size, attachment_type
