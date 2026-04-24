-- Phase 2 Forum Relationship & Schema Fix (V2)
-- 1. Establishing explicit links between forum tables and user profiles
ALTER TABLE public.forum_posts 
  DROP CONSTRAINT IF EXISTS forum_posts_user_id_fkey;
ALTER TABLE public.forum_posts
  ADD CONSTRAINT forum_posts_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.forum_comments 
  DROP CONSTRAINT IF EXISTS forum_comments_user_id_fkey;
ALTER TABLE public.forum_comments
  ADD CONSTRAINT forum_comments_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. Safety: Ensure name column exists in profiles (Standard check)
-- This ensures the join used in the API: profiles(name) succeeds
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='name') THEN
        ALTER TABLE public.profiles ADD COLUMN name TEXT;
    END IF;
END $$;
