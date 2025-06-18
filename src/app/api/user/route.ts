import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(_request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch additional user data if needed
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: profile?.display_name || user.user_metadata?.display_name || 'User',
      profile: profile || null,
      metadata: user.user_metadata,
    });
  } catch (error) {
    console.error('Error in user API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function PUT(_request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await _request.json();
    const { display_name, ...otherData } = body;

    // Update user metadata
    if (display_name !== undefined) {
      const { error: updateError } = await supabase.auth.updateUser({
        data: { display_name },
      });

      if (updateError) {
        throw updateError;
      }
    }

    // Update profile if exists
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: user.id,
      display_name,
      ...otherData,
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      console.error('Error updating profile:', profileError);
    }

    return NextResponse.json({
      message: 'User updated successfully',
      user: {
        id: user.id,
        email: user.email,
        display_name,
      },
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 400 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Implement user deletion logic
    // This should handle:
    // 1. Soft delete or hard delete
    // 2. Cleanup of related data
    // 3. Proper authorization checks

    return NextResponse.json(
      {
        error: 'User deletion not implemented',
      },
      { status: 501 },
    );
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 400 },
    );
  }
}
