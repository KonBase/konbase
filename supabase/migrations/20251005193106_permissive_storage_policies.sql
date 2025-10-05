-- Temporary fix: Create more permissive storage policies to get uploads working
-- We'll tighten these later once we understand the role/permission structure

-- Drop existing policies
DROP POLICY IF EXISTS "Item image upload" ON storage.objects;
DROP POLICY IF EXISTS "Item image delete" ON storage.objects;
DROP POLICY IF EXISTS "Item image view" ON storage.objects;

-- More permissive upload policy - allow any authenticated user to upload to item-images bucket
CREATE POLICY "Item image upload permissive" ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'item-images' AND
        auth.uid() IS NOT NULL AND
        storage.extension(name) IN ('png', 'jpg', 'jpeg', 'gif', 'webp') AND
        (metadata ->> 'size')::bigint < 10000000 -- 10MB limit
    );

-- More permissive delete policy
CREATE POLICY "Item image delete permissive" ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'item-images' AND
        auth.uid() IS NOT NULL
    );

-- More permissive view policy
CREATE POLICY "Item image view permissive" ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'item-images' AND
        auth.uid() IS NOT NULL
    );
