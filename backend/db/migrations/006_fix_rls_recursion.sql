-- Migration: Fix infinite recursion in profiles RLS policies & add RPC role update
-- Copy and paste this ENTIRE script into Supabase Dashboard > SQL Editor and click RUN.

-- 1. Create SECURITY DEFINER RPC function for updating roles
-- Since it runs with SECURITY DEFINER, it bypasses RLS policies completely and NEVER triggers infinite recursion!
CREATE OR REPLACE FUNCTION public.admin_update_user_role(target_user_id UUID, new_role TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    caller_role TEXT;
BEGIN
    -- Check if calling user is admin (or whitelist check)
    SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
    
    -- Allow update if caller is admin OR if auth.uid() is null (backend service)
    IF auth.uid() IS NOT NULL AND (caller_role IS NULL OR caller_role != 'admin') THEN
        -- Extra whitelist check for admin email if needed
        IF NOT EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND email IN ('shahiltiwari011@gmail.com')
        ) THEN
            RAISE EXCEPTION 'Access denied: Only administrators can update user roles.';
        END IF;
    END IF;

    -- Update target user's profile role
    UPDATE public.profiles
    SET role = LOWER(TRIM(new_role)),
        updated_at = NOW()
    WHERE id = target_user_id;

    IF NOT FOUND THEN
        -- Try updating by legacy email if target_user_id wasn't matched directly
        UPDATE public.profiles
        SET role = LOWER(TRIM(new_role)),
            updated_at = NOW()
        WHERE email = (SELECT email FROM public.profiles WHERE id = target_user_id);
    END IF;

    RETURN jsonb_build_object('success', true, 'target_user_id', target_user_id, 'new_role', new_role);
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.admin_update_user_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_user_role(UUID, TEXT) TO service_role;

-- 2. Drop ALL existing policies on profiles to clear out any recursive ones
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.profiles;

-- 3. Recreate clean, non-recursive policies
-- A. Anyone can read profiles (safest to avoid read recursion across all tables)
CREATE POLICY "profiles_select_public" ON public.profiles
  FOR SELECT USING (true);

-- B. Users can insert their own profile
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- C. Users can update their own profile fields
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- D. Delete policy (service_role or self)
CREATE POLICY "profiles_delete_own" ON public.profiles
  FOR DELETE USING (auth.uid() = id);

-- 4. Fix trigger to prevent role self-escalation by non-admins
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
    -- If role hasn't changed, allow
    IF (NEW.role IS NOT DISTINCT FROM OLD.role) THEN RETURN NEW; END IF;
    
    -- If no user is logged in (e.g. system RPC / migration), allow
    IF auth.uid() IS NULL THEN RETURN NEW; END IF;
    
    -- Allow if caller is admin
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
        RETURN NEW;
    END IF;
    
    -- Prevent non-admins from changing roles
    RAISE EXCEPTION 'Only administrators can change user roles.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
