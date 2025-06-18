import { Session, User } from '@supabase/supabase-js';
import { UserRoleType } from '@/types/user';

export interface AuthUserProfile {
  id: string;
  email: string;
  name: string;
  profile_image?: string;
  role: UserRoleType;
  two_factor_enabled?: boolean;
  [key: string]: any;
}

export interface AuthUser extends User {
  name: string;
  profileImage?: string;
  role: UserRoleType;
  email: string;
}

export interface AuthState {
  session: Session | null;
  user: AuthUser | null;
  userProfile: AuthUserProfile | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'discord') => Promise<void>;
  hasRole: (role: UserRoleType) => boolean;
  hasPermission: (permission: string) => boolean;
  checkRoleAccess: (role: UserRoleType) => Promise<boolean>;
  login: (email: string, password: string) => Promise<void>; // Alias for signIn
  logout: () => Promise<void>; // Alias for signOut
  resetPassword: (email: string) => Promise<void>; // Add resetPassword method
  elevateToSuperAdmin: () => Promise<{ success: boolean; message: string }>;
  updateProfile: (updates: Partial<AuthUserProfile>) => Promise<void>;
}
