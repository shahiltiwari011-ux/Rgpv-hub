-- FIX DATABASE & STORAGE PERMISSIONS
-- Run this script in your Supabase SQL Editor

-- 1. FIX DATABASE PERMISSIONS FOR RESOURCES TABLE
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All" ON resources;
CREATE POLICY "Allow All" ON resources FOR ALL USING (true) WITH CHECK (true);

-- 2. FIX STORAGE PERMISSIONS FOR STUDY-MATERIALS BUCKET
DROP POLICY IF EXISTS "Allow Public Upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow Public Select" ON storage.objects;
DROP POLICY IF EXISTS "Allow Public Delete" ON storage.objects;

CREATE POLICY "Allow Public Upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'study-materials');

CREATE POLICY "Allow Public Select" ON storage.objects
  FOR SELECT USING (bucket_id = 'study-materials');

CREATE POLICY "Allow Public Delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'study-materials');
