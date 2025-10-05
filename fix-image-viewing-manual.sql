-- Manual fix for image viewing issues
-- Run this in your Supabase Dashboard SQL Editor

-- Step 1: Make the item-images bucket public so images can be viewed
UPDATE storage.buckets 
SET public = true 
WHERE name = 'item-images';

-- Step 2: Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
AND policyname LIKE '%item%';

-- Step 3: Drop any existing policies
DROP POLICY IF EXISTS "Allow authenticated users to manage item images" ON storage.objects;
DROP POLICY IF EXISTS "Allow viewing item images" ON storage.objects;
DROP POLICY IF EXISTS "Allow uploading item images" ON storage.objects;
DROP POLICY IF EXISTS "Allow updating item images" ON storage.objects;
DROP POLICY IF EXISTS "Allow deleting item images" ON storage.objects;

-- Step 4: Create separate policies for different operations
-- Policy for viewing images (SELECT)
CREATE POLICY "Allow viewing item images" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'item-images');

-- Policy for uploading images (INSERT)
CREATE POLICY "Allow uploading item images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'item-images' AND
    storage.extension(name) IN ('png', 'jpg', 'jpeg', 'gif', 'webp') AND
    (metadata ->> 'size')::bigint < 10000000 -- 10MB limit
);

-- Policy for updating images (UPDATE)
CREATE POLICY "Allow updating item images" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'item-images')
WITH CHECK (bucket_id = 'item-images');

-- Policy for deleting images (DELETE)
CREATE POLICY "Allow deleting item images" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'item-images');

-- Step 5: Verify the bucket is now public
SELECT 'Bucket status:' as status, name, public, file_size_limit FROM storage.buckets WHERE name = 'item-images';

-- Step 6: Verify policies were created
SELECT 'Policies created:' as status, policyname, cmd FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname LIKE '%item%';
