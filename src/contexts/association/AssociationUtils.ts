import { supabase } from '@/lib/supabase';
import { Association } from '@/types/association';

/**
 * Format an association from database response
 */
export const formatAssociation = (association: any): Association => ({
  id: association.id,
  name: association.name,
  description: association.description || undefined,
  logo: association.logo || undefined,
  address: association.address || undefined,
  contactEmail: association.contact_email,
  contactPhone: association.contact_phone || undefined,
  website: association.website || undefined,
  createdAt: association.created_at,
  updatedAt: association.updated_at,
  items: association.items || [],
});

/**
 * Fetch an association by ID
 */
export const fetchAssociationById = async (
  id: string,
): Promise<Association | null> => {
  try {
    const { data: association, error } = await supabase
      .from('associations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return association ? formatAssociation(association) : null;
  } catch (error) {
    console.error('Error fetching association:', error);
    return null;
  }
};

/**
 * Fetch user's associations
 */
export const fetchUserAssociations = async (
  profileId: string,
): Promise<Association[]> => {
  try {
    // First check if user has a primary association
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('association_id')
      .eq('id', profileId)
      .single();

    if (profileError) throw profileError;

    if (profile?.association_id) {
      const association = await fetchAssociationById(profile.association_id);
      return association ? [association] : [];
    }

    let membershipData;

    // Try the RPC function first - this bypasses row-level policies
    try {
      const { data, error } = await supabase.rpc(
        'get_user_association_memberships',
        { user_id_param: profileId },
      );

      if (!error && data) {
        membershipData = data; // Assign data directly
      } else if (error) {
        console.warn(
          'RPC method get_user_association_memberships failed, falling back to direct query:',
          error.message,
        );
        // Fallback logic below
      } else {
        console.warn(
          'RPC method get_user_association_memberships returned no data, falling back.',
        );
      }
    } catch (rpcError) {
      console.error(
        'Exception calling RPC get_user_association_memberships:',
        rpcError,
      );
      // Fallback logic below
    }

    // Fallback: Direct query on memberships table (respects RLS)
    if (!membershipData) {
      console.log(
        'Falling back to direct query for memberships for user:',
        profileId,
      );
      const { data: directData, error: directError } = await supabase
        .from('memberships')
        .select(
          `
          *,
          associations (
            id,
            name,
            slug
          )
        `,
        )
        .eq('profile_id', profileId);

      if (directError) {
        console.error('Direct membership query failed:', directError.message);
        return []; // Return empty if both methods fail
      }
      membershipData = directData;
    }

    // If we have no memberships, return empty array
    if (!membershipData || membershipData.length === 0) {
      return [];
    }

    // Continue with existing code: get association details for each membership
    const associationIds = membershipData.map((m) => m.association_id);

    const { data: associations, error: associationsError } = await supabase
      .from('associations')
      .select('*')
      .in('id', associationIds);

    if (associationsError) throw associationsError;

    if (associations && associations.length > 0) {
      return associations.map(formatAssociation);
    }

    return [];
  } catch (error) {
    console.error('Error fetching user associations:', error);
    return [];
  }
};

/**
 * Create a new association by calling the database function
 */
export const createAssociation = async (
  data: Partial<Association>,
  profileId: string,
  // profileEmail is no longer needed here as the function uses SECURITY DEFINER
): Promise<Association | null> => {
  console.log(
    'Entering createAssociation (AssociationUtils.ts) with data:',
    data,
    'profileId:',
    profileId,
  );
  try {
    // Prepare the data for the database function
    const associationData = {
      name: data.name || 'New Association',
      description: data.description,
      logo: data.logo,
      address: data.address,
      contact_email: data.contactEmail,
      contact_phone: data.contactPhone,
      website: data.website,
    };

    // Call the PostgreSQL function
    const { data: result, error: rpcError } = await supabase.rpc(
      'create_association_and_set_admin',
      {
        association_data: associationData,
        creator_id: profileId,
      },
    );

    // 1. Handle RPC errors first
    if (rpcError) {
      console.error('Supabase RPC error in createAssociation:', rpcError);
      // Ensure rpcError is thrown as an Error instance
      if (rpcError instanceof Error) {
        throw rpcError;
      } else {
        // Attempt to create a meaningful error message
        const message =
          typeof rpcError === 'object' && 'message' in rpcError
            ? String(rpcError.message)
            : `Supabase RPC failed: ${JSON.stringify(rpcError)}`;
        throw new Error(message);
      }
    }

    // 2. Check if the function returned an application-level error within the data payload
    //    (Assuming the function might return { error: string, sqlstate: string } on failure)
    if (
      result &&
      typeof result === 'object' &&
      'error' in result &&
      result.error
    ) {
      const dbErrorMessage = result.error;
      const sqlstate = 'sqlstate' in result ? result.sqlstate : 'N/A';
      console.error(
        'Database function returned error:',
        dbErrorMessage,
        'SQLSTATE:',
        sqlstate,
      );
      // Create a new Error object with the message from the function
      throw new Error(
        `Database Error: ${dbErrorMessage} (SQLSTATE: ${sqlstate})`,
      );
    }

    // 3. Check for successful result
    //    Assuming 'result' contains the association data on success
    if (result) {
      // The function returns the created association object on success
      // Ensure formatAssociation handles the raw result correctly
      return formatAssociation(result);
    }

    // 4. Handle unexpected null/undefined result without an RPC error
    console.error(
      'Unexpected null or undefined result from create_association_and_set_admin RPC without an error:',
      result,
    );
    throw new Error(
      'Unexpected result from database function: Received null or undefined data without an error.',
    );
  } catch (error: unknown) {
    // Catch as unknown type
    // Log the raw error object first for debugging
    console.error(
      'Raw error caught in createAssociation (AssociationUtils.ts):',
      error,
    );

    let errorToThrow: Error;

    if (error instanceof Error) {
      // If it's already an Error instance, use it directly
      errorToThrow = error;
    } else if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error
    ) {
      // Handle objects with a message property (like potential Supabase errors not instanceof Error)
      errorToThrow = new Error(String(error.message));
      // Attempt to preserve stack if available
      if ('stack' in error && typeof error.stack === 'string') {
        errorToThrow.stack = error.stack;
      }
    } else {
      // Handle primitive values or other unexpected throws
      errorToThrow = new Error(
        `An non-error value was thrown: ${String(error)}`,
      );
    }

    // Log the final error message being thrown
    console.error(
      'Error being thrown from createAssociation catch block:',
      errorToThrow.message,
    );

    // Re-throw the processed Error object
    throw errorToThrow;
  }
};

