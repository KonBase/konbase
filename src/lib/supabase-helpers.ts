import { supabase } from '@/lib/supabase';

/**
 * Helper function to check if the current session exists
 * @returns A boolean indicating whether the user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session !== null;
};

/**
 * Helper function to get the current user's ID
 * @returns The user ID if authenticated, null otherwise
 */
export const getCurrentUserId = async (): Promise<string | null> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user?.id || null;
};

/**
 * Enhanced function to create an association with proper error handling
 */
export const createAssociation = async (associationData: any) => {
  try {
    // First explicitly check if the user is authenticated
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('You must be logged in to create an association');
    }

    // If authenticated, proceed with the insert
    const { data, error } = await supabase
      .from('associations')
      .insert(associationData)
      .select()
      .single();

    if (error) throw error;

    // After successful creation, add the current user as an admin member
    const { error: memberError } = await supabase
      .from('association_members')
      .insert({
        user_id: userId,
        association_id: data.id,
      }); // Removed the role field as it no longer exists in association_members

    if (memberError) throw memberError;

    // Update the user's role in the profiles table to 'admin'
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role: 'admin', association_id: data.id }) // This update triggers RLS
      .eq('id', userId);

    if (profileError) throw profileError; // Error occurs here

    // Log this action in audit_logs
    await supabase.from('audit_logs').insert({
      action: 'create_association',
      entity: 'associations',
      entity_id: data.id,
      user_id: userId,
      changes: { role: 'admin', association_created: true },
    });

    return { data };
  } catch (error) {
    console.error('Error creating association:', error);
    return { error };
  }
};
