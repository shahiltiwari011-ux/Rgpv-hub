-- =============================================
-- RGPV Study Hub — PRODUCTION SQL SCHEMA v5.0
-- Run in Supabase SQL Editor (full idempotent deploy)
-- =============================================

-- ══════════════════════════════════════════════
-- STEP 1: CREATE TABLES
-- ══════════════════════════════════════════════

-- 1A. Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email       TEXT,
  name        TEXT,
  role        TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  xp          INTEGER DEFAULT 0,
  level       INTEGER DEFAULT 1,
  streak_days INTEGER DEFAULT 0,
  last_active DATE DEFAULT CURRENT_DATE,
  badges      TEXT[] DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Safe column additions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='name') THEN
    ALTER TABLE public.profiles ADD COLUMN name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='email') THEN
    ALTER TABLE public.profiles ADD COLUMN email TEXT;
  END IF;
END $$;

-- 1B. Admin check function (must come AFTER profiles table)
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

-- 1C. Unified Resources Table
CREATE TABLE IF NOT EXISTS public.resources (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title          TEXT NOT NULL,
  description    TEXT DEFAULT '',
  subject        TEXT,
  branch         TEXT NOT NULL,
  semester       INTEGER NOT NULL CHECK (semester BETWEEN 1 AND 6),
  type           TEXT NOT NULL CHECK (type IN ('notes', 'pyq', 'syllabus')),
  icon           TEXT DEFAULT '📄',
  file_url       TEXT DEFAULT '#',
  year           TEXT,
  topics         TEXT[] DEFAULT '{}',
  download_count INTEGER DEFAULT 0,
  helpful_score  INTEGER DEFAULT 0,
  created_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- Safe column additions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resources' AND column_name='download_count') THEN
    ALTER TABLE public.resources ADD COLUMN download_count INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resources' AND column_name='helpful_score') THEN
    ALTER TABLE public.resources ADD COLUMN helpful_score INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resources' AND column_name='icon') THEN
    ALTER TABLE public.resources ADD COLUMN icon TEXT DEFAULT '📄';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resources' AND column_name='year') THEN
    ALTER TABLE public.resources ADD COLUMN year TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resources' AND column_name='topics') THEN
    ALTER TABLE public.resources ADD COLUMN topics TEXT[] DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resources' AND column_name='created_by') THEN
    ALTER TABLE public.resources ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 2C. Downloads
CREATE TABLE IF NOT EXISTS public.downloads (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  file_id    UUID NOT NULL,
  type       TEXT NOT NULL DEFAULT 'resource',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='downloads' AND column_name='ip_address') THEN
    ALTER TABLE public.downloads ADD COLUMN ip_address TEXT;
  END IF;
END $$;

-- 2D. System Logs
CREATE TABLE IF NOT EXISTS public.system_logs (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  level      TEXT NOT NULL CHECK (level IN ('INFO', 'WARN', 'ERROR', 'FATAL')),
  message    TEXT NOT NULL,
  metadata   JSONB DEFAULT '{}'::jsonb,
  user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2E. Bookmarks
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  resource_id   UUID REFERENCES public.resources(id) ON DELETE CASCADE NOT NULL,
  resource_type TEXT NOT NULL DEFAULT 'notes',
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, resource_id)
);

-- 2F. Resource Views
CREATE TABLE IF NOT EXISTS public.resource_views (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  resource_id UUID REFERENCES public.resources(id) ON DELETE CASCADE NOT NULL,
  viewed_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, resource_id)
);

-- 2G. Helpful Votes
CREATE TABLE IF NOT EXISTS public.helpful_votes (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  resource_id UUID REFERENCES public.resources(id) ON DELETE CASCADE NOT NULL,
  vote        INTEGER NOT NULL CHECK (vote IN (1, -1)),
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, resource_id)
);

