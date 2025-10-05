-- Manual fix for image upload storage issues
-- Run this SQL in your Supabase Dashboard SQL Editor

-- Step 1: Create the item-images storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'item-images',
  'item-images', 
  false,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Item image upload" ON storage.objects;
DROP POLICY IF EXISTS "Item image delete" ON storage.objects;
DROP POLICY IF EXISTS "Item image view" ON storage.objects;

-- Step 4: Create the upload policy
-- This allows managers+ to upload images to their association's folder
CREATE POLICY "Item image upload" ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'item-images' AND
        -- Path structure: association_id/item_id/filename.ext
        public.has_role_or_higher('manager') AND
        public.get_my_association_id() = uuid(split_part(name, '/', 1)) AND
        storage.extension(name) IN ('png', 'jpg', 'jpeg', 'gif', 'webp') AND
        (metadata ->> 'size')::bigint < 10000000 -- 10MB limit
    );

-- Step 5: Create the delete policy
-- This allows managers+ to delete images from their association's folder
CREATE POLICY "Item image delete" ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'item-images' AND
        public.has_role_or_higher('manager') AND
        public.get_my_association_id() = uuid(split_part(name, '/', 1))
    );

-- Step 6: Create the view policy
-- This allows members to view images from their association
CREATE POLICY "Item image view" ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'item-images' AND
        public.is_member_of_association(uuid(split_part(name, '/', 1)))
    );

-- Step 7: Verify the bucket was created
SELECT * FROM storage.buckets WHERE name = 'item-images';

-- Step 8: Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
AND policyname LIKE '%Item image%';
