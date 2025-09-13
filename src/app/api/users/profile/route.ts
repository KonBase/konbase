import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { createDataAccessLayer } from '@/lib/db/data-access';
import bcrypt from 'bcryptjs';

export async function GET() {
  const dataAccess = createDataAccessLayer();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const profile = (await dataAccess.executeQuerySingle(
    `
    SELECT * FROM profiles WHERE user_id = <str>$1
  `,
    [session.user.id]
  )) as unknown;
  return NextResponse.json({ data: profile });
}

export async function PATCH(req: NextRequest) {
  const dataAccess = createDataAccessLayer();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const { display_name, avatar_url, preferences } = body;

  const profile = (await dataAccess.executeQuerySingle(
    `
    UPDATE profiles 
    SET display_name = <str>$1, avatar_url = <str>$2, preferences = <json>$3
    WHERE user_id = <str>$4
    RETURNING *
  `,
    [display_name, avatar_url, preferences, session.user.id]
  )) as unknown;

  if (!profile)
    return NextResponse.json({ error: 'Profile not found' }, { status: 400 });
  return NextResponse.json({ data: profile });
}

export async function POST(req: NextRequest) {
  const dataAccess = createDataAccessLayer();
  // change password
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { currentPassword, newPassword } = await req.json();
  const user = (await dataAccess.executeQuerySingle(
    `
    SELECT * FROM users WHERE id = <str>$1
  `,
    [session.user.id]
  )) as { hashed_password: string } | null;
  if (!user?.hashed_password)
    return NextResponse.json({ error: 'No password set' }, { status: 400 });
  const ok = await bcrypt.compare(currentPassword, user.hashed_password);
  if (!ok)
    return NextResponse.json(
      { error: 'Invalid current password' },
      { status: 400 }
    );
  const hashed = await bcrypt.hash(newPassword, 10);
  await dataAccess.executeQuery(
    `
    UPDATE users SET hashed_password = <str>$1 WHERE id = <str>$2
  `,
    [hashed, session.user.id]
  );
  return NextResponse.json({ success: true });
}