-- 2H. Comments
CREATE TABLE IF NOT EXISTS public.comments (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  resource_id UUID REFERENCES public.resources(id) ON DELETE CASCADE NOT NULL,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 2I. Bookmark Collections
CREATE TABLE IF NOT EXISTS public.bookmark_collections (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookmarks' AND column_name = 'collection_id') THEN
    ALTER TABLE public.bookmarks ADD COLUMN collection_id UUID REFERENCES public.bookmark_collections(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 2J. Site Stats (cached counters)
DROP VIEW IF EXISTS public.site_stats;
DROP TABLE IF EXISTS public.site_stats;
CREATE TABLE public.site_stats (
  id             INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  total_notes    INTEGER DEFAULT 0,
  total_pyq      INTEGER DEFAULT 0,
  total_syllabus INTEGER DEFAULT 0,
  updated_at     TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.site_stats (id, total_notes, total_pyq, total_syllabus, updated_at)
VALUES (
  1,
  (SELECT COUNT(*) FROM public.resources WHERE type = 'notes'),
  (SELECT COUNT(*) FROM public.resources WHERE type = 'pyq'),
  (SELECT COUNT(*) FROM public.resources WHERE type = 'syllabus'),
  now()
)
ON CONFLICT (id) DO UPDATE SET
  total_notes    = (SELECT COUNT(*) FROM public.resources WHERE type = 'notes'),
  total_pyq      = (SELECT COUNT(*) FROM public.resources WHERE type = 'pyq'),
  total_syllabus = (SELECT COUNT(*) FROM public.resources WHERE type = 'syllabus'),
  updated_at     = now();

-- 2K. Leaderboard
CREATE TABLE IF NOT EXISTS public.leaderboard_weekly (
  user_id        UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email          TEXT,
  xp             INTEGER DEFAULT 0,
  level          INTEGER DEFAULT 1,
  streak_days    INTEGER DEFAULT 0,
  rank           INTEGER,
  last_refreshed TIMESTAMPTZ DEFAULT now()
);

-- 2L. User Badges
CREATE TABLE IF NOT EXISTS public.user_badges (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_name  TEXT NOT NULL,
  description TEXT,
  awarded_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, badge_name)
);

-- ══════════════════════════════════════════════
-- STEP 3: ENABLE RLS
-- ══════════════════════════════════════════════

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helpful_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmark_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_weekly ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════════════
-- STEP 4: RLS POLICIES
-- ══════════════════════════════════════════════

-- 4A. Profiles
-- Public read (for leaderboard, profile pages)
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
CREATE POLICY "profiles_select_public" ON public.profiles
  FOR SELECT USING (true);

-- Users can insert their own profile (required for signup trigger fallback)
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile, admins can update any
DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_update_own_or_admin" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR is_admin());

-- 4B. Resources: public read, admin-only write
DROP POLICY IF EXISTS "resources_read" ON public.resources;
CREATE POLICY "resources_read" ON public.resources
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "resources_admin_insert" ON public.resources;
CREATE POLICY "resources_admin_insert" ON public.resources
  FOR INSERT WITH CHECK (is_admin());

DROP POLICY IF EXISTS "resources_admin_update" ON public.resources;
CREATE POLICY "resources_admin_update" ON public.resources
  FOR UPDATE USING (is_admin());

DROP POLICY IF EXISTS "resources_admin_delete" ON public.resources;
CREATE POLICY "resources_admin_delete" ON public.resources
  FOR DELETE USING (is_admin());

-- 4C. Downloads
DROP POLICY IF EXISTS "downloads_insert" ON public.downloads;
CREATE POLICY "downloads_insert" ON public.downloads
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "downloads_select" ON public.downloads;
CREATE POLICY "downloads_select" ON public.downloads
  FOR SELECT USING (is_admin() OR auth.uid() = user_id);

-- 4D. Bookmarks
DROP POLICY IF EXISTS "bookmarks_select_own" ON public.bookmarks;
CREATE POLICY "bookmarks_select_own" ON public.bookmarks
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "bookmarks_insert_own" ON public.bookmarks;
CREATE POLICY "bookmarks_insert_own" ON public.bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "bookmarks_delete_own" ON public.bookmarks;
CREATE POLICY "bookmarks_delete_own" ON public.bookmarks
  FOR DELETE USING (auth.uid() = user_id);

-- 4E. System Logs
DROP POLICY IF EXISTS "logs_insert" ON public.system_logs;
CREATE POLICY "logs_insert" ON public.system_logs
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "logs_select_admin" ON public.system_logs;
CREATE POLICY "logs_select_admin" ON public.system_logs
  FOR SELECT USING (is_admin());

-- 4F. Site Stats
DROP POLICY IF EXISTS "site_stats_read" ON public.site_stats;
CREATE POLICY "site_stats_read" ON public.site_stats FOR SELECT USING (true);

DROP POLICY IF EXISTS "site_stats_admin_update" ON public.site_stats;
CREATE POLICY "site_stats_admin_update" ON public.site_stats FOR UPDATE USING (is_admin());

-- 4G. Resource Views
DROP POLICY IF EXISTS "views_select_own" ON public.resource_views;
CREATE POLICY "views_select_own" ON public.resource_views FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "views_upsert_own" ON public.resource_views;
CREATE POLICY "views_upsert_own" ON public.resource_views FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "views_update_own" ON public.resource_views;
CREATE POLICY "views_update_own" ON public.resource_views FOR UPDATE USING (auth.uid() = user_id);

-- 4H. Helpful Votes
DROP POLICY IF EXISTS "votes_select" ON public.helpful_votes;
CREATE POLICY "votes_select" ON public.helpful_votes FOR SELECT USING (true);
DROP POLICY IF EXISTS "votes_insert_own" ON public.helpful_votes;
CREATE POLICY "votes_insert_own" ON public.helpful_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "votes_update_own" ON public.helpful_votes;
CREATE POLICY "votes_update_own" ON public.helpful_votes FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "votes_delete_own" ON public.helpful_votes;
CREATE POLICY "votes_delete_own" ON public.helpful_votes FOR DELETE USING (auth.uid() = user_id);

-- 4I. Comments
DROP POLICY IF EXISTS "comments_select" ON public.comments;
CREATE POLICY "comments_select" ON public.comments FOR SELECT USING (true);
DROP POLICY IF EXISTS "comments_insert_own" ON public.comments;
CREATE POLICY "comments_insert_own" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "comments_delete_own" ON public.comments;
CREATE POLICY "comments_delete_own" ON public.comments FOR DELETE USING (auth.uid() = user_id OR is_admin());

-- 4J. Collections
DROP POLICY IF EXISTS "collections_select_own" ON public.bookmark_collections;
CREATE POLICY "collections_select_own" ON public.bookmark_collections FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "collections_insert_own" ON public.bookmark_collections;
CREATE POLICY "collections_insert_own" ON public.bookmark_collections FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "collections_update_own" ON public.bookmark_collections;
CREATE POLICY "collections_update_own" ON public.bookmark_collections FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "collections_delete_own" ON public.bookmark_collections;
CREATE POLICY "collections_delete_own" ON public.bookmark_collections FOR DELETE USING (auth.uid() = user_id);

-- 4K. Leaderboard / Badges (public read)
DROP POLICY IF EXISTS "leaderboard_read" ON public.leaderboard_weekly;
CREATE POLICY "leaderboard_read" ON public.leaderboard_weekly FOR SELECT USING (true);

DROP POLICY IF EXISTS "badges_read" ON public.user_badges;
CREATE POLICY "badges_read" ON public.user_badges FOR SELECT USING (true);

-- ══════════════════════════════════════════════
-- STEP 5: TRIGGERS & FUNCTIONS
-- ══════════════════════════════════════════════

-- 5A. Auto-create profile on new auth user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, xp, level, streak_days, last_active, badges)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'user',
    0, 1, 1,
    (now() AT TIME ZONE 'Asia/Kolkata')::date,
    ARRAY['🆕 Newcomer']
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5B. Award XP function
CREATE OR REPLACE FUNCTION public.award_xp(xp_amount INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  today      DATE := (now() AT TIME ZONE 'Asia/Kolkata')::date;
  new_xp     INTEGER;
  last_date  DATE;
  new_streak INTEGER;
  new_level  INTEGER;
BEGIN
  SELECT xp, last_active, streak_days INTO new_xp, last_date, new_streak
  FROM public.profiles WHERE id = auth.uid();

  new_xp    := COALESCE(new_xp, 0) + xp_amount;
  new_level := GREATEST(1, (new_xp / 100) + 1);

  IF last_date IS NULL OR COALESCE(new_streak, 0) = 0 THEN
    new_streak := 1;
  ELSIF last_date = today - 1 THEN
    new_streak := COALESCE(new_streak, 0) + 1;
  ELSIF last_date < today - 1 THEN
    new_streak := 1;
  END IF;

  UPDATE public.profiles SET
    xp          = new_xp,
    level       = new_level,
    streak_days = new_streak,
    last_active = today
  WHERE id = auth.uid();

  -- Always refresh leaderboard to ensure true real-time data
  PERFORM public.refresh_leaderboard();
END;
$$;

-- 5C. Auto-refresh site_stats
CREATE OR REPLACE FUNCTION public.refresh_site_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.site_stats SET
    total_notes    = (SELECT COUNT(*) FROM public.resources WHERE type = 'notes'),
    total_pyq      = (SELECT COUNT(*) FROM public.resources WHERE type = 'pyq'),
    total_syllabus = (SELECT COUNT(*) FROM public.resources WHERE type = 'syllabus'),
    updated_at     = now()
  WHERE id = 1;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS refresh_stats_trigger ON public.resources;
CREATE TRIGGER refresh_stats_trigger
  AFTER INSERT OR DELETE ON public.resources
  FOR EACH STATEMENT EXECUTE PROCEDURE public.refresh_site_stats();

-- 5D. Leaderboard refresh
CREATE OR REPLACE FUNCTION public.refresh_leaderboard()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  TRUNCATE public.leaderboard_weekly;

  INSERT INTO public.leaderboard_weekly (user_id, email, xp, level, streak_days, rank, last_refreshed)
  SELECT
    id,
    email,
    xp,
    level,
    streak_days,
    ROW_NUMBER() OVER (ORDER BY xp DESC, streak_days DESC, created_at ASC),
    now()
  FROM public.profiles
  ORDER BY xp DESC
  LIMIT 100;
END;
$$;

-- 5E. Download rate limit trigger
CREATE OR REPLACE FUNCTION public.check_download_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  client_ip          TEXT;
  recent_user_count  INT := 0;
  recent_ip_count    INT := 0;
BEGIN
  client_ip  := COALESCE(current_setting('request.headers', true)::json->>'x-forwarded-for', '');
  NEW.ip_address := NULLIF(client_ip, '');

  IF NEW.user_id IS NOT NULL THEN
    SELECT COUNT(*) INTO recent_user_count FROM public.downloads
      WHERE user_id = NEW.user_id AND created_at > (now() - interval '1 hour');
    IF recent_user_count >= 50 THEN
      RAISE EXCEPTION 'Rate limit: max 50 downloads/hour per account.';
    END IF;
  END IF;

  IF client_ip IS NOT NULL AND client_ip != '' THEN
    SELECT COUNT(*) INTO recent_ip_count FROM public.downloads
      WHERE ip_address = client_ip AND created_at > (now() - interval '1 hour');
    IF recent_ip_count >= 100 THEN
      RAISE EXCEPTION 'Rate limit: max 100 downloads/hour per network.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_download_limit_trigger ON public.downloads;
CREATE TRIGGER enforce_download_limit_trigger
  BEFORE INSERT ON public.downloads
  FOR EACH ROW EXECUTE PROCEDURE public.check_download_rate_limit();

-- 5F. Upload rate limit trigger
CREATE OR REPLACE FUNCTION public.check_upload_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  recent_user_count INT := 0;
BEGIN
  IF NEW.created_by IS NOT NULL THEN
    SELECT COUNT(*) INTO recent_user_count FROM public.resources
      WHERE created_by = NEW.created_by AND created_at > (now() - interval '1 minute');
    IF recent_user_count >= 5 THEN
      RAISE EXCEPTION 'Rate limit exceeded: Maximum 5 uploads per minute allowed.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_upload_limit_trigger ON public.resources;
CREATE TRIGGER enforce_upload_limit_trigger
  BEFORE INSERT ON public.resources
  FOR EACH ROW EXECUTE PROCEDURE public.check_upload_rate_limit();

-- ══════════════════════════════════════════════
-- STEP 6: STORAGE BUCKET
-- ══════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('study-materials', 'study-materials', true, 10485760, ARRAY['application/pdf']::text[])
ON CONFLICT (id) DO UPDATE SET
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies (safe idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'storage_public_read' AND tablename = 'objects') THEN
    CREATE POLICY "storage_public_read" ON storage.objects
      FOR SELECT USING (bucket_id = 'study-materials');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'storage_admin_insert' AND tablename = 'objects') THEN
    CREATE POLICY "storage_admin_insert" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'study-materials'
        AND public.is_admin()
        AND (auth.uid()::text = (string_to_array(name, '/'))[1])
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'storage_admin_update' AND tablename = 'objects') THEN
    CREATE POLICY "storage_admin_update" ON storage.objects
      FOR UPDATE USING (
        bucket_id = 'study-materials'
        AND public.is_admin()
        AND (auth.uid()::text = (string_to_array(name, '/'))[1])
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'storage_admin_delete' AND tablename = 'objects') THEN
    CREATE POLICY "storage_admin_delete" ON storage.objects
      FOR DELETE USING (
        bucket_id = 'study-materials'
        AND public.is_admin()
        AND (auth.uid()::text = (string_to_array(name, '/'))[1])
      );
  END IF;
END $$;

-- ══════════════════════════════════════════════
-- STEP 7: INDEXES
-- ══════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_resources_type          ON public.resources(type);
CREATE INDEX IF NOT EXISTS idx_resources_branch_sem    ON public.resources(branch, semester);
CREATE INDEX IF NOT EXISTS idx_resources_downloads     ON public.resources(download_count DESC);
CREATE INDEX IF NOT EXISTS idx_downloads_user_ip       ON public.downloads(user_id, ip_address, created_at);
CREATE INDEX IF NOT EXISTS idx_logs_level_time         ON public.system_logs(level, created_at);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user          ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_resource_views_user     ON public.resource_views(user_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_helpful_votes_resource  ON public.helpful_votes(resource_id);
CREATE INDEX IF NOT EXISTS idx_comments_resource       ON public.comments(resource_id);
CREATE INDEX IF NOT EXISTS idx_collections_user        ON public.bookmark_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rank        ON public.leaderboard_weekly(rank);
CREATE INDEX IF NOT EXISTS idx_badges_user             ON public.user_badges(user_id);

-- ══════════════════════════════════════════════
-- STEP 8: INITIALIZE DATA
-- ══════════════════════════════════════════════

SELECT public.refresh_leaderboard();
