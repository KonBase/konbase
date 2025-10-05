-- Manual fix for storage bucket issues
-- Run this in your Supabase Dashboard SQL Editor

-- Step 1: Check if the bucket exists
SELECT * FROM storage.buckets WHERE name = 'item-images';

-- Step 2: If the bucket doesn't exist, create it
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'item-images',
  'item-images', 
  false,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Step 3: Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
AND policyname LIKE '%Item image%';

-- Step 4: Drop all existing item-image policies
DROP POLICY IF EXISTS "Item image upload" ON storage.objects;
DROP POLICY IF EXISTS "Item image delete" ON storage.objects;
DROP POLICY IF EXISTS "Item image view" ON storage.objects;
DROP POLICY IF EXISTS "Item image upload permissive" ON storage.objects;
DROP POLICY IF EXISTS "Item image delete permissive" ON storage.objects;
DROP POLICY IF EXISTS "Item image view permissive" ON storage.objects;
DROP POLICY IF EXISTS "Item image minimal test" ON storage.objects;

-- Step 5: Create the most basic policy possible
CREATE POLICY "Allow authenticated users to manage item images" ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'item-images')
WITH CHECK (bucket_id = 'item-images');

-- Step 6: Verify the bucket and policies
SELECT 'Bucket exists:' as status, name, public, file_size_limit FROM storage.buckets WHERE name = 'item-images';
SELECT 'Policy created:' as status, policyname FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname LIKE '%item%';
