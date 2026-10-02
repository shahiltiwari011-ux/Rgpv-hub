-- Migration: Fix infinite recursion in profiles RLS policies
-- Run this in Supabase Dashboard > SQL Editor

-- 1. Drop ALL existing policies on profiles to clear out any recursive ones
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;

-- 2. Recreate clean, non-recursive policies
-- A. Anyone can read profiles (safest to avoid read recursion)
CREATE POLICY "profiles_select_public" ON public.profiles
  FOR SELECT USING (true);

-- B. Users can insert their own profile
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- C. Users can update their own profile, admins can update any
-- Because the SELECT policy is now just `true`, is_admin() will NOT recurse.
CREATE POLICY "profiles_update_own_or_admin" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR is_admin());

-- D. Admins can delete profiles
CREATE POLICY "profiles_delete_admin" ON public.profiles
  FOR DELETE USING (is_admin());

-- 3. Fix the trigger just in case it had issues
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
    -- If role hasn't changed, allow it
    IF (NEW.role IS NOT DISTINCT FROM OLD.role) THEN RETURN NEW; END IF;
    
    -- If no user is logged in (e.g. system backend), allow it
    IF auth.uid() IS NULL THEN RETURN NEW; END IF;
    
    -- If the current user is an admin, allow it
    -- Using a direct select, this won't recurse because SELECT policy is USING (true)
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
        RETURN NEW;
    END IF;
    
    -- Prevent non-admins from changing roles
    RAISE EXCEPTION 'Only administrators can change user roles.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
