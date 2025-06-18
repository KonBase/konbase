import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { UserRoleType } from '@/types/user';
import { useAuth } from '@/contexts/auth'; // Corrected import path

// Define the profile type with the expected fields
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  profile_image?: string;
  role: UserRoleType;
  association_id?: string;
  two_factor_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Hook to get and update the user profile
export const useUserProfile = () => {
  const authContext = useAuth(); // Call useAuth to get the context value
  const user = authContext?.user; // Safely access user

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch the user profile
  const fetchProfile = useCallback(async () => {
    if (!user) {
      // Check if user exists (from authContext)
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        throw error;
      }

      // Ensure the data is properly typed
      setProfile(data as UserProfile);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(
        err instanceof Error ? err : new Error('Unknown error occurred'),
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Update the user profile
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      throw new Error('No user is authenticated');
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Ensure proper typing with UserProfile
      setProfile((prev) =>
        prev ? { ...prev, ...(data as UserProfile) } : (data as UserProfile),
      );
      return { ...(data as UserProfile), success: true, error: null };
    } catch (err) {
      console.error('Error updating profile:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    } finally {
      setLoading(false);
    }
  };

  // Update the profile image
  const updateProfileImage = async (imageUrl: string) => {
    return updateProfile({ profile_image: imageUrl });
  };

  // Initialize by fetching the profile when the user changes
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    updateProfile,
    updateProfileImage,
    refreshProfile: fetchProfile,
    user, // Return user for convenience, though it's from useAuth
  };
};
