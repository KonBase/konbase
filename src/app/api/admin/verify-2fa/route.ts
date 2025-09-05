import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { geldb } from '@/lib/db/gel';
import speakeasy from 'speakeasy';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { totpCode } = await request.json();

    if (!totpCode || totpCode.length !== 6) {
      return NextResponse.json({ error: 'Valid 6-digit TOTP code is required' }, { status: 400 });
    }

    // Get user's TOTP secret
    const user = await geldb.querySingle(`
      SELECT p.totp_secret
      FROM profiles p
      WHERE p.user_id = <str>$1 AND p.two_factor_enabled = true
    `, [session.user.id]) as any;

    if (!user?.totp_secret) {
      return NextResponse.json({ error: '2FA not enabled for this user' }, { status: 400 });
    }

    // Verify TOTP code
    const isValid = speakeasy.totp.verify({
      secret: user.totp_secret,
      encoding: 'base32',
      token: totpCode,
      window: 1,
    });

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid TOTP code' }, { status: 401 });
    }

    return NextResponse.json({ 
      success: true,
      message: '2FA verification successful. Admin access granted.'
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    return NextResponse.json(
      { error: '2FA verification failed' },
      { status: 500 }
    );
  }
}
