-- Fix image viewing permissions
-- The bucket is private but we need to allow authenticated users to view images

-- First, let's make the bucket public so images can be viewed directly
UPDATE storage.buckets 
SET public = true 
WHERE name = 'item-images';

-- Drop the current policy
DROP POLICY IF EXISTS "Allow authenticated users to manage item images" ON storage.objects;

-- Create separate policies for different operations
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

