-- Minimal storage policy test - remove all restrictions
-- This will help us isolate if the issue is with policies or bucket existence

-- Drop all existing policies
DROP POLICY IF EXISTS "Item image upload permissive" ON storage.objects;
DROP POLICY IF EXISTS "Item image delete permissive" ON storage.objects;
DROP POLICY IF EXISTS "Item image view permissive" ON storage.objects;

-- Create the most minimal policy possible - just check bucket_id
CREATE POLICY "Item image minimal test" ON storage.objects FOR ALL
    TO authenticated
    USING (bucket_id = 'item-images')
    WITH CHECK (bucket_id = 'item-images');

