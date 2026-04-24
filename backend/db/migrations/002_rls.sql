-- =============================================
-- Migration 002: Row Level Security & Triggers
-- Secures the database and defines abuse limiters
-- =============================================

-- ══════════════════════════════════════════════
-- 1. ENABLE ROW LEVEL SECURITY
-- ══════════════════════════════════════════════

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pyq ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syllabus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════════════
-- 2. PROFILES (AUTH SYNC & POLICIES)
-- ══════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles FOR SELECT USING (auth.uid() = id OR is_admin());

DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
CREATE POLICY "profiles_update_admin" ON public.profiles FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());

-- ══════════════════════════════════════════════
-- 3. PUBLIC RESOURCES (READ-ONLY FOR USERS)
-- ══════════════════════════════════════════════

-- Notes
DROP POLICY IF EXISTS "notes_read" ON public.notes;
CREATE POLICY "notes_read" ON public.notes FOR SELECT USING (true);
DROP POLICY IF EXISTS "notes_admin_insert" ON public.notes;
CREATE POLICY "notes_admin_insert" ON public.notes FOR INSERT WITH CHECK (is_admin());
DROP POLICY IF EXISTS "notes_admin_update" ON public.notes;
CREATE POLICY "notes_admin_update" ON public.notes FOR UPDATE USING (is_admin());
DROP POLICY IF EXISTS "notes_admin_delete" ON public.notes;
CREATE POLICY "notes_admin_delete" ON public.notes FOR DELETE USING (is_admin());

-- PYQ
DROP POLICY IF EXISTS "pyq_read" ON public.pyq;
CREATE POLICY "pyq_read" ON public.pyq FOR SELECT USING (true);
DROP POLICY IF EXISTS "pyq_admin_insert" ON public.pyq;
CREATE POLICY "pyq_admin_insert" ON public.pyq FOR INSERT WITH CHECK (is_admin());
DROP POLICY IF EXISTS "pyq_admin_update" ON public.pyq;
CREATE POLICY "pyq_admin_update" ON public.pyq FOR UPDATE USING (is_admin());
DROP POLICY IF EXISTS "pyq_admin_delete" ON public.pyq;
CREATE POLICY "pyq_admin_delete" ON public.pyq FOR DELETE USING (is_admin());

-- Syllabus
DROP POLICY IF EXISTS "syllabus_read" ON public.syllabus;
CREATE POLICY "syllabus_read" ON public.syllabus FOR SELECT USING (true);
DROP POLICY IF EXISTS "syllabus_admin_insert" ON public.syllabus;
CREATE POLICY "syllabus_admin_insert" ON public.syllabus FOR INSERT WITH CHECK (is_admin());
DROP POLICY IF EXISTS "syllabus_admin_update" ON public.syllabus;
CREATE POLICY "syllabus_admin_update" ON public.syllabus FOR UPDATE USING (is_admin());
DROP POLICY IF EXISTS "syllabus_admin_delete" ON public.syllabus;
CREATE POLICY "syllabus_admin_delete" ON public.syllabus FOR DELETE USING (is_admin());

-- ══════════════════════════════════════════════
-- 4. USER DATA (BOOKMARKS & DOWNLOADS)
-- ══════════════════════════════════════════════

-- Bookmarks
DROP POLICY IF EXISTS "bookmarks_select_own" ON public.bookmarks;
CREATE POLICY "bookmarks_select_own" ON public.bookmarks FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "bookmarks_insert_own" ON public.bookmarks;
CREATE POLICY "bookmarks_insert_own" ON public.bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "bookmarks_delete_own" ON public.bookmarks;
CREATE POLICY "bookmarks_delete_own" ON public.bookmarks FOR DELETE USING (auth.uid() = user_id);

-- Downloads
DROP POLICY IF EXISTS "downloads_insert" ON public.downloads;
CREATE POLICY "downloads_insert" ON public.downloads FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "downloads_select_admin" ON public.downloads;
CREATE POLICY "downloads_select_admin" ON public.downloads FOR SELECT USING (is_admin() OR auth.uid() = user_id);

-- Enforce Download Rate Limit Trigger (Abuse Prevention)
CREATE OR REPLACE FUNCTION public.check_download_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  client_ip TEXT;
  recent_user_count INT := 0;
  recent_ip_count INT := 0;
