import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { geldb } from '@/lib/db/gel';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    // Get user with profile to check 2FA status
    const user = await geldb.querySingle(`
      SELECT 
        u.hashed_password,
        p.two_factor_enabled,
        p.totp_secret
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.id = <str>$1
    `, [session.user.id]) as any;

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.hashed_password);
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    // Check if 2FA is enabled
    const requires2FA = user.two_factor_enabled && user.totp_secret;

    return NextResponse.json({ 
      success: true, 
      requires2FA,
      message: requires2FA ? 'Password verified. 2FA required.' : 'Access granted.'
    });
  } catch (error) {
    console.error('Password verification error:', error);
    return NextResponse.json(
      { error: 'Password verification failed' },
      { status: 500 }
    );
  }
}
