-- ============================================================
-- Billing Module — Invoices & Invoice Items
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id              UUID           DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number  TEXT           NOT NULL UNIQUE,
  client_name     TEXT           NOT NULL,
  status          TEXT           NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
  issue_date      DATE           NOT NULL,
  due_date        DATE           NOT NULL,
  subtotal        NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tax_rate        NUMERIC(5, 2)  NOT NULL DEFAULT 0,
  tax_amount      NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total           NUMERIC(12, 2) NOT NULL DEFAULT 0,
  notes           TEXT,
  transaction_id  UUID           REFERENCES public.transactions(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ    DEFAULT NOW()
);

-- Invoice line items
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id           UUID           DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id   UUID           NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description  TEXT           NOT NULL,
  quantity     NUMERIC(10, 2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price   NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
  amount       NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  created_at   TIMESTAMPTZ    DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_status     ON public.invoices (status);
CREATE INDEX IF NOT EXISTS idx_invoices_client     ON public.invoices (client_name);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON public.invoices (issue_date DESC);
CREATE INDEX IF NOT EXISTS idx_invoice_items_inv   ON public.invoice_items (invoice_id);

-- RLS
ALTER TABLE public.invoices      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'invoices' AND policyname = 'Allow anon full access'
  ) THEN
    CREATE POLICY "Allow anon full access" ON public.invoices FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'invoice_items' AND policyname = 'Allow anon full access'
  ) THEN
    CREATE POLICY "Allow anon full access" ON public.invoice_items FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
