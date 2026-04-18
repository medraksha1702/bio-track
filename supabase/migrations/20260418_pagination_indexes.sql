-- Migration: Add composite index for cursor-based pagination
-- This improves performance when paginating with date filters and cursor

-- Composite index for pagination queries that filter by date range and cursor
CREATE INDEX IF NOT EXISTS idx_transactions_date_created 
  ON public.transactions (date DESC, created_at DESC);

-- Index for cursor-only pagination (when no date filter is applied)
-- Already exists: idx_transactions_created ON public.transactions (created_at DESC)

COMMENT ON INDEX idx_transactions_date_created IS 
  'Composite index for efficient cursor-based pagination with date range filters';
