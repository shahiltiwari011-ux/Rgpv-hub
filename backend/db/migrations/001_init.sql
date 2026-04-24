-- =============================================
-- Migration 001: Initial Schema & Roles
-- Creates all base tables, views, and helpers.
-- =============================================

-- ══════════════════════════════════════════════
-- 1. BASE TABLES
-- ══════════════════════════════════════════════

-- Profiles (Admin/Role definitions)
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email      TEXT,
  role       TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Notes
CREATE TABLE IF NOT EXISTS public.notes (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title      TEXT NOT NULL,
  subject    TEXT,
  branch     TEXT NOT NULL,
  semester   TEXT NOT NULL,
  icon       TEXT DEFAULT '📄',
  file_url   TEXT DEFAULT '#',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- PYQ
CREATE TABLE IF NOT EXISTS public.pyq (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title      TEXT NOT NULL,
  subject    TEXT,
  year       TEXT NOT NULL,
  branch     TEXT NOT NULL,
  semester   TEXT NOT NULL,
  icon       TEXT DEFAULT '📄',
  file_url   TEXT DEFAULT '#',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Syllabus
CREATE TABLE IF NOT EXISTS public.syllabus (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title      TEXT,
  branch     TEXT NOT NULL,
  semester   TEXT NOT NULL,
  icon       TEXT DEFAULT '📋',
  topics     TEXT[] DEFAULT '{}',
  file_url   TEXT DEFAULT '#',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Downloads
CREATE TABLE IF NOT EXISTS public.downloads (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  file_id    UUID NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('notes', 'pyq', 'syllabus')),
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- System Logs
CREATE TABLE IF NOT EXISTS public.system_logs (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  level      TEXT NOT NULL CHECK (level IN ('INFO', 'WARN', 'ERROR', 'FATAL')),
  message    TEXT NOT NULL,
  metadata   JSONB DEFAULT '{}'::jsonb,
  user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Bookmarks
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  resource_id   UUID NOT NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('notes', 'pyq', 'syllabus')),
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, resource_id, resource_type)
);

-- App Config (Fixed: Table was missing from original script)
CREATE TABLE IF NOT EXISTS public.app_config (
  key   TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

-- Incidents (Fixed: Table was missing from original script)
CREATE TABLE IF NOT EXISTS public.incidents (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  status      TEXT DEFAULT 'investigating',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════
-- 2. HELPER FUNCTIONS
-- ══════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ══════════════════════════════════════════════
-- 3. STORAGE & INDEXES
-- ══════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public) 
VALUES ('uploads', 'uploads', true) ON CONFLICT (id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_downloads_user_ip ON public.downloads(user_id, ip_address, created_at);
CREATE INDEX IF NOT EXISTS idx_logs_level_time ON public.system_logs(level, created_at);

CREATE OR REPLACE VIEW public.site_stats WITH (security_invoker = true) AS
SELECT
  (SELECT COUNT(*) FROM public.notes)     AS total_notes,
  (SELECT COUNT(*) FROM public.pyq)       AS total_pyq,
  (SELECT COUNT(*) FROM public.syllabus)  AS total_syllabus,
  (SELECT COUNT(*) FROM public.downloads) AS total_downloads,
  (SELECT COUNT(*) FROM public.profiles)  AS total_users;
