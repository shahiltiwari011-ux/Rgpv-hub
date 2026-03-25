-- Phase 2 Engagement Migrations

-- 1. Ratings Table (1-5 Stars)
CREATE TABLE IF NOT EXISTS public.ratings (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  resource_id UUID REFERENCES public.resources(id) ON DELETE CASCADE NOT NULL,
  rating      INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, resource_id)
);

-- 2. Forum Posts
CREATE TABLE IF NOT EXISTS public.forum_posts (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  branch      TEXT,
  semester    INTEGER,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 3. Forum Comments (Replies)
CREATE TABLE IF NOT EXISTS public.forum_comments (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id     UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE NOT NULL,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;

-- Ratings Policies
DROP POLICY IF EXISTS "ratings_select" ON public.ratings;
CREATE POLICY "ratings_select" ON public.ratings FOR SELECT USING (true);

DROP POLICY IF EXISTS "ratings_upsert_own" ON public.ratings;
CREATE POLICY "ratings_upsert_own" ON public.ratings FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "ratings_update_own" ON public.ratings;
CREATE POLICY "ratings_update_own" ON public.ratings FOR UPDATE USING (auth.uid() = user_id);

-- Forum Policies
DROP POLICY IF EXISTS "forum_posts_select" ON public.forum_posts;
CREATE POLICY "forum_posts_select" ON public.forum_posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "forum_posts_insert" ON public.forum_posts;
CREATE POLICY "forum_posts_insert" ON public.forum_posts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "forum_posts_owner_admin" ON public.forum_posts;
CREATE POLICY "forum_posts_owner_admin" ON public.forum_posts FOR ALL USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "forum_comments_select" ON public.forum_comments;
CREATE POLICY "forum_comments_select" ON public.forum_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "forum_comments_insert" ON public.forum_comments;
CREATE POLICY "forum_comments_insert" ON public.forum_comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "forum_comments_owner_admin" ON public.forum_comments;
CREATE POLICY "forum_comments_owner_admin" ON public.forum_comments FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Indexing
CREATE INDEX IF NOT EXISTS idx_ratings_resource ON public.ratings(resource_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_branch ON public.forum_posts(branch, semester);
CREATE INDEX IF NOT EXISTS idx_forum_comments_post ON public.forum_comments(post_id);