/**
 * Update an association
 */
export const updateAssociation = async (
  associationId: string,
  data: Partial<Association>,
): Promise<void> => {
  try {
    const dbData = {
      name: data.name,
      description: data.description,
      logo: data.logo,
      address: data.address,
      contact_email: data.contactEmail,
      contact_phone: data.contactPhone,
      website: data.website,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('associations')
      .update(dbData)
      .eq('id', associationId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating association:', error);
    throw error;
  }
};

/**
 * Join an association with an invitation code
 */
export const joinAssociationWithCode = async (
  code: string,
  userId: string,
): Promise<{ success: boolean; error?: string; association?: Association }> => {
  try {
    console.log(
      'Attempting to join association with code:',
      code,
      'for user:',
      userId,
    );

    // 1. Validate the invitation code
    const { data: invitation, error: inviteError } = await supabase
      .from('association_invitations')
      .select('*')
      .eq('code', code)
      .single();

    if (inviteError) {
      console.error('Error fetching invitation:', inviteError);
      return {
        success: false,
        error: 'Invalid invitation code',
      };
    }

    if (!invitation) {
      return {
        success: false,
        error: 'Invitation not found',
      };
    }

    // 2. Check if the invitation is expired
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);
    if (now > expiresAt) {
      return {
        success: false,
        error: 'Invitation has expired',
      };
    }

    // 3. Get the association
    const { data: association, error: associationError } = await supabase
      .from('associations')
      .select('*')
      .eq('id', invitation.association_id)
      .single();

    if (associationError || !association) {
      console.error('Error fetching association:', associationError);
      return {
        success: false,
        error: 'Could not find association',
      };
    }

    // 4. Check if user is already a member
    const { data: existingMember } = await supabase
      .from('association_members')
      .select('id')
      .eq('user_id', userId)
      .eq('association_id', invitation.association_id)
      .single();

    if (existingMember) {
      // User is already a member
      return {
        success: false,
        error: 'You are already a member of this association',
      };
    }

    // 5. Add user to association members
    const { error: addMemberError } = await supabase
      .from('association_members')
      .insert({
        user_id: userId,
        association_id: invitation.association_id,
      });

    if (addMemberError) {
      console.error('Error adding member to association:', addMemberError);
      return {
        success: false,
        error: 'Failed to join association',
      };
    }

    // 6. Update user's role if specified in invitation
    if (invitation.role) {
      await supabase
        .from('profiles')
        .update({ role: invitation.role })
        .eq('id', userId);
    }

    // 7. Mark invitation as used (optional)
    await supabase
      .from('association_invitations')
      .update({
        used: true,
        used_by: userId,
        used_at: new Date().toISOString(),
      })
      .eq('code', code);

    // 8. Return success with the association data
    const formattedAssociation = formatAssociation(association);

    return {
      success: true,
      association: formattedAssociation,
    };
  } catch (error: any) {
    console.error('Error joining association:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
    };
  }
};
