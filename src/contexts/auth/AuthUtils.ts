import { supabase } from '@/lib/supabase';
import { USER_ROLES, UserRoleType } from '@/types/user';
import { AuthUserProfile, AuthUser } from './AuthTypes';
import { fetchUserProfile } from '@/utils/auth-utils';
import { User } from '@supabase/supabase-js';

/**
 * Check if user has a specific role
 */
export const checkUserHasRole = (
  userProfile: AuthUserProfile | null,
  requiredRole: UserRoleType,
): boolean => {
  if (!userProfile || !userProfile.role) {
    console.log('hasRole check failed: No user profile or role', userProfile);
    return false;
  }

  const userRoleValue =
    USER_ROLES[userProfile.role as UserRoleType]?.level || 0;
  const requiredRoleValue = USER_ROLES[requiredRole]?.level || 0;

  return userRoleValue >= requiredRoleValue;
};

/**
 * Check if user has a specific permission
 */
export const checkUserHasPermission = (
  userProfile: AuthUserProfile | null,
  requiredPermission: string,
): boolean => {
  if (!userProfile || !userProfile.role) {
    console.log('hasPermission check failed: No user profile or role');
    return false;
  }

  const rolePermissions =
    USER_ROLES[userProfile.role as UserRoleType]?.permissions || [];

  return (
    rolePermissions.includes(requiredPermission) ||
    rolePermissions.includes('admin:all')
  );
};

/**
 * Fetch and enhance user with profile data
 */
export const fetchAndEnhanceUserProfile = async (
  userId: string,
  currentUser: User | null,
  setUserProfile: (profile: AuthUserProfile | null) => void,
  setUser: (user: AuthUser | null) => void,
) => {
  if (!userId) return;

  console.log('Fetching profile for user:', userId);
  try {
    const profileData = await fetchUserProfile(userId);

    if (profileData) {
      // Ensure the role is cast to UserRoleType
      const typedProfile: AuthUserProfile = {
        ...profileData,
        role: profileData.role as UserRoleType,
      };

      setUserProfile(typedProfile);

      if (currentUser) {
        // Create an AuthUser object with the required properties
        const authUser: AuthUser = {
          ...currentUser,
          name: typedProfile.name || '',
          profileImage: typedProfile.profile_image,
          role: typedProfile.role,
          email: typedProfile.email || currentUser.email || '',
        };

        setUser(authUser);
      }

      console.log('Profile fetched successfully:', typedProfile.role);
    } else {
      console.error('Failed to fetch user profile or profile not found');
    }
  } catch (error) {
    console.error('Error in fetchAndEnhanceUserProfile:', error);
  }
};

/**
 * Elevate a user to super admin role
 */
export const elevateUserToSuperAdmin = async (
  userProfile: AuthUserProfile | null,
  user: AuthUser | null,
  setUser: (user: AuthUser | null) => void,
  setUserProfile: (profile: AuthUserProfile | null) => void,
): Promise<{ success: boolean; message: string }> => {
  if (!userProfile) {
    return {
      success: false,
      message: 'You must be logged in to access Super Admin privileges',
    };
  }

  if (
    userProfile.role !== 'system_admin' &&
    userProfile.role !== 'super_admin'
  ) {
    return {
      success: false,
      message: "You don't have sufficient privileges for this action",
    };
  }

  if (!userProfile.two_factor_enabled) {
    return {
      success: false,
      message:
        'Two-Factor Authentication must be enabled to access Super Admin privileges',
    };
  }

  try {
    if (userProfile.role === 'system_admin') {
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'super_admin' })
        .eq('id', userProfile.id);

      if (error) throw error;

      if (user) {
        const updatedUser = { ...user, role: 'super_admin' as UserRoleType };
        setUser(updatedUser);
      }

      setUserProfile({ ...userProfile, role: 'super_admin' });
    }

    await supabase.from('audit_logs').insert({
      action: 'super_admin_elevation',
      entity: 'users',
      entity_id: userProfile.id,
      user_id: userProfile.id,
      changes: { role: 'super_admin' },
    });

    return {
      success: true,
      message: 'Super Admin privileges activated',
    };
  } catch (error: any) {
    console.error('Error during super admin elevation:', error);
    return {
      success: false,
      message: error.message || 'Failed to activate Super Admin privileges',
    };
  }
};