BEGIN
  client_ip := COALESCE(current_setting('request.headers', true)::json->>'x-forwarded-for', '');
  NEW.ip_address := NULLIF(client_ip, '');

  IF NEW.user_id IS NOT NULL THEN
    SELECT COUNT(*) INTO recent_user_count FROM public.downloads 
      WHERE user_id = NEW.user_id AND created_at > (now() - interval '1 hour');
      
    IF recent_user_count >= 50 THEN
      RAISE EXCEPTION 'Rate limit exceeded: Maximum 50 downloads per hour allowed per account.';
    END IF;
  END IF;

  IF client_ip IS NOT NULL THEN
    SELECT COUNT(*) INTO recent_ip_count FROM public.downloads
      WHERE ip_address = client_ip AND created_at > (now() - interval '1 hour');
      
    IF recent_ip_count >= 100 THEN
      RAISE EXCEPTION 'Rate limit exceeded: Maximum 100 downloads per hour allowed per network to prevent multi-account abuse.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_download_limit_trigger ON public.downloads;
CREATE TRIGGER enforce_download_limit_trigger
  BEFORE INSERT ON public.downloads
  FOR EACH ROW EXECUTE PROCEDURE public.check_download_rate_limit();

-- ══════════════════════════════════════════════
-- 5. SYSTEM SETTINGS & LOGGING
-- ══════════════════════════════════════════════

-- Logs Policies
DROP POLICY IF EXISTS "logs_insert" ON public.system_logs;
CREATE POLICY "logs_insert" ON public.system_logs FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "logs_select_admin" ON public.system_logs;
CREATE POLICY "logs_select_admin" ON public.system_logs FOR SELECT USING (is_admin());

-- Error Webhook Alerting
CREATE OR REPLACE FUNCTION public.notify_error_webhook()
RETURNS TRIGGER AS $$
BEGIN
  -- Requires pg_net extension to be enabled in Supabase to fire real HTTP requests
  -- PERFORM net.http_post('https://alert.webhook.io', jsonb_build_object('text', NEW.message));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_error_alert ON public.system_logs;
CREATE TRIGGER trigger_error_alert
  AFTER INSERT ON public.system_logs
  FOR EACH ROW
  WHEN (NEW.level = 'ERROR' OR NEW.level = 'FATAL')
  EXECUTE PROCEDURE public.notify_error_webhook();

-- Config Policies
DROP POLICY IF EXISTS "config_read_all" ON public.app_config;
CREATE POLICY "config_read_all" ON public.app_config FOR SELECT USING (true);
DROP POLICY IF EXISTS "config_update_admin" ON public.app_config;
CREATE POLICY "config_update_admin" ON public.app_config FOR ALL USING (is_admin());

-- Insert Default Config
INSERT INTO public.app_config (key, value) VALUES 
('FEATURE_FLAGS', '{"USE_SUPABASE": true, "ENABLE_CACHE": true, "MAINTENANCE_MODE": false}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Incidents
DROP POLICY IF EXISTS "incidents_read_all" ON public.incidents;
CREATE POLICY "incidents_read_all" ON public.incidents FOR SELECT USING (true);
DROP POLICY IF EXISTS "incidents_update_admin" ON public.incidents;
CREATE POLICY "incidents_update_admin" ON public.incidents FOR ALL USING (is_admin());

-- ══════════════════════════════════════════════
-- 6. STORAGE BUCKET RLS
-- ══════════════════════════════════════════════

DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'storage_public_read' AND tablename = 'objects') THEN 
    CREATE POLICY "storage_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'uploads'); 
  END IF; 

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'storage_admin_insert' AND tablename = 'objects') THEN 
    CREATE POLICY "storage_admin_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'uploads' AND public.is_admin()); 
  END IF; 

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'storage_admin_update' AND tablename = 'objects') THEN 
    CREATE POLICY "storage_admin_update" ON storage.objects FOR UPDATE USING (bucket_id = 'uploads' AND public.is_admin()); 
  END IF; 

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'storage_admin_delete' AND tablename = 'objects') THEN 
    CREATE POLICY "storage_admin_delete" ON storage.objects FOR DELETE USING (bucket_id = 'uploads' AND public.is_admin()); 
  END IF; 
END $$;
