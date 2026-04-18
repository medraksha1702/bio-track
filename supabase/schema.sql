-- ============================================================
-- MediLedger — Supabase Schema
-- Run this in the Supabase SQL Editor to set up your database
-- ============================================================

-- Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  date        DATE        NOT NULL,
  type        TEXT        NOT NULL CHECK (type IN ('income', 'expense')),
  category    TEXT        NOT NULL,
  amount      NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  client      TEXT        NOT NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast filtering by type and sorting by date
CREATE INDEX IF NOT EXISTS idx_transactions_type    ON public.transactions (type);
CREATE INDEX IF NOT EXISTS idx_transactions_date    ON public.transactions (date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON public.transactions (created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anonymous (anon) key — change this for production
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'transactions'
      AND policyname = 'Allow anon full access'
  ) THEN
    CREATE POLICY "Allow anon full access"
      ON public.transactions
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
