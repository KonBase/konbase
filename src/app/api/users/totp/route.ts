import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createDataAccessLayer } from '@/lib/db/data-access';
import speakeasy from 'speakeasy';

export async function POST() {
  // Setup step: generate secret and return otpauth URL
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const secret = speakeasy.generateSecret({
    name: `KonBase (${session.user.email})`,
  });
  return NextResponse.json({
    secret: secret.base32,
    otpauth_url: secret.otpauth_url,
  });
}

export async function PATCH(req: NextRequest) {
  // Enable with code + persist
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const dataAccess = createDataAccessLayer();
  const { secret, token } = await req.json();
  const ok = speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 1,
  });
  if (!ok) return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
  const recovery = Array.from({ length: 10 }, () =>
    Math.random().toString(36).slice(2, 10)
  );
  await dataAccess.executeQuery(
    `
    UPDATE profiles 
    SET two_factor_enabled = true, totp_secret = <str>$1, recovery_keys = <json>$2
    WHERE user_id = <str>$3
  `,
    [secret, recovery, session.user.id]
  );
  return NextResponse.json({ success: true, recovery });
}

export async function DELETE() {
  const dataAccess = createDataAccessLayer();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await dataAccess.executeQuery(
    `
    UPDATE profiles 
    SET two_factor_enabled = false, totp_secret = null, recovery_keys = <json>$1
    WHERE user_id = <str>$2
  `,
    [[], session.user.id]
  );
  return NextResponse.json({ success: true });
}
