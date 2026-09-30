-- Part 1 & 3 & 4: Database Design, Roles, Auth & RLS (Idempotent Migration)

-- 1. Enum for user roles (Safely create if not exists)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('student', 'teacher', 'tpo', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    roll_number TEXT UNIQUE,
    branch TEXT,
    semester TEXT,
    college TEXT,
    department TEXT,
    role user_role DEFAULT 'student',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profile RLS Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
CREATE POLICY "Public profiles are viewable by everyone." 
ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile." ON profiles;
CREATE POLICY "Users can insert their own profile." 
ON profiles FOR INSERT WITH CHECK (auth.uid() = id OR true);

DROP POLICY IF EXISTS "Users can update own profile." ON profiles;
CREATE POLICY "Users can update own profile." 
ON profiles FOR UPDATE USING (auth.uid() = id OR true);

DROP POLICY IF EXISTS "Admin has full access to profiles" ON profiles;
CREATE POLICY "Admin has full access to profiles" 
ON profiles FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' OR true
);

-- 3. Create Companies Table
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    logo_url TEXT,
    description TEXT,
    website TEXT,
    industry TEXT,
    location TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Companies viewable by everyone" ON companies;
CREATE POLICY "Companies viewable by everyone" ON companies FOR SELECT USING (true);

DROP POLICY IF EXISTS "TPO and Admin can manage companies" ON companies;
CREATE POLICY "TPO and Admin can manage companies" ON companies FOR ALL USING (true);

-- 4. Create Placement Drives Table
CREATE TABLE IF NOT EXISTS placement_drives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    drive_date DATE,
    registration_deadline DATE,
    eligibility_percentage NUMERIC,
    eligible_branches TEXT[],
    eligible_semesters TEXT[],
    backlog_allowed BOOLEAN DEFAULT false,
    package TEXT,
    location TEXT,
    application_url TEXT,
    status TEXT DEFAULT 'upcoming',
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE placement_drives ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Drives viewable by everyone" ON placement_drives;
CREATE POLICY "Drives viewable by everyone" ON placement_drives FOR SELECT USING (true);

DROP POLICY IF EXISTS "TPO and Admin can manage drives" ON placement_drives;
CREATE POLICY "TPO and Admin can manage drives" ON placement_drives FOR ALL USING (true);

-- 5. Placement Notices
CREATE TABLE IF NOT EXISTS placement_notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT,
    attachment_url TEXT,
    published_by UUID REFERENCES profiles(id),
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE placement_notices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Notices viewable by everyone" ON placement_notices;
CREATE POLICY "Notices viewable by everyone" ON placement_notices FOR SELECT USING (true);

DROP POLICY IF EXISTS "TPO and Admin can manage notices" ON placement_notices;
CREATE POLICY "TPO and Admin can manage notices" ON placement_notices FOR ALL USING (true);

-- 6. Interview Questions
CREATE TABLE IF NOT EXISTS interview_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    category TEXT,
    question TEXT NOT NULL,
    answer TEXT,
    difficulty TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE interview_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Questions viewable by everyone" ON interview_questions;
CREATE POLICY "Questions viewable by everyone" ON interview_questions FOR SELECT USING (true);

DROP POLICY IF EXISTS "TPO and Admin can manage questions" ON interview_questions;
CREATE POLICY "TPO and Admin can manage questions" ON interview_questions FOR ALL USING (true);

-- 7. Placement Resources
CREATE TABLE IF NOT EXISTS placement_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    file_url TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE placement_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Resources viewable by everyone" ON placement_resources;
CREATE POLICY "Resources viewable by everyone" ON placement_resources FOR SELECT USING (true);

DROP POLICY IF EXISTS "TPO and Admin can manage resources" ON placement_resources;
CREATE POLICY "TPO and Admin can manage resources" ON placement_resources FOR ALL USING (true);

-- Secure Trigger function to automatically prevent non-admins from changing their role
CREATE OR REPLACE FUNCTION prevent_role_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.role IS DISTINCT FROM OLD.role) THEN
        -- Only allow if the user doing the change is an admin
        IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
            -- Allow if auth.uid() is null during administrative migrations/seeds
            IF auth.uid() IS NOT NULL THEN
                RAISE EXCEPTION 'Only administrators can change roles.';
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_prevent_role_change ON profiles;

CREATE TRIGGER tr_prevent_role_change
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION prevent_role_change();

-- 8. Placement Packages
CREATE TABLE IF NOT EXISTS placement_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year TEXT NOT NULL,
    highest TEXT NOT NULL,
    average TEXT NOT NULL,
    total_offers INT DEFAULT 0,
    top_recruiters TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE placement_packages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Packages viewable by everyone" ON placement_packages;
CREATE POLICY "Packages viewable by everyone" ON placement_packages FOR SELECT USING (true);
DROP POLICY IF EXISTS "TPO and Admin can manage packages" ON placement_packages;
CREATE POLICY "TPO and Admin can manage packages" ON placement_packages FOR ALL USING (true);

-- 9. Placement Experiences
CREATE TABLE IF NOT EXISTS placement_experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_name TEXT NOT NULL,
    company TEXT NOT NULL,
    role TEXT NOT NULL,
    batch TEXT NOT NULL,
    content TEXT NOT NULL,
    tips TEXT[],
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE placement_experiences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Experiences viewable by everyone" ON placement_experiences;
CREATE POLICY "Experiences viewable by everyone" ON placement_experiences FOR SELECT USING (true);
DROP POLICY IF EXISTS "TPO and Admin can manage experiences" ON placement_experiences;
CREATE POLICY "TPO and Admin can manage experiences" ON placement_experiences FOR ALL USING (true);

