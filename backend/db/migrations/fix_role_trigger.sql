-- Migration: Fix role management so admin can reliably assign roles
-- Run this in Supabase Dashboard > SQL Editor

-- 1. Drop the blocking trigger that prevents admins from changing roles via API
DROP TRIGGER IF EXISTS tr_prevent_role_change ON profiles;
DROP FUNCTION IF EXISTS prevent_role_change();

-- 2. Create a safer trigger that only blocks non-admin self-escalation
CREATE OR REPLACE FUNCTION prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.role IS NOT DISTINCT FROM OLD.role) THEN RETURN NEW; END IF;
    IF auth.uid() IS NULL THEN RETURN NEW; END IF;
    IF EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
        RETURN NEW;
    END IF;
    IF auth.uid() = NEW.id AND NEW.role NOT IN ('admin', 'tpo', 'teacher') THEN
        RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Only administrators can change user roles.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_prevent_role_escalation ON profiles;
CREATE TRIGGER tr_prevent_role_escalation
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION prevent_role_escalation();

-- 3. Ensure the hardcoded admin email has role='admin' in profiles
-- We use an UPDATE here because the user must first sign up via Supabase Auth.
-- Once they sign up, their profile is created, and this will update it.
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'shahiltiwari011@gmail.com';

-- 4. Verify roles
SELECT email, role FROM profiles ORDER BY role, email;
