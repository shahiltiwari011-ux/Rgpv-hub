-- Academic Profile Support Migration
-- Run in Supabase Dashboard > SQL Editor

-- 1. Create results_cache table if it doesn't already exist
-- (Backend writes to this after every RGPV scrape; frontend reads from it)
CREATE TABLE IF NOT EXISTS public.results_cache (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment  TEXT NOT NULL,
    result_data JSONB NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add unique constraint on enrollment so upsert works
DO $$ BEGIN
    ALTER TABLE public.results_cache ADD CONSTRAINT results_cache_enrollment_unique UNIQUE (enrollment);
EXCEPTION WHEN duplicate_table THEN null; END $$;

-- 3. Index on enrollment for fast teacher lookups
CREATE INDEX IF NOT EXISTS idx_results_cache_enrollment ON public.results_cache (enrollment);

-- 4. RLS
ALTER TABLE public.results_cache ENABLE ROW LEVEL SECURITY;

-- Allow anyone authenticated to read (teachers, TPO, admin, students)
DROP POLICY IF EXISTS "results_cache_read" ON public.results_cache;
CREATE POLICY "results_cache_read" ON public.results_cache
FOR SELECT USING (auth.role() = 'authenticated');

-- Only the service role (backend) can insert/update the cache
DROP POLICY IF EXISTS "results_cache_write" ON public.results_cache;
CREATE POLICY "results_cache_write" ON public.results_cache
FOR ALL USING (true);  -- Backend uses anon key — adjust if using service key

-- 5. Verify
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'results_cache';
