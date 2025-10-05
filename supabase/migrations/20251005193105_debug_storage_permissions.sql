-- Debug migration to check user permissions and storage policies
-- This will help us understand why the storage upload is failing

-- Create a function to debug storage upload permissions
CREATE OR REPLACE FUNCTION public.debug_storage_permissions(
  p_association_id uuid,
  p_file_path text
)
RETURNS TABLE(
  user_id uuid,
  user_role_in_profile text,
  user_role_in_association text,
  is_member boolean,
  has_manager_role boolean,
  association_id_from_path uuid,
  file_extension text,
  policy_check_result text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  profile_role text;
  association_role text;
  member_exists boolean;
  has_manager boolean;
  path_association_id uuid;
  file_ext text;
BEGIN
  current_user_id := auth.uid();
  
  -- Get user role from profiles table
  SELECT role::text INTO profile_role
  FROM public.profiles
  WHERE id = current_user_id;
  
  -- Get user role from association_members table
  SELECT role::text INTO association_role
  FROM public.association_members
  WHERE user_id = current_user_id AND association_id = p_association_id;
  
  -- Check if user is member of association
  SELECT EXISTS(
    SELECT 1 FROM public.association_members
    WHERE user_id = current_user_id AND association_id = p_association_id
  ) INTO member_exists;
  
  -- Check if user has manager role or higher
  SELECT public.has_role_or_higher('manager') INTO has_manager;
  
  -- Extract association ID from file path
  path_association_id := uuid(split_part(p_file_path, '/', 1));
  
  -- Extract file extension
  file_ext := storage.extension(p_file_path);
  
  RETURN QUERY SELECT
    current_user_id,
    profile_role,
    association_role,
    member_exists,
    has_manager,
    path_association_id,
    file_ext,
    CASE 
      WHEN bucket_id = 'item-images' AND
           public.has_role_or_higher('manager') AND
           public.get_my_association_id() = uuid(split_part(p_file_path, '/', 1)) AND
           storage.extension(p_file_path) IN ('png', 'jpg', 'jpeg', 'gif', 'webp')
      THEN 'PASS'
      ELSE 'FAIL'
    END as policy_check_result
  FROM storage.objects
  WHERE bucket_id = 'item-images'
  LIMIT 1;
END;
$$;
