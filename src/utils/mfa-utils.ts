import { supabase } from '@/lib/supabase';

/**
 * Updates the user's MFA status in the database profile
 * @param enabled - Whether MFA is enabled or disabled
 */
export const updateMFAStatus = async (enabled: boolean): Promise<void> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ two_factor_enabled: enabled })
      .eq('id', (await supabase.auth.getUser()).data.user?.id);

    if (error) {
      console.error('Error updating MFA status:', error);
      throw error;
    }

    console.log(`MFA status updated to: ${enabled}`);
  } catch (error) {
    console.error('Failed to update MFA status:', error);
    throw error;
  }
};

/**
 * Checks if the user has verified MFA factors
 * @returns Promise<boolean> - True if user has verified MFA factors
 */
export const hasVerifiedMFAFactors = async (): Promise<boolean> => {
  try {
    const { data: factors, error } = await supabase.auth.mfa.listFactors();
    
    if (error) {
      console.warn('Error checking MFA factors:', error);
      return false;
    }

    const verifiedFactors = [
      ...(factors.totp || []).filter(f => f.status === 'verified'),
      ...(factors.phone || []).filter(f => f.status === 'verified')
    ];

    return verifiedFactors.length > 0;
  } catch (error) {
    console.error('Failed to check MFA factors:', error);
    return false;
  }
};

/**
 * Gets the user's MFA factors with detailed information
 * @returns Promise<object> - Object containing TOTP and phone factors
 */
export const getMFAFactors = async () => {
  try {
    const { data: factors, error } = await supabase.auth.mfa.listFactors();
    
    if (error) {
      throw error;
    }

    return {
      totp: factors.totp || [],
      phone: factors.phone || [],
      all: [...(factors.totp || []), ...(factors.phone || [])],
      verified: [
        ...(factors.totp || []).filter(f => f.status === 'verified'),
        ...(factors.phone || []).filter(f => f.status === 'verified')
      ]
    };
  } catch (error) {
    console.error('Failed to get MFA factors:', error);
    throw error;
  }
};
