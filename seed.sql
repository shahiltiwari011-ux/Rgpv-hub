-- =============================================
-- RGPV Study Hub — TEST DATA SCRIPT
-- Run this in your Supabase SQL Editor to populate test data
-- =============================================

-- Insert Test Notes
INSERT INTO public.notes (title, subject, branch, semester, icon, file_url) VALUES
('Data Structures and Algorithms Complete Notes', 'Data Structures (CS-302)', 'Computer Science', '3', '📚', 'https://example.com/dsa-notes.pdf'),
('Database Management Systems Notes', 'DBMS (CS-403)', 'Computer Science', '4', '🗄️', 'https://example.com/dbms-notes.pdf'),
('Basic Electrical Engineering Notes', 'BEE (BT-104)', 'First Year', '1', '⚡', 'https://example.com/bee-notes.pdf'),
('Strength of Materials Handwritten Notes', 'SOM (ME-302)', 'Mechanical', '3', '🏗️', 'https://example.com/som-notes.pdf');

-- Insert Test PYQs
INSERT INTO public.pyq (title, subject, year, branch, semester, icon, file_url) VALUES
('Data Structures Exam Paper - 2023', 'Data Structures (CS-302)', '2023', 'Computer Science', '3', '📄', 'https://example.com/dsa-2023.pdf'),
('Data Structures Exam Paper - 2022', 'Data Structures (CS-302)', '2022', 'Computer Science', '3', '📄', 'https://example.com/dsa-2022.pdf'),
('Engineering Physics PYQ - 2023', 'Physics (BT-201)', '2023', 'First Year', '2', '⚛️', 'https://example.com/physics-2023.pdf');

-- Insert Test Syllabus
INSERT INTO public.syllabus (title, branch, semester, icon, topics, file_url) VALUES
('CS 3rd Semester Official Syllabus', 'Computer Science', '3', '📋', ARRAY['Data Structures', 'Discrete Mathematics', 'Digital Electronics', 'Object Oriented Programming'], 'https://example.com/cs-sem3-syllabus.pdf'),
('CE 4th Semester Official Syllabus', 'Civil', '4', '📋', ARRAY['Building Planning', 'Fluid Mechanics II', 'Structural Analysis I'], 'https://example.com/ce-sem4-syllabus.pdf');

-- Verify insertion
SELECT 'Inserted 4 Notes, 3 PYQs, and 2 Syllabuses successfully.' as Result;
