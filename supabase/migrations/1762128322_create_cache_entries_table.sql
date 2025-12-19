-- Migration: create_cache_entries_table
-- Created at: 1762128322

-- Create cache_entries table for database-backed caching
CREATE TABLE IF NOT EXISTS public.cache_entries (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on expires_at for efficient TTL queries
CREATE INDEX IF NOT EXISTS idx_cache_entries_expires ON public.cache_entries(expires_at);

-- Auto cleanup expired entries (runs periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM public.cache_entries WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE public.cache_entries ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage cache
CREATE POLICY "Service role can manage cache"
  ON public.cache_entries
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);;