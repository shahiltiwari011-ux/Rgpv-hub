-- =============================================
-- Migration 003: Unified Resources & Storage
-- Consolidates separate tables into one 'resources' table.
-- Creates 'study-materials' storage bucket for PDFs.
-- =============================================

-- ══════════════════════════════════════════════
-- 1. UNIFIED RESOURCES TABLE
-- ══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.resources (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  type        TEXT NOT NULL CHECK (type IN ('notes', 'pyq', 'syllabus')),
  subject     TEXT,
  branch      TEXT NOT NULL,
  semester    INTEGER NOT NULL,
  year        TEXT, -- For PYQs
  file_url    TEXT NOT NULL,
  created_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════════════
-- 2. POLICIES FOR RESOURCES
-- ══════════════════════════════════════════════

-- Anyone can read resources
DROP POLICY IF EXISTS "Public read access" ON public.resources;
CREATE POLICY "Public read access" ON public.resources FOR SELECT USING (true);

-- Only admins can insert/update/delete resources
DROP POLICY IF EXISTS "Admin full access" ON public.resources;
CREATE POLICY "Admin full access" ON public.resources 
FOR ALL 
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ══════════════════════════════════════════════
-- 3. STORAGE SETUP (study-materials)
-- ══════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'study-materials', 
  'study-materials', 
  true, 
  10485760, -- 10MB
  ARRAY['application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
DO $$ 
BEGIN 
  -- Public Read
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'storage_sm_public_read' AND tablename = 'objects') THEN 
    CREATE POLICY "storage_sm_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'study-materials'); 
  END IF; 

  -- Admin Upload/Modify/Delete
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'storage_sm_admin_all' AND tablename = 'objects') THEN 
    CREATE POLICY "storage_sm_admin_all" ON storage.objects FOR ALL USING (bucket_id = 'study-materials' AND public.is_admin()); 
  END IF; 
END $$;

-- ══════════════════════════════════════════════
-- 4. DATA MIGRATION (UTILITY)
-- ══════════════════════════════════════════════

-- Migrate from notes
INSERT INTO public.resources (title, subject, branch, semester, file_url, type, created_at)
SELECT title, subject, branch, semester::integer, file_url, 'notes', created_at
FROM public.notes;

-- Migrate from pyq
INSERT INTO public.resources (title, subject, branch, semester, year, file_url, type, created_at)
SELECT title, subject, branch, semester::integer, year, file_url, 'pyq', created_at
FROM public.pyq;

-- Migrate from syllabus
INSERT INTO public.resources (title, branch, semester, file_url, type, created_at)
SELECT title, branch, semester::integer, file_url, 'syllabus', created_at
FROM public.syllabus;

-- Note: In a real production scenario, you might want to DROP the old tables 
-- after verifying the migration, but for now we leave them for safety.
-- DROP TABLE public.notes;
-- DROP TABLE public.pyq;
-- DROP TABLE public.syllabus;
