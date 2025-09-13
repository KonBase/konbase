import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createDataAccessLayer } from '@/lib/db/data-access';

export async function POST(req: Request) {
  const dataAccess = createDataAccessLayer();
  try {
    const { email, password, displayName } = await req.json();
    if (!email || !password)
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const hashed = await bcrypt.hash(password, 10);
    // Create user and profile records
    const user = await dataAccess.executeQuerySingle<{ id: string }>(
      `
      INSERT INTO users (email, hashed_password)
      VALUES (<str>$1, <str>$2)
      RETURNING id
    `,
      [email, hashed]
    );

    if (!user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    await dataAccess.executeQuery(
      `
      INSERT INTO profiles (user_id, display_name)
      VALUES (<str>$1, <str>$2)
    `,
      [user.id, displayName ?? email]
    );

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to sign up';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
