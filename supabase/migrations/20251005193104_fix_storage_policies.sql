-- Create the item-images storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'item-images',
  'item-images', 
  false,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Item image upload" ON storage.objects;
DROP POLICY IF EXISTS "Item image delete" ON storage.objects;
DROP POLICY IF EXISTS "Item image view" ON storage.objects;

-- Policy: Allow managers+ to upload item images for their association
CREATE POLICY "Item image upload" ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'item-images' AND
        -- Path: association_id/item_id/filename.ext
        public.has_role_or_higher('manager') AND
        public.get_my_association_id() = uuid(split_part(name, '/', 1)) AND
        storage.extension(name) IN ('png', 'jpg', 'jpeg', 'gif', 'webp') AND
        (metadata ->> 'size')::bigint < 10000000 -- 10MB limit
    );

-- Policy: Allow managers+ to delete item images for their association
CREATE POLICY "Item image delete" ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'item-images' AND
        public.has_role_or_higher('manager') AND
        public.get_my_association_id() = uuid(split_part(name, '/', 1))
    );

-- Policy: Allow members to view item images for their association
CREATE POLICY "Item image view" ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'item-images' AND
        public.is_member_of_association(uuid(split_part(name, '/', 1)))
    );
