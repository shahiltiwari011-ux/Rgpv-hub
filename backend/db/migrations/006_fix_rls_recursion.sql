-- Migration: Fix infinite recursion in profiles RLS policies & add RPC role functions
-- Copy and paste this ENTIRE script into Supabase Dashboard > SQL Editor and click RUN.

-- 1. Create SECURITY DEFINER RPC function for updating roles by ID
CREATE OR REPLACE FUNCTION public.admin_update_user_role(target_user_id UUID, new_role TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    caller_role TEXT;
BEGIN
    SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
    
    IF auth.uid() IS NOT NULL AND (caller_role IS NULL OR caller_role != 'admin') THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND email IN ('shahiltiwari011@gmail.com')
        ) THEN
            RAISE EXCEPTION 'Access denied: Only administrators can update user roles.';
        END IF;
    END IF;

    UPDATE public.profiles
    SET role = LOWER(TRIM(new_role)),
        updated_at = NOW()
    WHERE id = target_user_id;

    IF NOT FOUND THEN
        UPDATE public.profiles
        SET role = LOWER(TRIM(new_role)),
            updated_at = NOW()
        WHERE email = (SELECT email FROM public.profiles WHERE id = target_user_id);
    END IF;

    RETURN jsonb_build_object('success', true, 'target_user_id', target_user_id, 'new_role', new_role);
END;
$$;

-- 2. Create SECURITY DEFINER RPC function for inviting/updating users by email
CREATE OR REPLACE FUNCTION public.admin_invite_user(invite_email TEXT, invite_name TEXT, invite_role TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_id UUID;
BEGIN
    invite_email := LOWER(TRIM(invite_email));
    invite_role := LOWER(TRIM(invite_role));

    -- Check if user exists in auth.users or profiles
    SELECT id INTO target_id FROM auth.users WHERE LOWER(email) = invite_email;
    IF target_id IS NULL THEN
        SELECT id INTO target_id FROM public.profiles WHERE LOWER(email) = invite_email;
    END IF;

    IF target_id IS NOT AVAILABLE OR target_id IS NULL THEN
        target_id := gen_random_uuid();
    END IF;

    INSERT INTO public.profiles (id, email, name, role)
    VALUES (target_id, invite_email, invite_name, invite_role)
    ON CONFLICT (id) DO UPDATE
    SET role = EXCLUDED.role,
        name = COALESCE(EXCLUDED.name, public.profiles.name);

    RETURN jsonb_build_object('success', true, 'email', invite_email, 'role', invite_role, 'id', target_id);
EXCEPTION WHEN OTHERS THEN
    -- Fallback update by email if conflict on email occurs
    UPDATE public.profiles
    SET role = invite_role,
        name = COALESCE(invite_name, name)
    WHERE LOWER(email) = invite_email;
    RETURN jsonb_build_object('success', true, 'email', invite_email, 'role', invite_role);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_user_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_user_role(UUID, TEXT) TO service_role;

GRANT EXECUTE ON FUNCTION public.admin_invite_user(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_invite_user(TEXT, TEXT, TEXT) TO service_role;

-- 3. Drop ALL existing policies on profiles to clear out any recursive ones
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.profiles;

-- 4. Recreate clean, non-recursive policies
CREATE POLICY "profiles_select_public" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_delete_own" ON public.profiles
  FOR DELETE USING (auth.uid() = id);
